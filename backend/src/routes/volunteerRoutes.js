const express = require('express');
const router = express.Router();
const volunteerController = require('../controllers/volunteerController');
const authMiddleware = require('../middleware/auth');
const { body, param, query } = require('express-validator');
const validationMiddleware = require('../middleware/validation');

// Validation rules
const createVolunteerValidation = [
  body('skills')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Skills must not exceed 500 characters'),
  body('availability')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Availability must not exceed 500 characters'),
  body('latitude')
    .optional()
    .isFloat({ min: -90, max: 90 })
    .withMessage('Latitude must be between -90 and 90'),
  body('longitude')
    .optional()
    .isFloat({ min: -180, max: 180 })
    .withMessage('Longitude must be between -180 and 180'),
  body('bio')
    .optional()
    .isLength({ max: 1000 })
    .withMessage('Bio must not exceed 1000 characters')
];

const createOpportunityValidation = [
  body('title')
    .notEmpty()
    .withMessage('Title is required')
    .isLength({ max: 255 })
    .withMessage('Title must not exceed 255 characters'),
  body('description')
    .optional()
    .isLength({ max: 2000 })
    .withMessage('Description must not exceed 2000 characters'),
  body('requiredSkills')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Required skills must not exceed 500 characters'),
  body('location')
    .optional()
    .isLength({ max: 255 })
    .withMessage('Location must not exceed 255 characters'),
  body('latitude')
    .optional()
    .isFloat({ min: -90, max: 90 })
    .withMessage('Latitude must be between -90 and 90'),
  body('longitude')
    .optional()
    .isFloat({ min: -180, max: 180 })
    .withMessage('Longitude must be between -180 and 180'),
  body('date')
    .optional()
    .isISO8601()
    .withMessage('Invalid date format'),
  body('time')
    .optional()
    .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage('Invalid time format (HH:MM)')
];

const updateOpportunityValidation = [
  body('title')
    .optional()
    .isLength({ max: 255 })
    .withMessage('Title must not exceed 255 characters'),
  body('description')
    .optional()
    .isLength({ max: 2000 })
    .withMessage('Description must not exceed 2000 characters'),
  body('requiredSkills')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Required skills must not exceed 500 characters'),
  body('location')
    .optional()
    .isLength({ max: 255 })
    .withMessage('Location must not exceed 255 characters'),
  body('latitude')
    .optional()
    .isFloat({ min: -90, max: 90 })
    .withMessage('Latitude must be between -90 and 90'),
  body('longitude')
    .optional()
    .isFloat({ min: -180, max: 180 })
    .withMessage('Longitude must be between -180 and 180'),
  body('date')
    .optional()
    .isISO8601()
    .withMessage('Invalid date format'),
  body('time')
    .optional()
    .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage('Invalid time format (HH:MM)')
];

const updateStatusValidation = [
  body('status')
    .isIn(['open', 'filled', 'completed'])
    .withMessage('Invalid status')
];

const idValidation = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('Invalid ID')
];

const volunteerQueryValidation = [
  query('skills')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Skills must not exceed 500 characters'),
  query('availability')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Availability must not exceed 500 characters'),
  query('latitude')
    .optional()
    .isFloat({ min: -90, max: 90 })
    .withMessage('Latitude must be between -90 and 90'),
  query('longitude')
    .optional()
    .isFloat({ min: -180, max: 180 })
    .withMessage('Longitude must be between -180 and 180'),
  query('radius')
    .optional()
    .isFloat({ min: 0.1, max: 1000 })
    .withMessage('Radius must be between 0.1 and 1000 km'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100')
];

const opportunityQueryValidation = [
  query('ngoId')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Invalid NGO ID'),
  query('skills')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Skills must not exceed 500 characters'),
  query('date')
    .optional()
    .isISO8601()
    .withMessage('Invalid date format'),
  query('latitude')
    .optional()
    .isFloat({ min: -90, max: 90 })
    .withMessage('Latitude must be between -90 and 90'),
  query('longitude')
    .optional()
    .isFloat({ min: -180, max: 180 })
    .withMessage('Longitude must be between -180 and 180'),
  query('radius')
    .optional()
    .isFloat({ min: 0.1, max: 1000 })
    .withMessage('Radius must be between 0.1 and 1000 km'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100')
];

// Volunteer profile routes
router.post('/profile', authMiddleware, createVolunteerValidation, validationMiddleware, volunteerController.createVolunteerProfile);
router.get('/profile', authMiddleware, volunteerController.getVolunteerProfile);
router.delete('/profile', authMiddleware, volunteerController.deleteVolunteerProfile);

// Volunteer directory routes (NGO access)
router.get('/', authMiddleware, volunteerQueryValidation, validationMiddleware, volunteerController.getVolunteers);
router.get('/:id', authMiddleware, idValidation, validationMiddleware, volunteerController.getVolunteer);

// Volunteering opportunity routes
router.post('/opportunities', authMiddleware, createOpportunityValidation, validationMiddleware, volunteerController.createOpportunity);
router.get('/opportunities', opportunityQueryValidation, validationMiddleware, volunteerController.getOpportunities);
router.get('/opportunities/ngo', authMiddleware, volunteerController.getNGOOpportunities);
router.get('/opportunities/:id', idValidation, validationMiddleware, volunteerController.getOpportunity);
router.put('/opportunities/:id', authMiddleware, idValidation, updateOpportunityValidation, validationMiddleware, volunteerController.updateOpportunity);
router.put('/opportunities/:id/status', authMiddleware, idValidation, updateStatusValidation, validationMiddleware, volunteerController.updateOpportunityStatus);
router.delete('/opportunities/:id', authMiddleware, idValidation, validationMiddleware, volunteerController.deleteOpportunity);

module.exports = router;