const Report = require('../models/Report');
const NGO = require('../models/NGO');
const aiService = require('../services/aiService');
const geoService = require('../services/geoService');
const mediaService = require('../services/mediaService');
const notificationService = require('../services/notificationService');

/**
 * Create new injury report (Agentic Flow - Phase 1)
 */
async function createReport(req, res) {
  try {
    const { latitude, longitude, userEditedDescription } = req.body;
    const citizenId = req.user.userId;
    
    // Validate uploaded files
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'At least one image is required' });
    }
    
    // Step 1: Upload media files
    const uploadedFiles = [];
    for (const file of req.files) {
      const fileUrl = await mediaService.uploadFile(file);
      uploadedFiles.push(fileUrl);
    }
    
    // Step 2: AI Analysis (Agent 1)
    const aiAnalysis = await aiService.analyzeMedia(
      uploadedFiles[0],
      userEditedDescription,
      'injury'
    );
    
    // Step 3: Determine severity and radius (Agent 2)
    const { initialRadius } = geoService.getRadiusForSeverity(aiAnalysis.severity);
    
    // Create report in database
    const reportId = await Report.create({
      citizenId,
      latitude,
      longitude,
      aiGeneratedDescription: aiAnalysis.generatedDescription,
      userEditedDescription,
      animalType: aiAnalysis.animalType,
      injurySeverity: aiAnalysis.severity,
      aiConfidence: aiAnalysis.confidence
    });
    
    // Save images
    for (const fileUrl of uploadedFiles) {
      await Report.addImage(reportId, fileUrl);
    }
    
    // Step 4: Find nearby NGOs (Agent 3)
    const allNGOs = await NGO.findAll();
    const nearbyNGOs = geoService.findNGOsWithinRadius(
      allNGOs,
      parseFloat(latitude),
      parseFloat(longitude),
      initialRadius
    );
    
    // Step 5: Assign to nearest NGO (Agent 4)
    if (nearbyNGOs.length > 0) {
      const nearestNGO = nearbyNGOs[0];
      await Report.assignToNGO(reportId, nearestNGO.id);
      
      // Create notification for NGO
      await notificationService.createNotification(
        nearestNGO.user_id,
        'injury',
        'New Injury Report Assigned',
        `A ${aiAnalysis.severity} severity ${aiAnalysis.animalType} injury has been reported ${nearestNGO.distance} km from your location.`,
        'report',
        reportId
      );
      
      // Create notification for citizen
      await notificationService.createNotification(
        citizenId,
        'injury',
        'Report Submitted Successfully',
        `Your injury report has been assigned to ${nearestNGO.organization_name}.`,
        'report',
        reportId
      );
    } else {
      // No NGOs found - mark as unassigned
      await Report.updateStatus(reportId, 'unassigned', 'No NGOs found within search radius');
      
      await notificationService.createNotification(
        citizenId,
        'injury',
        'Report Submitted',
        'Your report has been submitted but no NGOs are available in your area. We will notify you when an NGO becomes available.',
        'report',
        reportId
      );
    }
    
    // Fetch created report
    const report = await Report.findById(reportId);
    
    res.status(201).json({
      success: true,
      message: 'Report created successfully',
      report
    });
  } catch (error) {
    console.error('Create report error:', error);
    res.status(500).json({ error: 'Failed to create report' });
  }
}

/**
 * Get report by ID
 */
async function getReport(req, res) {
  try {
    const { id } = req.params;
    
    const report = await Report.findById(id);
    if (!report) {
      return res.status(404).json({ error: 'Report not found' });
    }
    
    // Get images
    const images = await Report.getImages(id);
    report.images = images;
    
    // Get status history
    const history = await Report.getStatusHistory(id);
    report.statusHistory = history;
    
    res.json({ success: true, report });
  } catch (error) {
    console.error('Get report error:', error);
    res.status(500).json({ error: 'Failed to fetch report' });
  }
}

/**
 * Get user's reports
 */
async function getUserReports(req, res) {
  try {
    const reports = await Report.findByCitizenId(req.user.userId);
    res.json({ success: true, reports });
  } catch (error) {
    console.error('Get user reports error:', error);
    res.status(500).json({ error: 'Failed to fetch reports' });
  }
}

/**
 * Get NGO's assigned reports
 */
async function getNGOReports(req, res) {
  try {
    const ngo = await NGO.findByUserId(req.user.userId);
    if (!ngo) {
      return res.status(404).json({ error: 'NGO profile not found' });
    }
    
    const reports = await Report.findByNGOId(ngo.id);
    res.json({ success: true, reports });
  } catch (error) {
    console.error('Get NGO reports error:', error);
    res.status(500).json({ error: 'Failed to fetch reports' });
  }
}

/**
 * Accept report (NGO only)
 */
async function acceptReport(req, res) {
  try {
    const { id } = req.params;
    
    const report = await Report.findById(id);
    if (!report) {
      return res.status(404).json({ error: 'Report not found' });
    }
    
    // Update status
    await Report.updateStatus(id, 'in_progress', 'NGO accepted the case');
    
    // Notify citizen
    await notificationService.createNotification(
      report.citizen_id,
      'injury',
      'Report Accepted',
      `${report.ngo_name} has accepted your injury report and will begin rescue operations.`,
      'report',
      id
    );
    
    res.json({ success: true, message: 'Report accepted successfully' });
  } catch (error) {
    console.error('Accept report error:', error);
    res.status(500).json({ error: 'Failed to accept report' });
  }
}

/**
 * Update report status (NGO only)
 */
async function updateReportStatus(req, res) {
  try {
    const { id } = req.params;
    const { status, notes } = req.body;
    
    const report = await Report.findById(id);
    if (!report) {
      return res.status(404).json({ error: 'Report not found' });
    }
    
    await Report.updateStatus(id, status, notes);
    
    // Notify citizen
    await notificationService.createNotification(
      report.citizen_id,
      'injury',
      'Report Status Updated',
      `Your injury report status has been updated to: ${status}`,
      'report',
      id
    );
    
    res.json({ success: true, message: 'Status updated successfully' });
  } catch (error) {
    console.error('Update status error:', error);
    res.status(500).json({ error: 'Failed to update status' });
  }
}

module.exports = {
  createReport,
  getReport,
  getUserReports,
  getNGOReports,
  acceptReport,
  updateReportStatus
};
