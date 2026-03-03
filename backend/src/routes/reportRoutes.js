const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
const { authenticateToken, requireRole } = require('../middleware/auth');
const { reportValidation } = require('../middleware/validation');
const { upload } = require('../services/mediaService');

// Citizen routes
router.post(
  '/',
  authenticateToken,
  requireRole('citizen', 'volunteer'),
  upload.array('images', 5),
  reportValidation,
  reportController.createReport
);

router.get('/my-reports', authenticateToken, reportController.getUserReports);

// NGO routes
router.get('/ngo-reports', authenticateToken, requireRole('ngo'), reportController.getNGOReports);
router.post('/:id/accept', authenticateToken, requireRole('ngo'), reportController.acceptReport);
router.put('/:id/status', authenticateToken, requireRole('ngo'), reportController.updateReportStatus);

// Common routes
router.get('/:id', authenticateToken, reportController.getReport);

module.exports = router;
