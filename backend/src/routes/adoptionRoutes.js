const express = require('express');
const router = express.Router();
const adoptionController = require('../controllers/adoptionController');
const authMiddleware = require('../middleware/auth');
const { body, param } = require('express-validator');
const validationMiddleware = require('../middleware/validation');

// Validation rules
const createAdoptionRequestValidation = [
  body('animalId')
    .isInt({ min: 1 })
    .withMessage('Invalid animal ID'),
  body('message')
    .optional()
    .isLength({ max: 1000 })
    .withMessage('Message must not exceed 1000 characters')
];

const updateStatusValidation = [
  body('status')
    .isIn(['pending', 'approved', 'rejected'])
    .withMessage('Invalid status'),
  body('ngoNotes')
    .optional()
    .isLength({ max: 1000 })
    .withMessage('NGO notes must not exceed 1000 characters')
];

const markAdoptedValidation = [
  body('adoptionRequestId')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Invalid adoption request ID')
];

const idValidation = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('Invalid adoption request ID')
];

const animalIdValidation = [
  param('animalId')
    .isInt({ min: 1 })
    .withMessage('Invalid animal ID')
];

// Protected routes (authentication required)
router.post('/', authMiddleware, createAdoptionRequestValidation, validationMiddleware, adoptionController.createAdoptionRequest);
router.get('/', authMiddleware, adoptionController.getUserAdoptionRequests);
router.get('/ngo', authMiddleware, adoptionController.getNGOAdoptionRequests);
router.get('/statistics', authMiddleware, adoptionController.getAdoptionStatistics);
router.get('/:id', authMiddleware, idValidation, validationMiddleware, adoptionController.getAdoptionRequest);
router.put('/:id/status', authMiddleware, idValidation, updateStatusValidation, validationMiddleware, adoptionController.updateAdoptionRequestStatus);
router.delete('/:id', authMiddleware, idValidation, validationMiddleware, adoptionController.cancelAdoptionRequest);

// Animal-specific adoption routes
router.get('/animal/:animalId', authMiddleware, animalIdValidation, validationMiddleware, adoptionController.getAnimalAdoptionRequests);
router.post('/animal/:animalId/adopted', authMiddleware, animalIdValidation, markAdoptedValidation, validationMiddleware, adoptionController.markAnimalAsAdopted);

module.exports = router;