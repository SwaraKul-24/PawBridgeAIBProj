/**
 * Geo Service
 * Phase 1: Manual Haversine formula implementation
 * Phase 2: Optionally integrate Amazon Location Service
 * 
 * IMPORTANT: Function signatures must remain the same in Phase 2
 */

/**
 * Convert degrees to radians
 * @param {number} degrees
 * @returns {number} radians
 */
function toRadians(degrees) {
  return degrees * (Math.PI / 180);
}

/**
 * Calculate distance between two coordinates using Haversine formula
 * @param {number} lat1 - Latitude of point 1
 * @param {number} lon1 - Longitude of point 1
 * @param {number} lat2 - Latitude of point 2
 * @param {number} lon2 - Longitude of point 2
 * @returns {number} Distance in kilometers
 */
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth's radius in kilometers
  
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);
  
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  
  return R * c;
}

/**
 * Find NGOs within specified radius
 * @param {Array} ngos - Array of NGO objects with latitude and longitude
 * @param {number} userLat - User's latitude
 * @param {number} userLon - User's longitude
 * @param {number} radiusKm - Search radius in kilometers
 * @returns {Array} NGOs within radius, sorted by distance
 */
function findNGOsWithinRadius(ngos, userLat, userLon, radiusKm) {
  const ngosWithDistance = ngos.map(ngo => {
    const distance = calculateDistance(userLat, userLon, ngo.latitude, ngo.longitude);
    return {
      ...ngo,
      distance: Math.round(distance * 10) / 10 // Round to 1 decimal place
    };
  });
  
  // Filter by radius and sort by distance
  return ngosWithDistance
    .filter(ngo => ngo.distance <= radiusKm)
    .sort((a, b) => a.distance - b.distance);
}

/**
 * Find NGOs with progressive radius expansion for donations
 * @param {Array} ngos - Array of all NGOs
 * @param {number} userLat - User's latitude
 * @param {number} userLon - User's longitude
 * @param {string} userState - User's state (for fallback)
 * @returns {Object} { eligibleNGOs, searchRadius }
 */
function findNGOsForDonation(ngos, userLat, userLon, userState) {
  // Try 50 km
  let eligibleNGOs = findNGOsWithinRadius(ngos, userLat, userLon, 50);
  if (eligibleNGOs.length > 0) {
    return { eligibleNGOs, searchRadius: 50 };
  }
  
  // Try 100 km
  eligibleNGOs = findNGOsWithinRadius(ngos, userLat, userLon, 100);
  if (eligibleNGOs.length > 0) {
    return { eligibleNGOs, searchRadius: 100 };
  }
  
  // Try 200 km
  eligibleNGOs = findNGOsWithinRadius(ngos, userLat, userLon, 200);
  if (eligibleNGOs.length > 0) {
    return { eligibleNGOs, searchRadius: 200 };
  }
  
  // Fallback: Find nearest verified NGO in same state
  const stateNGOs = ngos.filter(ngo => ngo.state === userState && ngo.is_verified);
  if (stateNGOs.length > 0) {
    const nearest = findNGOsWithinRadius(stateNGOs, userLat, userLon, 10000)[0]; // Large radius
    return { eligibleNGOs: [nearest], searchRadius: 'state-wide' };
  }
  
  return { eligibleNGOs: [], searchRadius: null };
}

/**
 * Determine search radius based on severity
 * @param {string} severity - 'low', 'medium', 'high', 'critical'
 * @returns {Object} { initialRadius, maxRadius, increment }
 */
function getRadiusForSeverity(severity) {
  if (severity === 'high' || severity === 'critical') {
    return { initialRadius: 5, maxRadius: 30, increment: 5 };
  }
  return { initialRadius: 20, maxRadius: 30, increment: 5 };
}

/**
 * Phase 2 Implementation Guide:
 * 
 * const { LocationClient, CalculateRouteCommand } = require('@aws-sdk/client-location');
 * 
 * async function calculateDistance(lat1, lon1, lat2, lon2) {
 *   const locationClient = new LocationClient({ region: process.env.AWS_REGION });
 *   
 *   const response = await locationClient.send(new CalculateRouteCommand({
 *     CalculatorName: process.env.LOCATION_CALCULATOR_NAME,
 *     DeparturePosition: [lon1, lat1],
 *     DestinationPosition: [lon2, lat2]
 *   }));
 *   
 *   return response.Summary.Distance / 1000; // Convert meters to km
 * }
 * 
 * Note: Keep Haversine as fallback if AWS Location Service fails
 */

module.exports = {
  calculateDistance,
  findNGOsWithinRadius,
  findNGOsForDonation,
  getRadiusForSeverity
};
