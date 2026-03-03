const Animal = require('../models/Animal');
const NGO = require('../models/NGO');
const mediaService = require('../services/mediaService');
const notificationService = require('../services/notificationService');

/**
 * Create new animal listing (NGO only)
 */
async function createAnimal(req, res) {
  try {
    const {
      name,
      species,
      breed,
      ageYears,
      ageMonths,
      gender,
      healthStatus,
      description
    } = req.body;

    // Get NGO profile
    const ngo = await NGO.findByUserId(req.user.userId);
    if (!ngo) {
      return res.status(404).json({ error: 'NGO profile not found' });
    }

    // Create animal
    const animalId = await Animal.create({
      ngoId: ngo.id,
      name,
      species,
      breed,
      ageYears: ageYears ? parseInt(ageYears) : null,
      ageMonths: ageMonths ? parseInt(ageMonths) : null,
      gender,
      healthStatus,
      description
    });

    // Handle image uploads
    if (req.files && req.files.length > 0) {
      for (let i = 0; i < req.files.length; i++) {
        const file = req.files[i];
        const imageUrl = await mediaService.uploadFile(file);
        await Animal.addImage(animalId, imageUrl, i === 0); // First image is primary
      }
    }

    // Fetch created animal with images
    const animal = await Animal.findById(animalId);
    const images = await Animal.getImages(animalId);
    animal.images = images;

    res.status(201).json({
      success: true,
      message: 'Animal listing created successfully',
      data: animal
    });
  } catch (error) {
    console.error('Create animal error:', error);
    res.status(500).json({ error: 'Failed to create animal listing' });
  }
}

/**
 * Get all available animals with filters
 */
async function getAnimals(req, res) {
  try {
    const {
      species,
      gender,
      maxAge,
      ngoId,
      limit,
      search
    } = req.query;

    let animals;

    if (search) {
      animals = await Animal.search(search);
    } else {
      const filters = {
        species,
        gender,
        maxAge: maxAge ? parseInt(maxAge) : null,
        ngoId: ngoId ? parseInt(ngoId) : null,
        limit: limit ? parseInt(limit) : null
      };

      animals = await Animal.findAvailable(filters);
    }

    // Get images for each animal
    for (const animal of animals) {
      const images = await Animal.getImages(animal.id);
      animal.images = images;
    }

    res.json({
      success: true,
      data: animals,
      count: animals.length
    });
  } catch (error) {
    console.error('Get animals error:', error);
    res.status(500).json({ error: 'Failed to fetch animals' });
  }
}

/**
 * Get animal by ID
 */
async function getAnimal(req, res) {
  try {
    const { id } = req.params;

    const animal = await Animal.findById(id);
    if (!animal) {
      return res.status(404).json({ error: 'Animal not found' });
    }

    // Get images
    const images = await Animal.getImages(id);
    animal.images = images;

    res.json({
      success: true,
      data: animal
    });
  } catch (error) {
    console.error('Get animal error:', error);
    res.status(500).json({ error: 'Failed to fetch animal' });
  }
}

/**
 * Update animal (NGO only)
 */
async function updateAnimal(req, res) {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Check if animal exists and belongs to NGO
    const animal = await Animal.findById(id);
    if (!animal) {
      return res.status(404).json({ error: 'Animal not found' });
    }

    const ngo = await NGO.findByUserId(req.user.userId);
    if (!ngo || animal.ngo_id !== ngo.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Update animal
    await Animal.update(id, updateData);

    // Handle new image uploads
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        const imageUrl = await mediaService.uploadFile(file);
        await Animal.addImage(id, imageUrl, false);
      }
    }

    // Fetch updated animal
    const updatedAnimal = await Animal.findById(id);
    const images = await Animal.getImages(id);
    updatedAnimal.images = images;

    res.json({
      success: true,
      message: 'Animal updated successfully',
      data: updatedAnimal
    });
  } catch (error) {
    console.error('Update animal error:', error);
    res.status(500).json({ error: 'Failed to update animal' });
  }
}

/**
 * Delete animal (NGO only)
 */
async function deleteAnimal(req, res) {
  try {
    const { id } = req.params;

    // Check if animal exists and belongs to NGO
    const animal = await Animal.findById(id);
    if (!animal) {
      return res.status(404).json({ error: 'Animal not found' });
    }

    const ngo = await NGO.findByUserId(req.user.userId);
    if (!ngo || animal.ngo_id !== ngo.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Delete animal (images will be deleted by CASCADE)
    await Animal.deleteById(id);

    res.json({
      success: true,
      message: 'Animal deleted successfully'
    });
  } catch (error) {
    console.error('Delete animal error:', error);
    res.status(500).json({ error: 'Failed to delete animal' });
  }
}

/**
 * Get NGO's animals
 */
async function getNGOAnimals(req, res) {
  try {
    const ngo = await NGO.findByUserId(req.user.userId);
    if (!ngo) {
      return res.status(404).json({ error: 'NGO profile not found' });
    }

    const animals = await Animal.findByNGOId(ngo.id);

    // Get images for each animal
    for (const animal of animals) {
      const images = await Animal.getImages(animal.id);
      animal.images = images;
    }

    res.json({
      success: true,
      data: animals
    });
  } catch (error) {
    console.error('Get NGO animals error:', error);
    res.status(500).json({ error: 'Failed to fetch animals' });
  }
}

/**
 * Update animal status
 */
async function updateAnimalStatus(req, res) {
  try {
    const { id } = req.params;
    const { status } = req.body;

    // Validate status
    const validStatuses = ['available', 'pending', 'adopted'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    // Check if animal exists and belongs to NGO
    const animal = await Animal.findById(id);
    if (!animal) {
      return res.status(404).json({ error: 'Animal not found' });
    }

    const ngo = await NGO.findByUserId(req.user.userId);
    if (!ngo || animal.ngo_id !== ngo.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Update status
    await Animal.updateStatus(id, status);

    res.json({
      success: true,
      message: 'Animal status updated successfully'
    });
  } catch (error) {
    console.error('Update animal status error:', error);
    res.status(500).json({ error: 'Failed to update animal status' });
  }
}

/**
 * Remove animal image
 */
async function removeAnimalImage(req, res) {
  try {
    const { id, imageId } = req.params;

    // Check if animal exists and belongs to NGO
    const animal = await Animal.findById(id);
    if (!animal) {
      return res.status(404).json({ error: 'Animal not found' });
    }

    const ngo = await NGO.findByUserId(req.user.userId);
    if (!ngo || animal.ngo_id !== ngo.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Remove image
    await Animal.removeImage(imageId);

    res.json({
      success: true,
      message: 'Image removed successfully'
    });
  } catch (error) {
    console.error('Remove animal image error:', error);
    res.status(500).json({ error: 'Failed to remove image' });
  }
}

module.exports = {
  createAnimal,
  getAnimals,
  getAnimal,
  updateAnimal,
  deleteAnimal,
  getNGOAnimals,
  updateAnimalStatus,
  removeAnimalImage
};