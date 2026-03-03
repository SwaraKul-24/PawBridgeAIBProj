const Volunteer = require('../models/Volunteer');
const NGO = require('../models/NGO');
const notificationService = require('../services/notificationService');
const emailService = require('../services/emailService');

/**
 * Create or update volunteer profile
 */
async function createVolunteerProfile(req, res) {
  try {
    const {
      skills,
      availability,
      latitude,
      longitude,
      bio
    } = req.body;

    const volunteerId = await Volunteer.createOrUpdate({
      userId: req.user.userId,
      skills,
      availability,
      latitude: latitude ? parseFloat(latitude) : null,
      longitude: longitude ? parseFloat(longitude) : null,
      bio
    });

    const volunteer = await Volunteer.findById(volunteerId);

    res.status(201).json({
      success: true,
      message: 'Volunteer profile created/updated successfully',
      data: volunteer
    });
  } catch (error) {
    console.error('Create volunteer profile error:', error);
    res.status(500).json({ error: 'Failed to create volunteer profile' });
  }
}

/**
 * Get volunteer profile
 */
async function getVolunteerProfile(req, res) {
  try {
    const volunteer = await Volunteer.findByUserId(req.user.userId);
    
    if (!volunteer) {
      return res.status(404).json({ error: 'Volunteer profile not found' });
    }

    res.json({
      success: true,
      data: volunteer
    });
  } catch (error) {
    console.error('Get volunteer profile error:', error);
    res.status(500).json({ error: 'Failed to fetch volunteer profile' });
  }
}

/**
 * Get all volunteers (NGO only)
 */
async function getVolunteers(req, res) {
  try {
    if (req.user.role !== 'ngo') {
      return res.status(403).json({ error: 'Access denied. NGO role required.' });
    }

    const {
      skills,
      availability,
      latitude,
      longitude,
      radius,
      limit
    } = req.query;

    const filters = {
      skills,
      availability,
      limit: limit ? parseInt(limit) : null
    };

    // Add location filter if provided
    if (latitude && longitude && radius) {
      filters.location = {
        lat: parseFloat(latitude),
        lng: parseFloat(longitude)
      };
      filters.radius = parseFloat(radius);
    }

    const volunteers = await Volunteer.findAll(filters);

    res.json({
      success: true,
      data: volunteers,
      count: volunteers.length
    });
  } catch (error) {
    console.error('Get volunteers error:', error);
    res.status(500).json({ error: 'Failed to fetch volunteers' });
  }
}

/**
 * Get volunteer by ID (NGO only)
 */
async function getVolunteer(req, res) {
  try {
    if (req.user.role !== 'ngo') {
      return res.status(403).json({ error: 'Access denied. NGO role required.' });
    }

    const { id } = req.params;
    const volunteer = await Volunteer.findById(id);

    if (!volunteer) {
      return res.status(404).json({ error: 'Volunteer not found' });
    }

    res.json({
      success: true,
      data: volunteer
    });
  } catch (error) {
    console.error('Get volunteer error:', error);
    res.status(500).json({ error: 'Failed to fetch volunteer' });
  }
}

/**
 * Delete volunteer profile
 */
async function deleteVolunteerProfile(req, res) {
  try {
    await Volunteer.deleteByUserId(req.user.userId);

    res.json({
      success: true,
      message: 'Volunteer profile deleted successfully'
    });
  } catch (error) {
    console.error('Delete volunteer profile error:', error);
    res.status(500).json({ error: 'Failed to delete volunteer profile' });
  }
}

/**
 * Create volunteering opportunity (NGO only)
 */
async function createOpportunity(req, res) {
  try {
    if (req.user.role !== 'ngo') {
      return res.status(403).json({ error: 'Access denied. NGO role required.' });
    }

    const {
      title,
      description,
      requiredSkills,
      location,
      latitude,
      longitude,
      date,
      time
    } = req.body;

    // Get NGO profile
    const ngo = await NGO.findByUserId(req.user.userId);
    if (!ngo) {
      return res.status(404).json({ error: 'NGO profile not found' });
    }

    const opportunityId = await Volunteer.createOpportunity({
      ngoId: ngo.id,
      title,
      description,
      requiredSkills,
      location,
      latitude: latitude ? parseFloat(latitude) : null,
      longitude: longitude ? parseFloat(longitude) : null,
      date,
      time
    });

    const opportunity = await Volunteer.findOpportunityById(opportunityId);

    // Find matching volunteers and send email notifications
    if (requiredSkills) {
      const matchingVolunteers = await Volunteer.searchBySkills(requiredSkills);
      
      for (const volunteer of matchingVolunteers) {
        try {
          await emailService.sendEmail(
            volunteer.email,
            'New Volunteering Opportunity',
            `Hi ${volunteer.name},\n\nA new volunteering opportunity matching your skills has been posted:\n\nTitle: ${title}\nOrganization: ${ngo.organization_name}\nLocation: ${location || 'Not specified'}\nDate: ${date || 'Not specified'}\n\nDescription:\n${description}\n\nTo view more details and apply, please log in to PawBridge.\n\nBest regards,\nPawBridge Team`
          );
        } catch (emailError) {
          console.error('Failed to send email to volunteer:', volunteer.email, emailError);
        }
      }
    }

    res.status(201).json({
      success: true,
      message: 'Volunteering opportunity created successfully',
      data: opportunity
    });
  } catch (error) {
    console.error('Create opportunity error:', error);
    res.status(500).json({ error: 'Failed to create volunteering opportunity' });
  }
}

