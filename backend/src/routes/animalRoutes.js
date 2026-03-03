const express = require('express');
const router = express.Router();
const animalController = require('../controllers/animalController');
const authMiddleware = require('../middleware/auth');
const { body, param, query } = require('express-validator');
const validationMiddleware = require('../middleware/validation');

// Validation rules
const createAnimalValidation = [
  body('name')
    .notEmpty()
    .withMessage('Name is required')
    .isLength({ max: 100 })
    .withMessage('Name must not exceed 100 characters'),
  body('species')
    .isIn(['dog', 'cat', 'bird', 'other'])
    .withMessage('Invalid species'),
  body('breed')
    .optional()
    .isLength({ max: 100 })
    .withMessage('Breed must not exceed 100 characters'),
  body('ageYears')
    .optional()
    .isInt({ min: 0, max: 30 })
    .withMessage('Age in years must be between 0 and 30'),
  body('ageMonths')
    .optional()
    .isInt({ min: 0, max: 11 })
    .withMessage('Age in months must be between 0 and 11'),
  body('gender')
    .isIn(['male', 'female', 'unknown'])
    .withMessage('Invalid gender'),
  body('healthStatus')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Health status must not exceed 500 characters'),
  body('description')
    .optional()
    .isLength({ max: 1000 })
    .withMessage('Description must not exceed 1000 characters')
];

const updateAnimalValidation = [
  body('name')
    .optional()
    .isLength({ max: 100 })
    .withMessage('Name must not exceed 100 characters'),
  body('species')
    .optional()
    .isIn(['dog', 'cat', 'bird', 'other'])
    .withMessage('Invalid species'),
  body('breed')
    .optional()
    .isLength({ max: 100 })
    .withMessage('Breed must not exceed 100 characters'),
  body('ageYears')
    .optional()
    .isInt({ min: 0, max: 30 })
    .withMessage('Age in years must be between 0 and 30'),
  body('ageMonths')
    .optional()
    .isInt({ min: 0, max: 11 })
    .withMessage('Age in months must be between 0 and 11'),
  body('gender')
    .optional()
    .isIn(['male', 'female', 'unknown'])
    .withMessage('Invalid gender'),
  body('healthStatus')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Health status must not exceed 500 characters'),
  body('description')
    .optional()
    .isLength({ max: 1000 })
    .withMessage('Description must not exceed 1000 characters')
];

const updateStatusValidation = [
  body('status')
    .isIn(['available', 'pending', 'adopted'])
    .withMessage('Invalid status')
];

const idValidation = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('Invalid animal ID')
];

const queryValidation = [
  query('species')
    .optional()
    .isIn(['dog', 'cat', 'bird', 'other'])
    .withMessage('Invalid species'),
  query('gender')
    .optional()
    .isIn(['male', 'female', 'unknown'])
    .withMessage('Invalid gender'),
  query('maxAge')
    .optional()
    .isInt({ min: 0, max: 30 })
    .withMessage('Max age must be between 0 and 30'),
  query('ngoId')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Invalid NGO ID'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  query('search')
    .optional()
    .isLength({ min: 1, max: 100 })
    .withMessage('Search term must be between 1 and 100 characters')
];

// Public routes (no authentication required)
router.get('/', queryValidation, validationMiddleware, animalController.getAnimals);
router.get('/:id', idValidation, validationMiddleware, animalController.getAnimal);

// Protected routes (authentication required)
router.post('/', authMiddleware, createAnimalValidation, validationMiddleware, animalController.createAnimal);
router.get('/ngo/my-animals', authMiddleware, animalController.getNGOAnimals);
router.put('/:id', authMiddleware, idValidation, updateAnimalValidation, validationMiddleware, animalController.updateAnimal);
router.delete('/:id', authMiddleware, idValidation, validationMiddleware, animalController.deleteAnimal);
router.put('/:id/status', authMiddleware, idValidation, updateStatusValidation, validationMiddleware, animalController.updateAnimalStatus);
router.delete('/:id/images/:imageId', authMiddleware, animalController.removeAnimalImage);

module.exports = router;