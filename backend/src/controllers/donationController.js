const Donation = require('../models/Donation');
const NGO = require('../models/NGO');
const geoService = require('../services/geoService');
const notificationService = require('../services/notificationService');

/**
 * Create donation with geographic distribution
 */
async function createDonation(req, res) {
  try {
    const { amount, latitude, longitude, donorState } = req.body;
    const citizenId = req.user.userId;

    // Validate amount
    if (!amount || amount <= 0) {
      return res.status(400).json({ error: 'Invalid donation amount' });
    }

    // Get all NGOs
    const allNGOs = await NGO.findAll();
    
    // Find eligible NGOs using progressive radius expansion
    const { eligibleNGOs, searchRadius } = geoService.findNGOsForDonation(
      allNGOs,
      parseFloat(latitude),
      parseFloat(longitude),
      donorState
    );

    if (eligibleNGOs.length === 0) {
      return res.status(400).json({ 
        error: 'No eligible NGOs found in your area. Please try again later.' 
      });
    }

    // Calculate equal distribution
    const sharePerNGO = parseFloat((amount / eligibleNGOs.length).toFixed(2));
    const remainder = parseFloat((amount - (sharePerNGO * eligibleNGOs.length)).toFixed(2));

    // Create donation record
    const donationId = await Donation.create({
      citizenId,
      totalAmount: amount,
      donorLatitude: latitude,
      donorLongitude: longitude,
      donorState,
      searchRadius: searchRadius.toString(),
      transactionId: null // Will be updated after payment
    });

    // Create distribution records
    for (let i = 0; i < eligibleNGOs.length; i++) {
      const ngo = eligibleNGOs[i];
      let distributedAmount = sharePerNGO;
      
      // Add remainder to last NGO
      if (i === eligibleNGOs.length - 1) {
        distributedAmount += remainder;
      }

      await Donation.createDistribution(donationId, ngo.id, distributedAmount);
    }

    // Generate mock payment gateway URL (Phase 1)
    const paymentGatewayUrl = `https://mock-payment-gateway.com/checkout/${donationId}`;

    // Prepare distribution details for response
    const distributionDetails = eligibleNGOs.map((ngo, index) => {
      let distributedAmount = sharePerNGO;
      if (index === eligibleNGOs.length - 1) {
        distributedAmount += remainder;
      }

      return {
        ngoId: ngo.id,
        ngoName: ngo.organization_name,
        distance: `${ngo.distance} km`,
        distributedAmount: parseFloat(distributedAmount.toFixed(2))
      };
    });

    res.status(201).json({
      success: true,
      message: 'Donation created successfully',
      data: {
        id: donationId,
        totalAmount: amount,
        searchRadius: searchRadius === 'state-wide' ? 'state-wide' : `${searchRadius} km`,
        distributionDetails,
        paymentStatus: 'pending',
        paymentGatewayUrl,
        createdAt: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Create donation error:', error);
    res.status(500).json({ error: 'Failed to create donation' });
  }
}

/**
 * Get donation by ID with distribution details
 */
async function getDonation(req, res) {
  try {
    const { id } = req.params;

    const donation = await Donation.findById(id);
    if (!donation) {
      return res.status(404).json({ error: 'Donation not found' });
    }

    // Check access permissions
    if (req.user.userId !== donation.citizen_id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Get distribution details
    const distributions = await Donation.getDistributions(id);

    res.json({
      success: true,
      data: {
        ...donation,
        distributions
      }
    });
  } catch (error) {
    console.error('Get donation error:', error);
    res.status(500).json({ error: 'Failed to fetch donation' });
  }
}

/**
 * Get user's donation history
 */
async function getUserDonations(req, res) {
  try {
    const donations = await Donation.findByCitizenId(req.user.userId);

    // Get distribution details for each donation
    for (const donation of donations) {
      const distributions = await Donation.getDistributions(donation.id);
      donation.distributions = distributions;
    }

    res.json({
      success: true,
      data: donations
    });
  } catch (error) {
    console.error('Get user donations error:', error);
    res.status(500).json({ error: 'Failed to fetch donations' });
  }
}

/**
 * Get donations received by NGO
 */
async function getNGODonations(req, res) {
  try {
    const ngo = await NGO.findByUserId(req.user.userId);
    if (!ngo) {
      return res.status(404).json({ error: 'NGO profile not found' });
    }

    const donations = await Donation.findByNGOId(ngo.id);

    res.json({
      success: true,
      data: donations,
      totalReceived: ngo.total_donations
    });
  } catch (error) {
    console.error('Get NGO donations error:', error);
    res.status(500).json({ error: 'Failed to fetch donations' });
  }
}

/**
 * Payment webhook handler (mock implementation for Phase 1)
 */
async function handlePaymentWebhook(req, res) {
  try {
    const { donationId, transactionId, status, signature } = req.body;

    // In Phase 2, verify signature from payment gateway
    // For Phase 1, we'll simulate successful payment
    
    const donation = await Donation.findById(donationId);
    if (!donation) {
      return res.status(404).json({ error: 'Donation not found' });
    }

    // Update payment status
    await Donation.updatePaymentStatus(donationId, status, transactionId);

    if (status === 'completed') {
      // Update NGO total donations
      const distributions = await Donation.getDistributions(donationId);
      
      for (const distribution of distributions) {
        await Donation.updateNGOTotalDonations(
          distribution.ngo_id, 
          distribution.distributed_amount
        );

        // Notify NGO about received donation
        await notificationService.createNotification(
          distribution.ngo_user_id,
          'donation',
          'Donation Received',
          `You have received ₹${distribution.distributed_amount} from a donation distribution.`,
          'donation',
          donationId
        );
      }

      // Notify donor
      await notificationService.createNotification(
        donation.citizen_id,
        'donation',
        'Donation Completed',
        `Your donation of ₹${donation.total_amount} has been successfully distributed among ${distributions.length} NGOs.`,
        'donation',
        donationId
      );
    }

    res.json({ success: true, message: 'Webhook processed successfully' });
  } catch (error) {
    console.error('Payment webhook error:', error);
    res.status(500).json({ error: 'Failed to process webhook' });
  }
}

/**
 * Simulate payment completion (Phase 1 only)
 */
async function simulatePayment(req, res) {
  try {
    const { id } = req.params;
    const { success = true } = req.body;

    const donation = await Donation.findById(id);
    if (!donation) {
      return res.status(404).json({ error: 'Donation not found' });
    }

    // Check access permissions
    if (req.user.userId !== donation.citizen_id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const status = success ? 'completed' : 'failed';
    const transactionId = success ? `TXN_${Date.now()}` : null;

    // Update payment status
    await Donation.updatePaymentStatus(id, status, transactionId);

    if (status === 'completed') {
      // Update NGO total donations
      const distributions = await Donation.getDistributions(id);
      
      for (const distribution of distributions) {
        await Donation.updateNGOTotalDonations(
          distribution.ngo_id, 
          distribution.distributed_amount
        );

        // Notify NGO about received donation
        await notificationService.createNotification(
          distribution.ngo_user_id,
          'donation',
          'Donation Received',
          `You have received ₹${distribution.distributed_amount} from a donation distribution.`,
          'donation',
          id
        );
      }

      // Notify donor
      await notificationService.createNotification(
        donation.citizen_id,
        'donation',
        'Donation Completed',
        `Your donation of ₹${donation.total_amount} has been successfully distributed among ${distributions.length} NGOs.`,
        'donation',
        id
      );
    }

    res.json({
      success: true,
      message: `Payment ${status} successfully`,
      data: {
        id,
        status,
        transactionId
      }
    });
  } catch (error) {
    console.error('Simulate payment error:', error);
    res.status(500).json({ error: 'Failed to simulate payment' });
  }
}

/**
 * Get donation statistics (admin only)
 */
async function getDonationStatistics(req, res) {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied' });
    }

    const stats = await Donation.getStatistics();
    const topNGOs = await Donation.getTopNGOsByDonations(10);

    res.json({
      success: true,
      data: {
        statistics: stats,
        topNGOs
      }
    });
  } catch (error) {
    console.error('Get donation statistics error:', error);
    res.status(500).json({ error: 'Failed to fetch statistics' });
  }
}

module.exports = {
  createDonation,
  getDonation,
  getUserDonations,
  getNGODonations,
  handlePaymentWebhook,
  simulatePayment,
  getDonationStatistics
};