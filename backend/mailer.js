// mailer.js
import nodemailer from "nodemailer";

export const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// // Verify SMTP connection once when server starts
// transporter.verify((error, success) => {
//   if (error) {
//     console.error("SMTP connection failed:", error);
//   } else {
//     console.log("SMTP connection successful, ready to send mails!");
//   }
// });

// Function to send email
export const sendCredentialsMail = async (to, username, password) => {
  const mailOptions = {
    from: `"PawBridge Team 🐾" <${process.env.EMAIL_USER}>`,
    to,
    subject: "🐾 Welcome to PawBridge - Your Login Credentials",
    html: `
      <div style="font-family: 'Arial', sans-serif; max-width: 600px; margin: auto; border: 1px solid #eee; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 10px rgba(0,0,0,0.05);">
        <div style="background-color: #38512F; padding: 30px; text-align: center;">
          <h1 style="color: #fff; margin: 0;">Welcome to PawBridge! 🐶🐱</h1>
        </div>
        <div style="padding: 30px; background-color: #fff;">
          <p style="font-size: 16px; color: #333;">Hi <b>${username}</b>,</p>
          <p style="font-size: 16px; color: #333;">Your account has been successfully created on PawBridge. Use the credentials below to log in and start exploring:</p>
          
          <table style="width: 100%; margin: 20px 0; border-collapse: collapse;">
            <tr>
              <td style="padding: 10px; background-color: #f0f0f0; border-radius: 5px;"><b>Email:</b></td>
              <td style="padding: 10px; background-color: #f0f0f0; border-radius: 5px;">${to}</td>
            </tr>
            <tr>
              <td style="padding: 10px; background-color: #f0f0f0; border-radius: 5px;"><b>Password:</b></td>
              <td style="padding: 10px; background-color: #f0f0f0; border-radius: 5px;">${password}</td>
            </tr>
          </table>
          
          <p style="font-size: 16px; color: #333;">We recommend changing your password after logging in for the first time.</p>

          <a href="https://pawbridge-backend-3277.onrender.com" style="display: inline-block; padding: 12px 25px; margin-top: 20px; background-color: #38512F; color: #fff; text-decoration: none; border-radius: 5px; font-weight: bold;">Login Now</a>
          
          <p style="margin-top: 30px; font-size: 14px; color: #999;">If you did not register for PawBridge, please ignore this email.</p>
        </div>
        <div style="background-color: #38512F; text-align: center; padding: 20px; color: #fff; font-size: 14px;">
          &copy; ${new Date().getFullYear()} PawBridge. All rights reserved.
        </div>
      </div>
    `
  };

  await transporter.sendMail(mailOptions);
};

// Send email when volunteer application is accepted
export const sendVolunteerAcceptanceMail = async (
  to,
  applicantName,
  ngoName,
  ngoEmail,
  ngoContact,
  opportunityTitle
) => {

  const mailOptions = {
    from: `"PawBridge Team 🐾" <${process.env.EMAIL_USER}>`,
    to,
    subject: "🎉 Your PawBridge Volunteer Application Has Been Accepted!",
    html: `
      <div style="font-family: Arial; max-width:600px; margin:auto; border:1px solid #eee; border-radius:10px; overflow:hidden;">

        <div style="background:#38512F; padding:25px; text-align:center; color:white;">
          <h2>Congratulations ${applicantName}! 🐾</h2>
        </div>

        <div style="padding:25px;">

          <p>Your application for the volunteer opportunity <b>${opportunityTitle}</b> has been <b>accepted</b> by <b>${ngoName}</b>.</p>

          <h3>NGO Contact Details</h3>

          <table style="width:100%; border-collapse:collapse;">
            <tr>
              <td style="padding:8px;"><b>NGO Name:</b></td>
              <td>${ngoName}</td>
            </tr>
            <tr>
              <td style="padding:8px;"><b>Email:</b></td>
              <td>${ngoEmail}</td>
            </tr>
            <tr>
              <td style="padding:8px;"><b>Contact:</b></td>
              <td>${ngoContact}</td>
            </tr>
          </table>

          <p style="margin-top:20px;">
            Please contact the NGO to coordinate your volunteering schedule.
          </p>

          <p>Thank you for helping animals in need ❤️</p>

        </div>

        <div style="background:#38512F; text-align:center; padding:15px; color:white;">
          PawBridge Team
        </div>

      </div>
    `
  };

  await transporter.sendMail(mailOptions);
};
