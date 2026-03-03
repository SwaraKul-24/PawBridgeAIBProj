const Adoption = require('../models/Adoption');
const Animal = require('../models/Animal');
const NGO = require('../models/NGO');
const notificationService = require('../services/notificationService');

/**
 * Create adoption request
 */
async function createAdoptionRequest(req, res) {
  try {
    const { animalId, message } = req.body;
    const citizenId = req.user.userId;

    // Check if animal exists and is available
    const animal = await Animal.findById(animalId);
    if (!animal) {
      return res.status(404).json({ error: 'Animal not found' });
    }

    if (animal.status !== 'available') {
      return res.status(400).json({ error: 'Animal is not available for adoption' });
    }

    // Check if citizen already has a pending request for this animal
    const hasPending = await Adoption.hasPendingRequest(citizenId, animalId);
    if (hasPending) {
      return res.status(400).json({ error: 'You already have a pending request for this animal' });
    }

    // Create adoption request
    const requestId = await Adoption.create({
      animalId,
      citizenId,
      message
    });

    // Notify NGO
    await notificationService.createNotification(
      animal.ngo_user_id,
      'adoption',
      'New Adoption Request',
      `${req.user.name} has requested to adopt ${animal.name}.`,
      'adoption_request',
      requestId
    );

    // Fetch created request
    const request = await Adoption.findById(requestId);

    res.status(201).json({
      success: true,
      message: 'Adoption request submitted successfully',
      data: request
    });
  } catch (error) {
    console.error('Create adoption request error:', error);
    res.status(500).json({ error: 'Failed to create adoption request' });
  }
}

/**
 * Get adoption request by ID
 */
