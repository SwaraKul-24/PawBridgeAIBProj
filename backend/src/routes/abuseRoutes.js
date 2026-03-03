const express = require('express');
const router = express.Router();
const abuseController = require('../controllers/abuseController');
const authMiddleware = require('../middleware/auth');
const { body } = require('express-validator');
const validationMiddleware = require('../middleware/validation');

// Validation rules
const createAbuseReportValidation = [
  body('latitude')
    .isFloat({ min: -90, max: 90 })
    .withMessage('Latitude must be between -90 and 90'),
  body('longitude')
    .isFloat({ min: -180, max: 180 })
    .withMessage('Longitude must be between -180 and 180'),
  body('userEditedDescription')
    .optional()
    .isLength({ max: 2000 })
    .withMessage('Description must not exceed 2000 characters'),
  body('isAnonymous')
    .optional()
    .isBoolean()
    .withMessage('isAnonymous must be a boolean'),
  body('stateDetails')
    .optional()
    .isLength({ max: 500 })
    .withMessage('State details must not exceed 500 characters')
];

const updateStatusValidation = [
  body('status')
    .isIn(['submitted', 'under_review', 'assigned', 'in_progress', 'resolved', 'rejected', 'unassigned'])
    .withMessage('Invalid status'),
  body('notes')
    .optional()
    .isLength({ max: 1000 })
    .withMessage('Notes must not exceed 1000 characters')
];

// Public routes (no authentication required)
router.post('/', createAbuseReportValidation, validationMiddleware, abuseController.createAbuseReport);
router.get('/track/:trackingId', abuseController.trackAbuseReport);

// Protected routes (authentication required)
router.get('/', authMiddleware, abuseController.getUserAbuseReports);
router.get('/ngo', authMiddleware, abuseController.getNGOAbuseReports);
router.get('/:id', authMiddleware, abuseController.getAbuseReport);

// NGO-only routes
router.post('/:id/accept', authMiddleware, abuseController.acceptAbuseReport);
router.post('/:id/reject', authMiddleware, abuseController.rejectAbuseReport);
router.put('/:id/status', authMiddleware, updateStatusValidation, validationMiddleware, abuseController.updateAbuseReportStatus);

module.exports = router;