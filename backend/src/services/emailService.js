/**
 * Email Service
 * Phase 1: Use nodemailer with Gmail SMTP
 * Phase 2: Replace with AWS SES
 * 
 * IMPORTANT: Controllers must never change when switching to Phase 2
 */

const nodemailer = require('nodemailer');

// Phase 1: Gmail SMTP transporter
let transporter = null;

function initializeTransporter() {
  transporter = nodemailer.createTransport({
    service: process.env.EMAIL_SERVICE || 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD
    }
  });
}

initializeTransporter();

/**
 * Send email
 * @param {string} to - Recipient email address
 * @param {string} subject - Email subject
 * @param {string} text - Email body (plain text)
 * @returns {Promise<Object>} Send result
 */
async function sendEmail(to, subject, text) {
  try {
    // Phase 1: Send via nodemailer
    const info = await transporter.sendMail({
      from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
      to,
      subject,
      text
    });
    
    console.log(`[Email Service] Email sent to ${to}: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('[Email Service] Error sending email:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Send volunteer opportunity notification
 * @param {string} volunteerEmail - Volunteer's email
 * @param {Object} opportunity - Opportunity details
 */
async function sendVolunteerOpportunityEmail(volunteerEmail, opportunity) {
  const subject = `New Volunteering Opportunity: ${opportunity.title}`;
  const text = `
Hello,

A new volunteering opportunity has been posted that matches your skills:

Title: ${opportunity.title}
Organization: ${opportunity.ngoName}
Location: ${opportunity.location}
Date: ${opportunity.date}
Time: ${opportunity.time}

Description:
${opportunity.description}

To apply or learn more, please visit: ${process.env.FRONTEND_URL || 'http://localhost:3000'}/opportunities/${opportunity.id}

Best regards,
PawBridge Team
  `.trim();
  
  return await sendEmail(volunteerEmail, subject, text);
}

/**
 * Send NGO notification about volunteer application
 * @param {string} ngoEmail - NGO's email
 * @param {Object} volunteer - Volunteer details
 * @param {Object} opportunity - Opportunity details
 */
async function sendNGOVolunteerNotification(ngoEmail, volunteer, opportunity) {
  const subject = `New Volunteer Application: ${opportunity.title}`;
  const text = `
Hello,

A volunteer has expressed interest in your opportunity:

Opportunity: ${opportunity.title}
Volunteer: ${volunteer.name}
Email: ${volunteer.email}
Phone: ${volunteer.phone || 'Not provided'}
Skills: ${volunteer.skills || 'Not specified'}

Please contact the volunteer directly to coordinate.

Best regards,
PawBridge Team
  `.trim();
  
  return await sendEmail(ngoEmail, subject, text);
}

/**
 * Phase 2 Implementation Guide:
 * 
 * const { SESClient, SendEmailCommand } = require('@aws-sdk/client-ses');
 * 
 * async function sendEmail(to, subject, text) {
 *   const sesClient = new SESClient({ region: process.env.AWS_REGION });
 *   
 *   const command = new SendEmailCommand({
 *     Source: process.env.SES_FROM_EMAIL,
 *     Destination: { ToAddresses: [to] },
 *     Message: {
 *       Subject: { Data: subject },
 *       Body: { Text: { Data: text } }
 *     }
 *   });
 *   
 *   const response = await sesClient.send(command);
 *   return { success: true, messageId: response.MessageId };
 * }
 */

module.exports = {
  sendEmail,
  sendVolunteerOpportunityEmail,
  sendNGOVolunteerNotification
};