async function getAdoptionRequest(req, res) {
  try {
    const { id } = req.params;

    const request = await Adoption.findById(id);
    if (!request) {
      return res.status(404).json({ error: 'Adoption request not found' });
    }

    // Check access permissions
    if (req.user.userId !== request.citizen_id && 
        req.user.userId !== request.ngo_user_id && 
        req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json({
      success: true,
      data: request
    });
  } catch (error) {
    console.error('Get adoption request error:', error);
    res.status(500).json({ error: 'Failed to fetch adoption request' });
  }
}

/**
 * Get user's adoption requests
 */
async function getUserAdoptionRequests(req, res) {
  try {
    const requests = await Adoption.findByCitizenId(req.user.userId);

    res.json({
      success: true,
      data: requests
    });
  } catch (error) {
    console.error('Get user adoption requests error:', error);
    res.status(500).json({ error: 'Failed to fetch adoption requests' });
  }
}

/**
 * Get NGO's adoption requests
 */
async function getNGOAdoptionRequests(req, res) {
  try {
    const ngo = await NGO.findByUserId(req.user.userId);
    if (!ngo) {
      return res.status(404).json({ error: 'NGO profile not found' });
    }

    const requests = await Adoption.findByNGOId(ngo.id);

    res.json({
      success: true,
      data: requests
    });
  } catch (error) {
    console.error('Get NGO adoption requests error:', error);
    res.status(500).json({ error: 'Failed to fetch adoption requests' });
  }
}

/**
 * Get adoption requests for specific animal
 */
async function getAnimalAdoptionRequests(req, res) {
  try {
    const { animalId } = req.params;

    // Check if animal exists and user has access
    const animal = await Animal.findById(animalId);
    if (!animal) {
      return res.status(404).json({ error: 'Animal not found' });
    }

    // Only NGO that owns the animal can see its adoption requests
    if (req.user.userId !== animal.ngo_user_id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied' });
    }

    const requests = await Adoption.findByAnimalId(animalId);

    res.json({
      success: true,
      data: requests
    });
  } catch (error) {
    console.error('Get animal adoption requests error:', error);
    res.status(500).json({ error: 'Failed to fetch adoption requests' });
  }
}

/**
 * Update adoption request status (NGO only)
 */
async function updateAdoptionRequestStatus(req, res) {
  try {
    const { id } = req.params;
    const { status, ngoNotes } = req.body;

    const request = await Adoption.findById(id);
    if (!request) {
      return res.status(404).json({ error: 'Adoption request not found' });
    }

    // Check if user is the NGO that owns the animal
    if (req.user.userId !== request.ngo_user_id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Update request status
    await Adoption.updateStatus(id, status, ngoNotes);

    // Update animal status if approved
    if (status === 'approved') {
      await Animal.updateStatus(request.animal_id, 'pending');
    }

    // Notify citizen
    const statusMessage = status === 'approved' 
      ? `Your adoption request for ${request.animal_name} has been approved!`
      : `Your adoption request for ${request.animal_name} has been ${status}.`;

    await notificationService.createNotification(
      request.citizen_id,
      'adoption',
      'Adoption Request Update',
      statusMessage,
      'adoption_request',
      id
    );

    res.json({
      success: true,
      message: 'Adoption request status updated successfully'
    });
  } catch (error) {
    console.error('Update adoption request status error:', error);
    res.status(500).json({ error: 'Failed to update adoption request status' });
  }
}

/**
 * Cancel adoption request (citizen only)
 */
async function cancelAdoptionRequest(req, res) {
  try {
    const { id } = req.params;

    const request = await Adoption.findById(id);
    if (!request) {
      return res.status(404).json({ error: 'Adoption request not found' });
    }

    // Check if user is the citizen who made the request
    if (req.user.userId !== request.citizen_id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Can only cancel pending requests
    if (request.status !== 'pending') {
      return res.status(400).json({ error: 'Can only cancel pending requests' });
    }

    // Delete the request
    await Adoption.deleteById(id);

    // Notify NGO
    await notificationService.createNotification(
      request.ngo_user_id,
      'adoption',
      'Adoption Request Cancelled',
      `${request.citizen_name} has cancelled their adoption request for ${request.animal_name}.`,
      'adoption_request',
      id
    );

    res.json({
      success: true,
      message: 'Adoption request cancelled successfully'
    });
  } catch (error) {
    console.error('Cancel adoption request error:', error);
    res.status(500).json({ error: 'Failed to cancel adoption request' });
  }
}

/**
 * Mark animal as adopted (NGO only)
 */
async function markAnimalAsAdopted(req, res) {
  try {
    const { animalId } = req.params;
    const { adoptionRequestId } = req.body;

    // Check if animal exists
    const animal = await Animal.findById(animalId);
    if (!animal) {
      return res.status(404).json({ error: 'Animal not found' });
    }

    // Check if user is the NGO that owns the animal
    if (req.user.userId !== animal.ngo_user_id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Verify adoption request exists and is approved
    if (adoptionRequestId) {
      const request = await Adoption.findById(adoptionRequestId);
      if (!request || request.status !== 'approved' || request.animal_id !== animalId) {
        return res.status(400).json({ error: 'Invalid adoption request' });
      }
    }

    // Update animal status to adopted
    await Animal.updateStatus(animalId, 'adopted');

    // Notify the adopter if request ID provided
    if (adoptionRequestId) {
      const request = await Adoption.findById(adoptionRequestId);
      await notificationService.createNotification(
        request.citizen_id,
        'adoption',
        'Adoption Completed',
        `Congratulations! You have successfully adopted ${animal.name}.`,
        'animal',
        animalId
      );
    }

    res.json({
      success: true,
      message: 'Animal marked as adopted successfully'
    });
  } catch (error) {
    console.error('Mark animal as adopted error:', error);
    res.status(500).json({ error: 'Failed to mark animal as adopted' });
  }
}

/**
 * Get adoption statistics (admin only)
 */
async function getAdoptionStatistics(req, res) {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied' });
    }

    const stats = await Adoption.getStatistics();

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Get adoption statistics error:', error);
    res.status(500).json({ error: 'Failed to fetch adoption statistics' });
  }
}

module.exports = {
  createAdoptionRequest,
  getAdoptionRequest,
  getUserAdoptionRequests,
  getNGOAdoptionRequests,
  getAnimalAdoptionRequests,
  updateAdoptionRequestStatus,
  cancelAdoptionRequest,
  markAnimalAsAdopted,
  getAdoptionStatistics
};