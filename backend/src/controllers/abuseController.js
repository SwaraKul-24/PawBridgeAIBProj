const AbuseReport = require('../models/AbuseReport');
const NGO = require('../models/NGO');
const aiService = require('../services/aiService');
const geoService = require('../services/geoService');
const mediaService = require('../services/mediaService');
const notificationService = require('../services/notificationService');

/**
 * Create new abuse report (anonymous or authenticated)
 */
async function createAbuseReport(req, res) {
  try {
    const { latitude, longitude, userEditedDescription, isAnonymous, stateDetails } = req.body;
    const reporterId = req.user ? req.user.userId : null;
    
    // Validate uploaded files
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'At least one image or video is required' });
    }
    
    // Generate unique tracking ID
    const trackingId = AbuseReport.generateTrackingId();
    
    // Step 1: Upload media files
    const uploadedFiles = [];
    for (const file of req.files) {
      const fileUrl = await mediaService.uploadFile(file);
      uploadedFiles.push({
        url: fileUrl,
        type: file.mimetype.startsWith('image/') ? 'image' : 'video',
        size: file.size
      });
    }
    
    // Step 2: AI Analysis
    const aiAnalysis = await aiService.analyzeMedia(
      uploadedFiles[0].url,
      userEditedDescription,
      'abuse'
    );
    
    // Step 3: Determine severity and radius
    const { initialRadius } = geoService.getRadiusForSeverity(aiAnalysis.severity);
    
    // Create abuse report in database
    const reportId = await AbuseReport.create({
      reporterId,
      trackingId,
      isAnonymous: isAnonymous || !reporterId,
      latitude,
      longitude,
      stateDetails,
      aiGeneratedDescription: aiAnalysis.generatedDescription,
      userEditedDescription,
      abuseType: aiAnalysis.animalType, // Map to abuse type for now
      abuseSeverity: aiAnalysis.severity,
      aiConfidence: aiAnalysis.confidence
    });
    
    // Save media files
    for (const file of uploadedFiles) {
      await AbuseReport.addMedia(reportId, file.type, file.url, file.url, file.size);
    }
    
    // Step 4: Find nearby NGOs
    const allNGOs = await NGO.findAll();
    const nearbyNGOs = geoService.findNGOsWithinRadius(
      allNGOs,
      parseFloat(latitude),
      parseFloat(longitude),
      initialRadius
    );
    
    // Step 5: Assign to nearest NGO
    if (nearbyNGOs.length > 0) {
      const nearestNGO = nearbyNGOs[0];
      await AbuseReport.assignToNGO(reportId, nearestNGO.id);
      
      // Create notification for NGO
      await notificationService.createNotification(
        nearestNGO.user_id,
        'abuse',
        'New Abuse Report Assigned',
        `A ${aiAnalysis.severity} severity abuse case has been reported ${nearestNGO.distance} km from your location.`,
        'abuse_report',
        reportId
      );
      
      // Create notification for reporter (if not anonymous)
      if (!isAnonymous && reporterId) {
        await notificationService.createNotification(
          reporterId,
          'abuse',
          'Abuse Report Submitted Successfully',
          `Your abuse report has been assigned to ${nearestNGO.organization_name}. Tracking ID: ${trackingId}`,
          'abuse_report',
          reportId
        );
      }
    } else {
      // No NGOs found - mark as unassigned
      await AbuseReport.updateStatus(reportId, 'unassigned', 'No NGOs found within search radius');
    }
    
    // Fetch created report
    const report = await AbuseReport.findById(reportId);
    
    res.status(201).json({
      success: true,
      message: 'Abuse report submitted successfully',
      data: {
        id: reportId,
        trackingId,
        status: report.status,
        abuseType: report.abuse_type,
        abuseSeverity: report.abuse_severity,
        aiGeneratedDescription: report.ai_generated_description,
        userEditedDescription: report.user_edited_description,
        aiConfidence: report.ai_confidence,
        isAnonymous: report.is_anonymous,
        assignedNgo: report.ngo_name || null,
        createdAt: report.created_at,
        trackingUrl: `/abuse/track/${trackingId}`
      }
    });
  } catch (error) {
    console.error('Create abuse report error:', error);
    res.status(500).json({ error: 'Failed to create abuse report' });
  }
}

/**
 * Get abuse report by ID
 */
async function getAbuseReport(req, res) {
  try {
    const { id } = req.params;
    
    const report = await AbuseReport.findById(id);
    if (!report) {
      return res.status(404).json({ error: 'Abuse report not found' });
    }
    
    // Check access permissions
    if (report.is_anonymous && (!req.user || req.user.role !== 'admin')) {
      // Anonymous reports can only be accessed by admin or via tracking ID
      return res.status(403).json({ error: 'Access denied' });
    }
    
    if (report.reporter_id && req.user && req.user.userId !== report.reporter_id && req.user.role !== 'admin') {
      // Non-anonymous reports can only be accessed by reporter or admin
      return res.status(403).json({ error: 'Access denied' });
    }
    
    // Get media files
    const media = await AbuseReport.getMedia(id);
    report.media = media;
    
    // Get status history
    const history = await AbuseReport.getStatusHistory(id);
    report.statusHistory = history;
    
    res.json({ success: true, data: report });
  } catch (error) {
    console.error('Get abuse report error:', error);
    res.status(500).json({ error: 'Failed to fetch abuse report' });
  }
}