/**
 * Get all volunteering opportunities
 */
async function getOpportunities(req, res) {
  try {
    const {
      ngoId,
      skills,
      date,
      latitude,
      longitude,
      radius,
      limit
    } = req.query;

    const filters = {
      ngoId: ngoId ? parseInt(ngoId) : null,
      skills,
      date,
      limit: limit ? parseInt(limit) : null
    };

    // Add location filter if provided
    if (latitude && longitude && radius) {
      filters.location = {
        lat: parseFloat(latitude),
        lng: parseFloat(longitude)
      };
      filters.radius = parseFloat(radius);
    }

    const opportunities = await Volunteer.findOpportunities(filters);

    res.json({
      success: true,
      data: opportunities,
      count: opportunities.length
    });
  } catch (error) {
    console.error('Get opportunities error:', error);
    res.status(500).json({ error: 'Failed to fetch opportunities' });
  }
}

/**
 * Get opportunity by ID
 */
async function getOpportunity(req, res) {
  try {
    const { id } = req.params;
    const opportunity = await Volunteer.findOpportunityById(id);

    if (!opportunity) {
      return res.status(404).json({ error: 'Opportunity not found' });
    }

    res.json({
      success: true,
      data: opportunity
    });
  } catch (error) {
    console.error('Get opportunity error:', error);
    res.status(500).json({ error: 'Failed to fetch opportunity' });
  }
}

/**
 * Get NGO's opportunities
 */
async function getNGOOpportunities(req, res) {
  try {
    if (req.user.role !== 'ngo') {
      return res.status(403).json({ error: 'Access denied. NGO role required.' });
    }

    const ngo = await NGO.findByUserId(req.user.userId);
    if (!ngo) {
      return res.status(404).json({ error: 'NGO profile not found' });
    }

    const opportunities = await Volunteer.findOpportunitiesByNGOId(ngo.id);

    res.json({
      success: true,
      data: opportunities
    });
  } catch (error) {
    console.error('Get NGO opportunities error:', error);
    res.status(500).json({ error: 'Failed to fetch opportunities' });
  }
}

/**
 * Update opportunity (NGO only)
 */
async function updateOpportunity(req, res) {
  try {
    if (req.user.role !== 'ngo') {
      return res.status(403).json({ error: 'Access denied. NGO role required.' });
    }

    const { id } = req.params;
    const updateData = req.body;

    // Check if opportunity exists and belongs to NGO
    const opportunity = await Volunteer.findOpportunityById(id);
    if (!opportunity) {
      return res.status(404).json({ error: 'Opportunity not found' });
    }

    const ngo = await NGO.findByUserId(req.user.userId);
    if (!ngo || opportunity.ngo_id !== ngo.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Update opportunity
    await Volunteer.updateOpportunity(id, updateData);

    // Fetch updated opportunity
    const updatedOpportunity = await Volunteer.findOpportunityById(id);

    res.json({
      success: true,
      message: 'Opportunity updated successfully',
      data: updatedOpportunity
    });
  } catch (error) {
    console.error('Update opportunity error:', error);
    res.status(500).json({ error: 'Failed to update opportunity' });
  }
}

/**
 * Update opportunity status (NGO only)
 */
async function updateOpportunityStatus(req, res) {
  try {
    if (req.user.role !== 'ngo') {
      return res.status(403).json({ error: 'Access denied. NGO role required.' });
    }

    const { id } = req.params;
    const { status } = req.body;

    // Validate status
    const validStatuses = ['open', 'filled', 'completed'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    // Check if opportunity exists and belongs to NGO
    const opportunity = await Volunteer.findOpportunityById(id);
    if (!opportunity) {
      return res.status(404).json({ error: 'Opportunity not found' });
    }

    const ngo = await NGO.findByUserId(req.user.userId);
    if (!ngo || opportunity.ngo_id !== ngo.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Update status
    await Volunteer.updateOpportunityStatus(id, status);

    res.json({
      success: true,
      message: 'Opportunity status updated successfully'
    });
  } catch (error) {
    console.error('Update opportunity status error:', error);
    res.status(500).json({ error: 'Failed to update opportunity status' });
  }
}

/**
 * Delete opportunity (NGO only)
 */
async function deleteOpportunity(req, res) {
  try {
    if (req.user.role !== 'ngo') {
      return res.status(403).json({ error: 'Access denied. NGO role required.' });
    }

    const { id } = req.params;

    // Check if opportunity exists and belongs to NGO
    const opportunity = await Volunteer.findOpportunityById(id);
    if (!opportunity) {
      return res.status(404).json({ error: 'Opportunity not found' });
    }

    const ngo = await NGO.findByUserId(req.user.userId);
    if (!ngo || opportunity.ngo_id !== ngo.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Delete opportunity
    await Volunteer.deleteOpportunity(id);

    res.json({
      success: true,
      message: 'Opportunity deleted successfully'
    });
  } catch (error) {
    console.error('Delete opportunity error:', error);
    res.status(500).json({ error: 'Failed to delete opportunity' });
  }
}

module.exports = {
  createVolunteerProfile,
  getVolunteerProfile,
  getVolunteers,
  getVolunteer,
  deleteVolunteerProfile,
  createOpportunity,
  getOpportunities,
  getOpportunity,
  getNGOOpportunities,
  updateOpportunity,
  updateOpportunityStatus,
  deleteOpportunity
};