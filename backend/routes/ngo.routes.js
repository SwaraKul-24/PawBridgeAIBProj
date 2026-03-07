import express from "express";
import { pool } from "../db.js";
import { uploadNgoDoc } from "../utils/upload.js";
import { routeToNextNGO } from "../utils/helpers.js";
const router = express.Router();

router.get("/ngo/notifications/:ngoId", async (req, res) => {
  try {
    const { ngoId } = req.params;
    const [notifications] = await pool.query(`
      SELECT n.*, ir.ir_latitude, ir.ir_longitude, ir.ir_description, 
             ir.ir_image_url, ir.ir_location_address, atm.atm_name,
             um.um_name as reporter_name, um.um_contact
      FROM notifications n
      JOIN injury_report ir ON n.related_id = ir.ir_id
      JOIN animal_type_master atm ON ir.atm_id = atm.atm_id
      JOIN user_master um ON ir.um_id = um.um_id
      WHERE n.recipient_id = ? AND n.notification_type = 'Injury_Report' AND n.is_read = FALSE
      ORDER BY n.created_at DESC
    `, [ngoId]);
    res.json({ success: true, notifications });
  } catch (err) {
    console.error("Get NGO Notifications Error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

router.post("/ngo/respond-report", async (req, res) => {
  try {
    const { ngoId, reportId, response, message } = req.body;

    await pool.query(`
      INSERT INTO ngo_response (ir_id, ngo_id, response_type, response_message)
      VALUES (?, ?, ?, ?)`,
      [reportId, ngoId, response, message]
    );

    if (response === 'Accept') {
      await pool.query(`
        UPDATE injury_report 
        SET ir_status = 'Accepted', assigned_ngo_id = ?
        WHERE ir_id = ?`,
        [ngoId, reportId]
      );

      await pool.query(`
        UPDATE notifications 
        SET is_read = TRUE 
        WHERE related_id = ? AND recipient_id = ?`,
        [reportId, ngoId]
      );

      const [reportDetails] = await pool.query(
        "SELECT um_id FROM injury_report WHERE ir_id = ?", [reportId]
      );

      if (reportDetails.length > 0) {
        await pool.query(`
          INSERT INTO notifications (recipient_id, notification_type, title, message, related_id)
          VALUES (?, ?, ?, ?, ?)`,
          [
            reportDetails[0].um_id,
            'NGO_Response',
            'NGO Accepted Your Report',
            'An NGO has accepted your animal injury report and will arrive soon.',
            reportId
          ]
        );
      }

      return res.json({ success: true, message: `Report accepted successfully` });
    }

    await pool.query(`
      UPDATE notifications 
      SET is_read = TRUE 
      WHERE related_id = ? AND recipient_id = ?`,
      [reportId, ngoId]
    );

    const [repRows] = await pool.query(
      "SELECT attempted_ngos FROM injury_report WHERE ir_id = ?",
      [reportId]
    );

    let attempted = [];
    if (repRows.length) {
      try {
        const parsed = JSON.parse(repRows[0].attempted_ngos || '[]');
        attempted = Array.isArray(parsed) ? parsed : [];
      } catch (err) {
        attempted = [];
      }
    }

    const nId = Number(ngoId);
    if (!attempted.map(Number).includes(nId)) attempted.push(nId);

    await pool.query(`
      UPDATE injury_report
      SET attempted_ngos = ?, assigned_ngo_id = NULL, ir_status = 'Pending', updated_on = NOW()
      WHERE ir_id = ?
    `, [JSON.stringify(attempted), reportId]);

    const routingResult = await routeToNextNGO(reportId);

    if (routingResult.success) {
      return res.json({
        success: true,
        message: `Report rejected and routed to next NGO: ${routingResult.ngoName}`,
        routedTo: routingResult.ngoName,
        remainingNGOs: routingResult.remainingNGOs
      });
    } else {
      return res.json({
        success: true,
        message: routingResult.message || "Report rejected; no NGOs left — escalated to admin."
      });
    }
  } catch (err) {
    console.error("NGO Respond Error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

router.post("/ngo/update-status", async (req, res) => {
  try {
    const { ngoId, reportId, statusType, message } = req.body;
    console.log(ngoId);
    await pool.query(`
      INSERT INTO status_updates (ir_id, ngo_id, status_type, update_message)
      VALUES (?, ?, ?, ?)`,
      [reportId, ngoId, statusType, message]
    );

    let newReportStatus = 'Accepted';
    switch (statusType) {
      case 'Departing':
        newReportStatus = 'NGO_Departing';
        break;
      case 'Arrived':
        newReportStatus = 'NGO_Arrived';
        break;
      case 'Treatment_Started':
        newReportStatus = 'Under_Treatment';
        break;
      case 'Treatment_Complete':
        newReportStatus = 'Treated';
        break;
      case 'Transferred':
        newReportStatus = 'Transferred';
        break;
    }

    await pool.query(`
      UPDATE injury_report SET ir_status = ? WHERE ir_id = ?`,
      [newReportStatus, reportId]
    );

    const [reportDetails] = await pool.query(
      "SELECT um_id FROM injury_report WHERE ir_id = ?", [reportId]
    );

    if (reportDetails.length > 0) {
      await pool.query(`
        INSERT INTO notifications (recipient_id, notification_type, title, message, related_id)
        VALUES (?, ?, ?, ?, ?)`,
        [
          reportDetails[0].um_id,
          'Status_Update',
          `Rescue Update: ${statusType.replace('_', ' ')}`,
          message || `Status updated to: ${statusType.replace('_', ' ')}`,
          reportId
        ]
      );
    }
    res.json({ success: true, message: "Status updated successfully" });
  } catch (err) {
    console.error("Update Status Error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

router.post("/ngo/apply", uploadNgoDoc.single("document"), async (req, res) => {
  try {
    const { ngoName, ngoRegNumber, founderName, email, contact, address } = req.body;
    const documentPath = req.file ? req.file.filename : null;
    if (!documentPath) return res.status(400).json({ success: false, message: "Document upload failed" });

    await pool.query(`
      INSERT INTO ngo_verification (ngo_name, registration_number, founder_name, email, contact, address, document_path)
      VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [ngoName, ngoRegNumber, founderName, email, contact, address, documentPath]
    );

    res.json({ success: true, message: "NGO application submitted for review" });
  } catch (err) {
    console.error("NGO Apply Error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

export default router;