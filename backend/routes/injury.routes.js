import express from "express";
import { pool } from "../db.js";
import { uploadInjuryImage } from "../utils/upload.js";
import { calculateDistance, routeToNextNGO } from "../utils/helpers.js";
const router = express.Router();

router.post("/injury-report", uploadInjuryImage.single("photo"), async (req, res) => {
  try {
    const { userId, animalType, latitude, longitude, locationAddress, description } = req.body;
    const imageUrl = req.file ? req.file.filename : null;

    // 1️⃣ Validate animal type
    const [animalTypes] = await pool.query(
      "SELECT atm_id FROM animal_type_master WHERE atm_name = ?", 
      [animalType]
    );
    if (!animalTypes.length) {
      return res.json({ success: false, message: "Invalid animal type" });
    }
    const atmId = animalTypes[0].atm_id;

    // 2️⃣ Insert injury report WITHOUT assigned NGO initially
    const [reportResult] = await pool.query(`
      INSERT INTO injury_report (um_id, atm_id, ir_latitude, ir_longitude, ir_location_address, ir_description, ir_image_url, ir_status)
      VALUES (?, ?, ?, ?, ?, ?, ?, 'Pending')`,
      [userId, atmId, latitude, longitude, locationAddress, description, imageUrl]
    );
    const reportId = reportResult.insertId;

    // 3️⃣ Find ALL NGOs within 10km radius and sort by distance
    const [ngos] = await pool.query(`
      SELECT um_id, um_name, um_email, um_latitude, um_longitude
      FROM user_master
      WHERE rm_id = 3 AND um_latitude IS NOT NULL AND um_longitude IS NOT NULL
    `);

    const nearbyNGOs = ngos
      .map(ngo => ({
        ...ngo,
        distance: calculateDistance(
          parseFloat(latitude), 
          parseFloat(longitude), 
          parseFloat(ngo.um_latitude), 
          parseFloat(ngo.um_longitude)
        )
      }))
      .filter(ngo => ngo.distance <= 10) // 10km radius
      .sort((a, b) => a.distance - b.distance);

    // 4️⃣ If NO NGO within 10km, mark as routing exhausted immediately
    if (!nearbyNGOs.length) {
      await pool.query(`
        UPDATE injury_report 
        SET routing_exhausted = TRUE, ir_status = 'Rejected'
        WHERE ir_id = ?
      `, [reportId]);

      await pool.query(`
        INSERT INTO notifications (recipient_id, notification_type, title, message, related_id)
        VALUES (?, ?, ?, ?, ?)
      `, [
        userId,
        'Injury_Report',
        'No NGO Available',
        `Unfortunately, no NGO is available within 10km of the reported location.`,
        reportId
      ]);

      return res.json({ 
        success: true, 
        message: "Report submitted but no NGO found within 10km",
        reportId 
      });
    }

    // 5️⃣ Build queue: extract just the IDs
    const availableNGOIds = nearbyNGOs.map(n => n.um_id);
    const firstNGO = nearbyNGOs[0];

    // 6️⃣ Update report with first NGO assignment + full queue
    await pool.query(`
      UPDATE injury_report 
      SET assigned_ngo_id = ?,
          available_ngos = ?,
          attempted_ngos = ?,
          ir_status = 'Pending'
      WHERE ir_id = ?
    `, [
      firstNGO.um_id,
      JSON.stringify(availableNGOIds),
      JSON.stringify([firstNGO.um_id]),
      reportId
    ]);

    // 7️⃣ Notify user about report submission
    await pool.query(`
      INSERT INTO notifications (recipient_id, notification_type, title, message, related_id)
      VALUES (?, ?, ?, ?, ?)
    `, [
      userId,
      'Injury_Report',
      'Report Submitted Successfully',
      `Your report for ${animalType} has been submitted. Nearest NGO (${firstNGO.um_name}) has been notified.`,
      reportId
    ]);

    // 8️⃣ Notify FIRST NGO
    await pool.query(`
      INSERT INTO notifications (recipient_id, notification_type, title, message, related_id)
      VALUES (?, ?, ?, ?, ?)
    `, [
      firstNGO.um_id,
      'Injury_Report',
      'New Animal Injury Report',
      `New ${animalType} injury reported ${firstNGO.distance.toFixed(2)}km away. Please accept or reject.`,
      reportId
    ]);

    res.json({
      success: true,
      message: "Injury report submitted and NGO assigned",
      reportId,
      nearestNGO: firstNGO.um_name,
      totalNGOsInRange: nearbyNGOs.length
    });

  } catch (err) {
    console.error("Injury Report Error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

router.get("/reports/list/:ngoId", async (req, res) => {
  const { ngoId } = req.params;
  try {
    const host = process.env.BACKEND_URL || (`http://localhost:${process.env.PORT || 5001}`);

    const [rows] = await pool.query(
      `SELECT 
         ir.ir_id AS report_id,
         ir.ir_location_address AS location,
         ir.ir_description AS injury,
         ir.ir_image_url AS image_filename,
         ir.ir_status AS status,
         ir.created_on AS reported_at,
         atm.atm_name AS animal_type,
         reporter.um_name AS reporter_name,
         ir.ir_latitude AS latitude,
         ir.ir_longitude AS longitude
       FROM injury_report ir
       JOIN animal_type_master atm ON ir.atm_id = atm.atm_id
       LEFT JOIN user_master reporter ON ir.um_id = reporter.um_id
       WHERE ir.assigned_ngo_id = ?
       ORDER BY ir.created_on DESC`,
      [ngoId]
    );

    const reports = rows.map(r => ({
      report_id: r.report_id,
      location: r.location,
      injury: r.injury,
      image_url: r.image_filename ? `${host}/uploads/injury_reports/${r.image_filename}` : null,
      status: r.status,
      reported_at: r.reported_at,
      animal_type: r.animal_type,
      reporter_name: r.reporter_name,
      latitude: r.latitude,
      longitude: r.longitude
    }));

    return res.json({ success: true, reports });
  } catch (err) {
    console.error("Error fetching reports:", err);
    return res.status(500).json({ success: false, message: "Server error fetching reports" });
  }
});

router.put("/reports/update/:reportId", async (req, res) => {
  const { reportId } = req.params;
  const { status, ngoId, updateMessage } = req.body;
  console.log(ngoId);

  try {
    console.log(`🔄 Updating report ${reportId} with status: ${status}`);

    // 1️⃣ Validate existence
    const [reports] = await pool.query(
      "SELECT ir.*, atm.atm_name FROM injury_report ir JOIN animal_type_master atm ON ir.atm_id = atm.atm_id WHERE ir.ir_id = ?",
      [reportId]
    );

    if (!reports.length) {
      return res.status(404).json({ success: false, message: "Report not found" });
    }

    const report = reports[0];

    // 2️⃣ Handle each status update case
    if (status === "Rejected") {
  if (!ngoId) {
    return res
      .status(400)
      .json({ success: false, message: "Missing ngoId for rejection" });
  }

  console.log(`❌ NGO ${ngoId} rejected report ${reportId}`);

  // Safely parse attempted_ngos
  let attempted = [];
  try {
    const parsed = report.attempted_ngos
      ? JSON.parse(report.attempted_ngos)
      : [];
    attempted = Array.isArray(parsed) ? parsed : [];
  } catch {
    attempted = [];
  }

  if (!attempted.includes(Number(ngoId))) attempted.push(Number(ngoId));

  // Update current report before routing
  await pool.query(
    `UPDATE injury_report 
     SET attempted_ngos = ?, assigned_ngo_id = NULL, ir_status = 'Pending', updated_on = NOW() 
     WHERE ir_id = ?`,
    [JSON.stringify(attempted), reportId]
  );

  // Try to route to next NGO
  const routeResult = await routeToNextNGO(reportId);

  return res.json({
    success: true,
    message:
      routeResult.success
        ? `Report routed to next NGO (${routeResult.ngoName})`
        : routeResult.message || "All NGOs declined — escalated to admin.",
  });
}

    // 3️⃣ For progress updates (Accepted, NGO_Departing, etc.)
    await pool.query(
      "UPDATE injury_report SET ir_status = ?, updated_on = NOW() WHERE ir_id = ?",
      [status, reportId]
    );

    // 4️⃣ Record NGO status update
    // await pool.query(
    //   `INSERT INTO status_updates (ir_id, ngo_id, status_type, update_message)
    //    VALUES (?, ?, ?, ?)`,
    //   [reportId, ngoId, status, updateMessage || `Status updated to ${status}`]
    // );

    // 5️⃣ Notify the user who created the report
    await pool.query(
      `INSERT INTO notifications (recipient_id, notification_type, title, message, related_id)
       VALUES (?, 'Status_Update', ?, ?, ?)`,
      [
        report.um_id,
        `Report Status: ${status}`,
        updateMessage || `The status of your ${report.atm_name} report has been updated to ${status}.`,
        reportId,
      ]
    );

    console.log(`✅ Report ${reportId} updated to status: ${status}`);
    res.json({ success: true, message: `Report updated to ${status}` });

  } catch (error) {
    console.error("❌ Error updating report:", error);
    res.status(500).json({ success: false, message: "Server error updating report" });
  }
});

export default router;