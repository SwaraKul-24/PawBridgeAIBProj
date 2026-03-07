import { pool } from "../db.js";
// INJURY REPORT ROUTES
const NGO_RADIUS = parseFloat(process.env.NGO_SEARCH_RADIUS) || 1.5;

// Helper function to calculate distance
export function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2)**2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon/2)**2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

export async function markReportFullyResolved(reportId, atmName, userId) {
  await pool.query(`
    UPDATE injury_report
    SET routing_exhausted = TRUE, ir_status = 'Rejected', assigned_ngo_id = NULL, updated_on = NOW()
    WHERE ir_id = ?
  `, [reportId]);

  // notify the reporter
  await pool.query(`
    INSERT INTO notifications (recipient_id, notification_type, title, message, related_id)
    VALUES (?, 'Injury_Report', 'No NGO Accepted', ?, ?)
  `, [
    userId,
    `All nearby NGOs declined your ${atmName} report. Admin will review it.`,
    reportId
  ]);

  // notify all admins (assuming rm_id = 1)
  const [admins] = await pool.query("SELECT um_id FROM user_master WHERE rm_id = 1");
  for (const a of admins) {
    await pool.query(`
      INSERT INTO notifications (recipient_id, notification_type, title, message, related_id)
      VALUES (?, 'Injury_Report', 'Escalated to Admin', ?, ?)
    `, [
      a.um_id,
      `All nearby NGOs declined the ${atmName} report (id: ${reportId}). Admin action required.`,
      reportId
    ]);
  }
  console.log(`⚠️ Report ${reportId} marked as fully rejected and escalated to admin.`);
  return { success: false, message: "All NGOs declined. Escalated to admin." };
}

export async function assignReportToNextNGO(reportId) {
  try {
    // Example: find the next eligible NGO based on location or criteria
    const [ngos] = await db.query(
      `SELECT ngo_id FROM ngo_list WHERE is_active = 1 ORDER BY priority ASC LIMIT 1`
    );

    if (!ngos.length) {
      console.warn("No available NGO found for reassignment");
      return;
    }

    const nextNGO = ngos[0].ngo_id;

    // Assign the report to the new NGO
    await db.query(
      `UPDATE incident_reports SET assigned_ngo = ? WHERE ir_id = ?`,
      [nextNGO, reportId]
    );

    console.log(`Report ${reportId} reassigned to NGO ${nextNGO}`);
  } catch (err) {
    console.error("Error reassigning report to next NGO:", err);
  }
}

// Helper function to route report to next available NGO
export async function routeToNextNGO(reportId) {
  console.log('🔄 Routing report:', reportId);
  try {
    const [reports] = await pool.query(
      `SELECT ir.*, atm.atm_name
       FROM injury_report ir
       JOIN animal_type_master atm ON ir.atm_id = atm.atm_id
       WHERE ir_id = ?`,
      [reportId]
    );

    if (!reports.length) {
      console.log('❌ Report not found in routing');
      return { success: false, message: "Report not found" };
    }

    const report = reports[0];
    let availableNGOs = [];
let attemptedNGOs = [];
try {
 const parsedAvailable = JSON.parse(report.available_ngos || '[]');
 const parsedAttempted = JSON.parse(report.attempted_ngos || '[]');
 availableNGOs = Array.isArray(parsedAvailable) ? parsedAvailable.map(Number) : [];
 attemptedNGOs = Array.isArray(parsedAttempted) ? parsedAttempted.map(Number) : [];
} catch (err) {
 console.error("⚠️ Invalid NGO JSON format:", err);
 availableNGOs = [];
 attemptedNGOs = [];
}

    const currentAssigned = report.assigned_ngo_id ? Number(report.assigned_ngo_id) : null;

    if (currentAssigned && !attemptedNGOs.includes(currentAssigned)) {
      attemptedNGOs.push(currentAssigned);
      await pool.query(
        `UPDATE injury_report SET attempted_ngos = ? WHERE ir_id = ?`,
        [JSON.stringify(attemptedNGOs), reportId]
      );
    }

    const nextNGOId = availableNGOs.find(id => !attemptedNGOs.includes(id));
    if (!nextNGOId) {
      // Use the helper function here
      return await markReportFullyResolved(reportId, report.atm_name, report.um_id);
    }

    const [nextNGOs] = await pool.query(
      "SELECT um_id, um_name, um_latitude, um_longitude FROM user_master WHERE um_id = ?",
      [nextNGOId]
    );
    if (!nextNGOs.length) {
      console.log('❌ Next NGO not found for id:', nextNGOId);
      return { success: false, message: "Next NGO not found" };
    }

    const nextNGO = nextNGOs[0];
    const distance = calculateDistance(
      parseFloat(report.ir_latitude),
      parseFloat(report.ir_longitude),
      parseFloat(nextNGO.um_latitude),
      parseFloat(nextNGO.um_longitude)
    );

    attemptedNGOs.push(nextNGOId);
    await pool.query(`
      UPDATE injury_report 
      SET assigned_ngo_id = ?, attempted_ngos = ?, ir_status = 'Pending', updated_on = NOW()
      WHERE ir_id = ?
    `, [nextNGOId, JSON.stringify(attemptedNGOs), reportId]);

    // notify next NGO
    await pool.query(`
      INSERT INTO notifications (recipient_id, notification_type, title, message, related_id)
      VALUES (?, 'Injury_Report', 'New Animal Injury Report', ?, ?)
    `, [
      nextNGOId,
      `New ${report.atm_name} injury ${distance.toFixed(2)}km away. Please accept or reject.`,
      reportId
    ]);

    // notify reporter
    await pool.query(`
      INSERT INTO notifications (recipient_id, notification_type, title, message, related_id)
      VALUES (?, 'Injury_Report', 'Report Forwarded', ?, ?)
    `, [
      report.um_id,
      `Your ${report.atm_name} report was forwarded to ${nextNGO.um_name}. Awaiting response...`,
      reportId
    ]);

    console.log('✅ Routed report', reportId, 'to NGO', nextNGO.um_name);
    return {
      success: true,
      message: `Report routed to ${nextNGO.um_name}`,
      ngoName: nextNGO.um_name,
      remainingNGOs: Math.max(0, availableNGOs.length - attemptedNGOs.length)
    };
  } catch (err) {
    console.error("❌ Error routing to next NGO:", err);
    return { success: false, message: "Server error during routing" };
  }
}