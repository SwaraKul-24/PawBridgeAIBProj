import express from "express";
import { pool } from "../db.js";
import { sendVolunteerAcceptanceMail } from "../mailer.js";

const router = express.Router();

/*
CREATE VOLUNTEER OPPORTUNITY
*/
router.post("/ngo/opportunities/create", async (req, res) => {

    try {

        const {
            ngoId,
            ngoName,
            title,
            location,
            duration,
            volunteersNeeded,
            deadline,
            skills,
            description,
            instructions,
            badges
        } = req.body;

        if (!title || !location || !duration || !volunteersNeeded || !skills || !description) {
            return res.status(400).json({
                success: false,
                message: "Required fields missing"
            });
        }

        const query = `
            INSERT INTO volunteer_opportunities
            (
                ngo_id,
                ngo_name,
                title,
                location,
                duration,
                volunteers_needed,
                deadline,
                skills,
                description,
                instructions,
                badges
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;

        const values = [
            ngoId,
            ngoName,
            title,
            location,
            duration,
            volunteersNeeded,
            deadline,
            skills,
            description,
            instructions,
            JSON.stringify(badges)
        ];

        const [result] = await pool.query(query, values);

        res.json({
            success: true,
            message: "Opportunity created successfully",
            opportunityId: result.insertId
        });

    } catch (error) {

        console.error("Create opportunity error:", error);

        res.status(500).json({
            success: false,
            message: "Server error"
        });

    }

});

// Get opportunities posted by NGO for NG0
router.get("/opportunities/ngo/:ngo_id", async (req, res) => {
  try {
    const ngo_id = req.params.ngo_id;

    const [rows] = await pool.query(
      `SELECT * FROM volunteer_opportunities 
       WHERE ngo_id = ?
       ORDER BY created_at DESC`,
      [ngo_id]
    );

    const opportunities = rows.map(o => ({
      ...o,
      badges: o.badges || [],
      volunteersApplied: 0
    }));
    
    res.json(opportunities);

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error fetching opportunities" });
  }
});

/*
GET ALL VOLUNTEER OPPORTUNITIES (FOR USERS)
*/
router.get("/volunteer/opportunities", async (req, res) => {
  try {

    const [rows] = await pool.query(
      "SELECT * FROM volunteer_opportunities"
    );

    res.json({
      success: true,
      opportunities: rows
    });

  } catch (error) {
    console.error("ERROR:", error);   // important
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

/*
VOLUNTEER APPLY TO OPPORTUNITY
*/

router.post("/volunteer/apply", async (req, res) => {

    try {

        const {
            opportunityId,
            um_id,
            userName,
            userEmail,
            userMobile,
            userLocation,
            userSkills,
            motivation,
            availability
        } = req.body;

        if (!opportunityId || !userName || !userEmail) {
            return res.status(400).json({
                success: false,
                message: "Missing required fields"
            });
        }

        // Get NGO ID from opportunity
        const [opportunity] = await pool.query(
            `SELECT ngo_id FROM volunteer_opportunities WHERE vo_id = ?`,
            [opportunityId]
        );

        if (opportunity.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Opportunity not found"
            });
        }

        const ngoId = opportunity[0].ngo_id;

        const query = `
            INSERT INTO volunteer_applications
            (
                vo_id,
                ngo_id,
                um_id,
                applicant_name,
                applicant_email,
                applicant_mobile,
                applicant_location,
                skills,
                motivation,
                availability
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;

        const values = [
            opportunityId,
            ngoId,
            um_id,
            userName,
            userEmail,
            userMobile,
            userLocation,
            userSkills,
            motivation,
            availability
        ];

        await pool.query(query, values);

        res.json({
            success: true,
            message: "Application submitted successfully"
        });

    } catch (error) {

        console.error("Volunteer application error:", error);

        res.status(500).json({
            success: false,
            message: "Server error"
        });

    }

});

router.get("/volunteer/history/:um_id", async (req, res) => {
  try {

    const { um_id } = req.params;

    const query = `
      SELECT
        va.va_id,
        vo.title,
        vo.location,
        vo.duration,
        vo.deadline,
        vo.description,
        vo.created_at,
        um.um_name AS ngo_name
      FROM volunteer_applications va
      JOIN volunteer_opportunities vo ON va.vo_id = vo.vo_id
      JOIN user_master um ON vo.ngo_id = um.um_id
      WHERE va.um_id = ?
      ORDER BY va.applied_at DESC
    `;

    const [rows] = await pool.query(query, [um_id]);

    res.json({
      success: true,
      history: rows
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false });
  }
});

router.get("/ngo/opportunity/:vo_id/applicants", async (req, res) => {
    try {

        const { vo_id } = req.params;

        const [rows] = await pool.query(`
            SELECT 
                va.va_id,
                va.applicant_name,
                va.applicant_email,
                va.applicant_mobile,
                va.applicant_location,
                va.skills,
                va.motivation,
                va.availability,
                va.status,
                va.applied_at
            FROM volunteer_applications va
            WHERE va.vo_id = ? AND va.status != "rejected"
            ORDER BY va.applied_at DESC
        `,[vo_id]);

        res.json({
            success:true,
            applicants:rows
        });

    } catch(err){
        console.error("Error fetching applicants:",err);
        res.status(500).json({
            success:false,
            message:"Error fetching applicants"
        });
    }
});

router.post("/ngo/application/accept", async (req, res) => {

  const { va_id } = req.body;

  try {

    const [rows] = await pool.query(`
      SELECT 
        va.*,
        vo.title,
        ngo.um_name as ngo_name,
        ngo.um_email as ngo_email,
        ngo.um_contact as ngo_contact
      FROM volunteer_applications va
      JOIN volunteer_opportunities vo ON vo.vo_id = va.vo_id
      JOIN user_master ngo ON ngo.um_id = vo.ngo_id
      WHERE va.va_id = ?
    `,[va_id]);

    if(rows.length === 0){
      return res.json({success:false,message:"Application not found"});
    }

    const applicant = rows[0];

    // update status
    await pool.query(`
      UPDATE volunteer_applications
      SET status='accepted'
      WHERE va_id=?
    `,[va_id]);

    // send email
    await sendVolunteerAcceptanceMail(
      applicant.applicant_email,
      applicant.applicant_name,
      applicant.ngo_name,
      applicant.ngo_email,
      applicant.ngo_contact,
      applicant.title
    );

    res.json({
      success:true,
      message:"Volunteer accepted and email sent"
    });

  } catch(err){
    console.error(err);
    res.status(500).json({success:false});
  }

});

router.post("/ngo/application/reject", async (req,res)=>{

const {va_id} = req.body;

await pool.query(`
UPDATE volunteer_applications
SET status='rejected'
WHERE va_id=?
`,[va_id]);

res.json({
success:true,
message:"Volunteer rejected"
});

});

export default router;