/**
 * Track abuse report by tracking ID (anonymous access)
 */
async function trackAbuseReport(req, res) {
  try {
    const { trackingId } = req.params;
    
    const report = await AbuseReport.findByTrackingId(trackingId);
    if (!report) {
      return res.status(404).json({ error: 'Tracking ID not found' });
    }
    
    // Get status history
    const history = await AbuseReport.getStatusHistory(report.id);
    
    res.json({
      success: true,
      data: {
        trackingId: report.tracking_id,
        status: report.status,
        statusHistory: history,
        assignedNgo: report.ngo_name ? {
          name: report.ngo_name
        } : null,
        lastUpdated: report.updated_at,
        createdAt: report.created_at
      }
    });
  } catch (error) {
    console.error('Track abuse report error:', error);
    res.status(500).json({ error: 'Failed to track abuse report' });
  }
}

/**
 * Get user's abuse reports
 */
async function getUserAbuseReports(req, res) {
  try {
    const reports = await AbuseReport.findByReporterId(req.user.userId);
    res.json({ success: true, data: reports });
  } catch (error) {
    console.error('Get user abuse reports error:', error);
    res.status(500).json({ error: 'Failed to fetch abuse reports' });
  }
}

/**
 * Get NGO's assigned abuse reports
 */
async function getNGOAbuseReports(req, res) {
  try {
    const ngo = await NGO.findByUserId(req.user.userId);
    if (!ngo) {
      return res.status(404).json({ error: 'NGO profile not found' });
    }
    
    const reports = await AbuseReport.findByNGOId(ngo.id);
    res.json({ success: true, data: reports });
  } catch (error) {
    console.error('Get NGO abuse reports error:', error);
    res.status(500).json({ error: 'Failed to fetch abuse reports' });
  }
}

/**
 * Accept abuse report (NGO only)
 */
async function acceptAbuseReport(req, res) {
  try {
    const { id } = req.params;
    
    const report = await AbuseReport.findById(id);
    if (!report) {
      return res.status(404).json({ error: 'Abuse report not found' });
    }
    
    // Update status
    await AbuseReport.updateStatus(id, 'in_progress', 'NGO accepted the abuse case');
    
    // Notify reporter (if not anonymous)
    if (!report.is_anonymous && report.reporter_id) {
      await notificationService.createNotification(
        report.reporter_id,
        'abuse',
        'Abuse Report Accepted',
        `${report.ngo_name} has accepted your abuse report and will begin intervention.`,
        'abuse_report',
        id
      );
    }
    
    res.json({ success: true, message: 'Abuse report accepted successfully' });
  } catch (error) {
    console.error('Accept abuse report error:', error);
    res.status(500).json({ error: 'Failed to accept abuse report' });
  }
}

/**
 * Reject abuse report (NGO only)
 */
async function rejectAbuseReport(req, res) {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    
    const report = await AbuseReport.findById(id);
    if (!report) {
      return res.status(404).json({ error: 'Abuse report not found' });
    }
    
    // Update status
    await AbuseReport.updateStatus(id, 'rejected', reason || 'NGO rejected the case');
    
    // Notify reporter (if not anonymous)
    if (!report.is_anonymous && report.reporter_id) {
      await notificationService.createNotification(
        report.reporter_id,
        'abuse',
        'Abuse Report Status Update',
        'Your abuse report has been rejected. The system will attempt to assign it to another NGO.',
        'abuse_report',
        id
      );
    }
    
    res.json({ success: true, message: 'Abuse report rejected successfully' });
  } catch (error) {
    console.error('Reject abuse report error:', error);
    res.status(500).json({ error: 'Failed to reject abuse report' });
  }
}

/**
 * Update abuse report status (NGO only)
 */
async function updateAbuseReportStatus(req, res) {
  try {
    const { id } = req.params;
    const { status, notes } = req.body;
    
    const report = await AbuseReport.findById(id);
    if (!report) {
      return res.status(404).json({ error: 'Abuse report not found' });
    }
    
    await AbuseReport.updateStatus(id, status, notes);
    
    // Notify reporter (if not anonymous)
    if (!report.is_anonymous && report.reporter_id) {
      await notificationService.createNotification(
        report.reporter_id,
        'abuse',
        'Abuse Report Status Updated',
        `Your abuse report status has been updated to: ${status}`,
        'abuse_report',
        id
      );
    }
    
    res.json({ success: true, message: 'Status updated successfully' });
  } catch (error) {
    console.error('Update abuse status error:', error);
    res.status(500).json({ error: 'Failed to update status' });
  }
}

module.exports = {
  createAbuseReport,
  getAbuseReport,
  trackAbuseReport,
  getUserAbuseReports,
  getNGOAbuseReports,
  acceptAbuseReport,
  rejectAbuseReport,
  updateAbuseReportStatus
};