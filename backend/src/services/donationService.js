/**
 * Donation Service
 * Handles donation distribution business logic
 */

/**
 * Calculate equal distribution of donation among NGOs
 * @param {number} totalAmount - Total donation amount
 * @param {Array} eligibleNGOs - Array of eligible NGOs
 * @returns {Object} Distribution details
 */
function calculateDistribution(totalAmount, eligibleNGOs) {
  if (!eligibleNGOs || eligibleNGOs.length === 0) {
    return { distributions: [], sharePerNGO: 0, remainder: 0 };
  }

  const sharePerNGO = parseFloat((totalAmount / eligibleNGOs.length).toFixed(2));
  const remainder = parseFloat((totalAmount - (sharePerNGO * eligibleNGOs.length)).toFixed(2));

  const distributions = eligibleNGOs.map((ngo, index) => {
    let distributedAmount = sharePerNGO;
    
    // Add remainder to last NGO
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

  return { distributions, sharePerNGO, remainder };
}

module.exports = {
  calculateDistribution
};
