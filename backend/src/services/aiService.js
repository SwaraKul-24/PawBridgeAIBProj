/**
 * AI Service
 * Phase 1: Returns mock data for animal type and severity classification
 * Phase 2: Replace with Amazon Bedrock integration
 * 
 * IMPORTANT: Controllers must never change when switching to Phase 2
 */

/**
 * Analyze uploaded image/video to classify animal type and injury/abuse severity
 * @param {string} mediaPath - Path to uploaded media file
 * @param {string} userDescription - User-provided description
 * @param {string} caseType - 'injury' or 'abuse'
 * @returns {Promise<Object>} Analysis results
 */
async function analyzeMedia(mediaPath, userDescription, caseType = 'injury') {
  // Phase 1: Mock implementation
  console.log(`[AI Service] Analyzing ${caseType} case: ${mediaPath}`);
  
  // Simulate AI processing delay
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Mock classification based on keywords in description
  const description = (userDescription || '').toLowerCase();
  
  let animalType = 'other';
  if (description.includes('dog')) animalType = 'dog';
  else if (description.includes('cat')) animalType = 'cat';
  else if (description.includes('bird')) animalType = 'bird';
  
  let severity = 'medium';
  if (description.includes('critical') || description.includes('severe') || description.includes('bleeding')) {
    severity = 'critical';
  } else if (description.includes('serious') || description.includes('injured')) {
    severity = 'high';
  } else if (description.includes('minor') || description.includes('scratch')) {
    severity = 'low';
  }
  
  const generatedDescription = `${animalType.charAt(0).toUpperCase() + animalType.slice(1)} with ${severity} severity ${caseType}. ${userDescription || 'No additional details provided.'}`;
  
  return {
    animalType,
    severity,
    generatedDescription,
    confidence: 0.85,
    processingTime: 1.0
  };
}

/**
 * Phase 2 Implementation Guide:
 * 
 * const { BedrockRuntimeClient, InvokeModelCommand } = require('@aws-sdk/client-bedrock-runtime');
 * 
 * async function analyzeMedia(mediaPath, userDescription, caseType) {
 *   const bedrockClient = new BedrockRuntimeClient({ region: process.env.AWS_REGION });
 *   
 *   const prompt = `Analyze this ${caseType} image and provide:
 *   1. Animal type (dog/cat/bird/other)
 *   2. Severity (low/medium/high/critical)
 *   3. Brief description
 *   Image: ${mediaPath}
 *   User description: ${userDescription}`;
 *   
 *   const response = await bedrockClient.send(new InvokeModelCommand({
 *     modelId: process.env.BEDROCK_MODEL_ID,
 *     body: JSON.stringify({ prompt, max_tokens: 300 })
 *   }));
 *   
 *   // Parse Bedrock response and return same structure
 *   return { animalType, severity, generatedDescription, confidence, processingTime };
 * }
 */

module.exports = {
  analyzeMedia
};
