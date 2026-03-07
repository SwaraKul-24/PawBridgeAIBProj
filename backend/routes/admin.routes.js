import express from "express";
const router = express.Router();
import { pool } from "../db.js";
import { sendCredentialsMail } from "../mailer.js";

router.get("/admin/ngo-applications", async (req, res) => {
  try {
    const [applications] = await pool.query(`
      SELECT ngo_id, ngo_name, founder_name, email, contact, registration_number, address, status, created_at, document_path
      FROM ngo_verification
      WHERE status='Pending'
      ORDER BY created_at DESC
    `);
    res.json({ success: true, applications });
  } catch (err) {
    console.error("Get NGO Applications Error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

router.get("/admin/ngo-applications-all", async (req, res) => {
  try {
    const [applications] = await pool.query(`
      SELECT ngo_id, ngo_name, founder_name, email, contact, registration_number, address, status, created_at, document_path
      FROM ngo_verification
      WHERE status !='Approved'
      ORDER BY created_at DESC
    `);
    res.json({ success: true, applications });
  } catch (err) {
    console.error("Get NGO Applications Error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

router.post("/admin/ngo-decision", async (req, res) => {
  try {
    const { ngo_id, decision, coordinates } = req.body;

    if (decision === 'Approved') {
      const [ngoDetails] = await pool.query("SELECT * FROM ngo_verification WHERE ngo_id = ?", [ngo_id]);
      if (!ngoDetails.length) return res.json({ success: false, message: "NGO not found" });

      const ngo = ngoDetails[0];

      await sendCredentialsMail(ngo.email, ngo.ngo_name, 'ngo123');
      console.log("Triggered email sending for", ngo.email);

      const [userResult] = await pool.query(`
        INSERT INTO user_master (um_name, um_email, um_password, rm_id, um_latitude, um_longitude) 
        VALUES (?, ?, ?, ?, ?, ?)`,
        [ngo.ngo_name, ngo.email, 'ngo123', 3, coordinates?.lat || null, coordinates?.lng || null]
      );

      await pool.query(`
        UPDATE ngo_verification 
        SET status = ?, verified_at = NOW(), um_id = ?, ngo_latitude = ?, ngo_longitude = ?
        WHERE ngo_id = ?`,
        [decision, userResult.insertId, coordinates?.lat || null, coordinates?.lng || null, ngo_id]
      );
    } else {
      await pool.query("UPDATE ngo_verification SET status=? WHERE ngo_id=?", [decision, ngo_id]);
    }

    res.json({ success: true, message: `NGO application ${decision.toLowerCase()}` });
  } catch (err) {
    console.error("NGO Decision Error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

router.get("/admin/ngo-applications-app", async (req, res) => {
  try {//approved ngos
    const [applications] = await pool.query(`
      SELECT ngo_id, ngo_name, founder_name, email, contact, registration_number, address, status, created_at, document_path
      FROM ngo_verification
      WHERE status = 'Approved'
      ORDER BY created_at DESC
    `);
    res.json({ success: true, applications });
  } catch (err) {
    console.error("Get NGO Applications Error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

router.get('/admin/rejected-reports', async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT ir.*, atm.atm_name, um.um_name AS reporter_name ,um.*
      FROM injury_report ir
      JOIN animal_type_master atm ON ir.atm_id = atm.atm_id
      LEFT JOIN user_master um ON ir.um_id = um.um_id
      WHERE ir.routing_exhausted = TRUE
    `);
    res.json({ success: true, reports: rows });
  } catch (error) {
    console.error(' Error fetching rejected reports:', error);
    res.json({ success: false, message: 'Error fetching rejected reports' });
  }
});

router.post("/admin/manually-assign-report", async (req, res) => {
  try {
    const { reportId, ngoId, adminNotes } = req.body;

    if (!reportId || !ngoId) {
      return res.status(400).json({ success: false, message: "Report ID and NGO ID required" });
    }

    const [reports] = await pool.query(
      `SELECT ir.*, atm.atm_name 
       FROM injury_report ir
       JOIN animal_type_master atm ON ir.atm_id = atm.atm_id
       WHERE ir_id = ?`,
      [reportId]
    );

    if (!reports.length) {
      return res.status(404).json({ success: false, message: "Report not found" });
    }

    const report = reports[0];

    const [ngos1] = await pool.query(
      "SELECT ngo_id, ngo_name , um_id FROM ngo_verification WHERE ngo_id = ? AND status='Approved'",
      [ngoId]
    );
    if (!ngos1.length) {
      return res.status(404).json({ success: false, message: "NGO1 not found" });
    }
    const ngo1 = ngos1[0];
    console.log(ngo1);

    const [ngos] = await pool.query(
      "SELECT um_id, um_name FROM user_master WHERE um_id = ? AND rm_id = 3",
      [ngo1.um_id]
    );

    if (!ngos.length) {
      return res.status(404).json({ success: false, message: "NGO-user not found" });
    }

    const ngo = ngos[0];

    await pool.query(`
      UPDATE injury_report 
      SET assigned_ngo_id = ?,
          ir_status = 'Pending',
          routing_exhausted = FALSE,
          updated_on = NOW()
      WHERE ir_id = ?
    `, [ngo1.um_id, reportId]);


    await pool.query(`
      INSERT INTO notifications (recipient_id, notification_type, title, message, related_id)
      VALUES (?, ?, ?, ?, ?)
    `, [
      ngo1.um_id,
      'Injury_Report',
      'Admin Assigned Report',
      `Admin has manually assigned you a ${report.atm_name} injury report. ${adminNotes ? 'Note: ' + adminNotes : ''}`,
      reportId
    ]);

    await pool.query(`
      INSERT INTO notifications (recipient_id, notification_type, title, message, related_id)
      VALUES (?, ?, ?, ?, ?)
    `, [
      report.um_id,
      'Injury_Report',
      'Report Reassigned',
      `Admin has reassigned your ${report.atm_name} report to ${ngo.um_name}. They will contact you shortly.`,
      reportId
    ]);

    res.json({ 
      success: true, 
      message: `Report manually assigned to ${ngo.um_name}` 
    });

  } catch (err) {
    console.error("Error manually assigning report:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

export default router;