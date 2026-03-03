const express = require('express');
const router = express.Router();
const donationController = require('../controllers/donationController');
const authMiddleware = require('../middleware/auth');
const { body, param } = require('express-validator');
const validationMiddleware = require('../middleware/validation');

// Validation rules
const createDonationValidation = [
  body('amount')
    .isFloat({ min: 1, max: 100000 })
    .withMessage('Amount must be between ₹1 and ₹100,000'),
  body('latitude')
    .isFloat({ min: -90, max: 90 })
    .withMessage('Latitude must be between -90 and 90'),
  body('longitude')
    .isFloat({ min: -180, max: 180 })
    .withMessage('Longitude must be between -180 and 180'),
  body('donorState')
    .optional()
    .isLength({ max: 100 })
    .withMessage('Donor state must not exceed 100 characters')
];

const simulatePaymentValidation = [
  body('success')
    .optional()
    .isBoolean()
    .withMessage('Success must be a boolean')
];

const idValidation = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('Invalid donation ID')
];

// Protected routes (authentication required)
router.post('/', authMiddleware, createDonationValidation, validationMiddleware, donationController.createDonation);
router.get('/', authMiddleware, donationController.getUserDonations);
router.get('/ngo', authMiddleware, donationController.getNGODonations);
router.get('/statistics', authMiddleware, donationController.getDonationStatistics);
router.get('/:id', authMiddleware, idValidation, validationMiddleware, donationController.getDonation);

// Phase 1: Simulate payment completion
router.post('/:id/simulate-payment', authMiddleware, idValidation, simulatePaymentValidation, validationMiddleware, donationController.simulatePayment);

// Webhook endpoint (no authentication - verified by signature)
router.post('/webhook', donationController.handlePaymentWebhook);

module.exports = router;