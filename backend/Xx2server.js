// server.js
import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import { pool } from './db.js';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { sendCredentialsMail } from "./mailer.js";

// ========================================================================================
// CORE CONFIGURATION
// ========================================================================================
dotenv.config();

const app = express();
app.use(cors({
  origin: [process.env.FRONTEND_URL, "http://127.0.0.1:5500/"],
  methods: ["GET", "POST", "PUT", "DELETE"],
  credentials: true
}));
app.use(express.json());

// Create upload directories if they don't exist
const uploadDirs = ["uploads/ngo_docs/", "uploads/injury_reports/", "uploads/adoptions/"];
uploadDirs.forEach(dir => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

// Serve uploads
app.use('/uploads', express.static('uploads'));

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => console.log(`🚀 PawBridge Server running at http://localhost:${PORT}`));

// ========================================================================================
// HELPER FUNCTIONS
// ========================================================================================

// INJURY REPORT ROUTES
const NGO_RADIUS = parseFloat(process.env.NGO_SEARCH_RADIUS) || 1.5;

// Helper function to calculate distance
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2)**2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon/2)**2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

async function markReportFullyResolved(reportId, atmName, userId) {
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

async function assignReportToNextNGO(reportId) {
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
async function routeToNextNGO(reportId) {
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

// ========================================================================================
// FILE UPLOAD CONFIGURATION
// ========================================================================================

// FILE UPLOAD CONFIGS WITH MIME VALIDATION
const ngoDocStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/ngo_docs/"),
  filename: (req, file, cb) => cb(null, `ngo_${Date.now()}${path.extname(file.originalname)}`)
});

const injuryReportStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/injury_reports/"),
  filename: (req, file, cb) => cb(null, `injury_${Date.now()}${path.extname(file.originalname)}`)
});

const adoptionStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/adoptions/"),
  filename: (req, file, cb) => cb(null, `adoption_${Date.now()}${path.extname(file.originalname)}`)
});

const ngoDocFilter = (req, file, cb) => {
  if (file.mimetype === "application/pdf") cb(null, true);
  else cb(new Error("Only PDF files are allowed"));
};

const imageFilter = (req, file, cb) => {
  if (file.mimetype.startsWith("image/")) cb(null, true);
  else cb(new Error("Only image files are allowed"));
};

const uploadNgoDoc = multer({ storage: ngoDocStorage, fileFilter: ngoDocFilter, limits: { fileSize: 5*1024*1024 } });
const uploadInjuryImage = multer({ storage: injuryReportStorage, fileFilter: imageFilter, limits: { fileSize: 5*1024*1024 } });
const uploadAdoptionImage = multer({ storage: adoptionStorage, fileFilter: imageFilter, limits: { fileSize: 5*1024*1024 } });

//ADOPTION ROUTE
const uploadAdoption = multer({
  storage: adoptionStorage,
  fileFilter: imageFilter,
  limits: { fileSize: 5*1024*1024 }
});

// ========================================================================================
// AUTH MODULE
// ========================================================================================

// AUTH ROUTES
app.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.json({ success: false, message: "Email and password required" });

    const [rows] = await pool.query(
      `SELECT um.um_id, um.um_name, um.um_email, rm.rm_name, um.um_latitude, um.um_longitude
       FROM user_master um 
       JOIN role_master rm ON um.rm_id = rm.rm_id
       WHERE um.um_email = ? AND um.um_password = ?`,
      [email, password]
    );

    if (rows.length) return res.json({ success: true, message: "Login successful", user: rows[0] });
    res.json({ success: false, message: "Invalid email or password" });
  } catch (err) {
    console.error("Login Error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

app.post("/register", async (req, res) => {
  try {
    const { name, email, password ,address,contact,latitude,longitude} = req.body;
    if (!name || !email || !password) return res.json({ success: false, message: "All fields required" });

    const [existing] = await pool.query("SELECT * FROM user_master WHERE um_email = ?", [email]);
    if (existing.length) return res.json({ success: false, message: "Email already registered" });

    const rm_id = 2; // default role user
    await pool.query("INSERT INTO user_master (um_name, um_email, um_password,um_contact,um_address,um_longitude,um_latitude, rm_id) VALUES (?,?,?,?,?,?,?,?)", [name,email,password,contact,address,longitude,latitude,rm_id]);

    await sendCredentialsMail(email, name, password);
    console.log("Triggered email sending for", email);

    res.json({ success: true, message: "Registration successful" });
  } catch (err) {
    console.error("Register Error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// ========================================================================================
// USER PROFILE MODULE
// ========================================================================================

app.get("/user/profile/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const [rows] = await pool.query(
      `SELECT um_id, um_name, um_email, um_contact, um_address 
       FROM user_master WHERE um_id = ?`,
      [userId]
    );
    if (rows.length === 0) {
      return res.json({ success: false, message: "User not found" });
    }
    res.json({ success: true, user: rows[0] });
  } catch (err) {
    console.error("Get Profile Error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

app.put("/user/profile/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const { um_name, um_email, um_contact, um_address } = req.body;

    await pool.query(
      `UPDATE user_master 
       SET um_name = ?, um_email = ?, um_contact = ?, um_address = ?
       WHERE um_id = ?`,
      [um_name, um_email, um_contact, um_address, userId]
    );

    res.json({ success: true, message: "Profile updated successfully" });
  } catch (err) {
    console.error("Update Profile Error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// ========================================================================================
// NGO APPLICATION MODULE
// ========================================================================================

// NGO ROUTES
app.post("/ngo/apply", uploadNgoDoc.single("document"), async (req, res) => {
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

app.get("/admin/ngo-applications", async (req, res) => {
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

app.get("/admin/ngo-applications-all", async (req, res) => {
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

app.post("/admin/ngo-decision", async (req, res) => {
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

app.get("/admin/ngo-applications-app", async (req, res) => {
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

// ========================================================================================
// INJURY REPORT MODULE
// ========================================================================================

app.post("/injury-report", uploadInjuryImage.single("photo"), async (req, res) => {
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

// DISPLAY REPORTS TO USER(common) (query param)
app.get("/user-reports/:userId", async (req, res) => {
  try {
    const { userId } = req.params;

   const [reports] = await pool.query(`
  SELECT ir.ir_id, ir.ir_latitude, ir.ir_longitude, ir.ir_location_address,
         ir.ir_description, ir.ir_image_url, ir.ir_status,
         ngo.um_name AS assigned_ngo_name
  FROM injury_report ir
  LEFT JOIN user_master ngo ON ir.assigned_ngo_id = ngo.um_id 
  WHERE ir.um_id = ?
  ORDER BY ir.created_on DESC
`, [userId]);


    res.json({ success: true, reports });
  } catch (err) {
    console.error("Fetch User Reports Error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

app.get("/user/reports/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const [reports] = await pool.query(`
      SELECT ir.*, atm.atm_name, um.um_name as assigned_ngo_name
      FROM injury_report ir
      JOIN animal_type_master atm ON ir.atm_id = atm.atm_id
      LEFT JOIN user_master um ON ir.assigned_ngo_id = um.um_id
      WHERE ir.um_id = ?
      ORDER BY ir.created_on DESC
    `, [userId]);
    res.json({ success: true, reports });
  } catch (err) {
    console.error("Get User Reports Error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

app.get("/reports/list/:ngoId", async (req, res) => {
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

app.put("/reports/update/:reportId", async (req, res) => {
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

app.post("/ngo/respond-report", async (req, res) => {
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

app.post("/ngo/update-status", async (req, res) => {
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


// ========================================================================================
// REPORT ROUTING & ADMIN CONTROL MODULE
// ========================================================================================

app.get('/admin/rejected-reports', async (req, res) => {
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

app.post("/admin/manually-assign-report", async (req, res) => {
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

// ========================================================================================
// NOTIFICATIONS MODULE
// ========================================================================================

app.get("/ngo/notifications/:ngoId", async (req, res) => {
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

app.get("/user/notifications/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const [notifications] = await pool.query(`
      SELECT * FROM notifications 
      WHERE recipient_id = ? 
      ORDER BY created_at DESC 
      LIMIT 20
    `, [userId]);
    res.json({ success: true, notifications });
  } catch (err) {
    console.error("Get User Notifications Error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});


// ========================================================================================
// ADOPTION MODULE
// ========================================================================================

app.post("/adoptions/add", uploadAdoption.single("image"), async (req, res) => {
  try {
    const { animalName, animalType, breed, ageMonths, gender, description, ngoId } = req.body;
    const image = req.file ? req.file.filename : null;

    if (!animalName || !animalType || !breed || !ageMonths || !gender || !description) {
      return res.status(400).json({ success: false, message: "All fields are required" });
    }

    const [animalTypes] = await pool.query("SELECT atm_id FROM animal_type_master WHERE atm_name=?", [animalType]);
    if (!animalTypes.length) return res.status(400).json({ success: false, message: "Invalid animal type" });

    const atmId = animalTypes[0].atm_id;

    await pool.query(`
      INSERT INTO adoption_posts (ngo_id, animal_name, atm_id, breed, age_months, gender, description, image_url)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [ngoId, animalName, atmId, breed, ageMonths, gender, description, image]);

    res.json({ success: true, message: "Adoption post created" });
  } catch(err) {
    console.error("Add Adoption Post Error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

app.get("/adoptions/list/:ngoId", async (req, res) => {
  try {
    const ngoId = req.params.ngoId;
    const [posts] = await pool.query(`
      SELECT ap.*, atm.atm_name 
      FROM adoption_posts ap 
      JOIN animal_type_master atm ON ap.atm_id = atm.atm_id
      WHERE ap.ngo_id = ? AND ap.is_available = 1
      ORDER BY ap.created_at DESC
    `, [ngoId]);

    const host = process.env.BACKEND_URL || 'http://localhost:5001';
    const postsWithFullImage = posts.map(post => ({
      ...post,
      image_url: post.image_url ? `${host}/uploads/adoptions/${post.image_url}` : null
    }));

    res.json({ success: true, posts: postsWithFullImage });
  } catch(err) {
    console.error("Get Adoption Posts Error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

app.put("/adoptions/remove/:apId", async (req, res) => {
  try {
    const apId = req.params.apId;

    const [result] = await pool.query(
      "UPDATE adoption_posts SET is_available = FALSE WHERE ap_id = ?",
      [apId]
    );

    if(result.affectedRows === 0)
      return res.status(404).json({ success: false, message: "Post not found" });

    res.json({ success: true, message: "Adoption post removed successfully" });
  } catch(err) {
    console.error("Remove Adoption Post Error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

app.get("/adoption/posts", async (req, res) => {
  try {
    const [posts] = await pool.query(`
      SELECT ap.*, atm.atm_name, um.um_name as ngo_name, um.um_contact, um.um_email
      FROM adoption_posts ap
      JOIN animal_type_master atm ON ap.atm_id = atm.atm_id
      JOIN user_master um ON ap.ngo_id = um.um_id
      WHERE ap.is_available = TRUE
      ORDER BY ap.created_at DESC
    `);
    res.json({ success: true, posts });
  } catch (err) {
    console.error("Get Adoption Posts Error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});


app.get("/adoptions/all", async (req, res) => {
  try {
    const [posts] = await pool.query(`
      SELECT 
        ap.*, 
        atm.atm_name, 
        ngo.um_name as ngo_name, 
        ngo.um_contact as contact_number, 
        ngo.um_email as email 
      FROM adoption_posts ap
      JOIN animal_type_master atm ON ap.atm_id = atm.atm_id
      JOIN user_master ngo ON ap.ngo_id = ngo.um_id
      WHERE ap.is_available = TRUE AND ngo.rm_id=3
      ORDER BY ap.created_at DESC
    `);

    const host = process.env.BACKEND_URL || "http://localhost:5001";
    const postsWithFullImage = posts.map(post => ({
      ...post,
      image_url: post.image_url ? `${host}/uploads/adoptions/${post.image_url}` : null
    }));

    res.json({ success: true, posts: postsWithFullImage });
  } catch(err) {
    console.error("Get All Adoption Posts Error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});


// ========================================================================================
// DONATIONS MODULE
// ========================================================================================

//DONATIONS ROUTE FIXED (query param)
app.get("/donations/total", async (req, res) => {
  try {
    const region = req.query.region;
    let query = "SELECT SUM(amount) as total FROM donations";
    const params = [];

    if(region) {
      query += " WHERE region = ?";
      params.push(region);
    }

    const [result] = await pool.query(query, params);
    const total = result[0].total || 0;

    res.json({ success: true, total });
  } catch(err) {
    console.error("Get Donations Error:", err);
    res.status(500).json({ success:false, message: "Server error" });
  }
});

// ========================================================================================
// NGO DASHBOARD MODULE
// ========================================================================================

app.get("/ngo/stats/:ngoId", async (req, res) => {
  try {
    const { ngoId } = req.params;
    const [reportStats] = await pool.query(
      "SELECT COUNT(*) as active_cases FROM injury_report WHERE assigned_ngo_id = ? AND ir_status NOT IN ('Treated', 'Transferred')",
      [ngoId]
    );
    const [adoptionStats] = await pool.query(
      "SELECT COUNT(*) as adoption_posts FROM adoption_posts WHERE ngo_id = ? AND is_available = TRUE",
      [ngoId]
    );
    const [donationStats] = await pool.query(
      "SELECT COALESCE(SUM(amount), 0) as total_donations FROM donations WHERE region = 'Pune'",
      []
    );
    res.json({ 
      success: true, 
      stats: {
        activeCases: reportStats[0].active_cases,
        adoptionPosts: adoptionStats[0].adoption_posts,
        totalDonations: donationStats[0].total_donations
      }
    });
  } catch (err) {
    console.error("Get NGO Stats Error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});


// REPORTS: list & update (use injury_report table)

/**
 * GET /reports/list/:ngoId
 * Returns injury reports assigned to the given NGO (most recent first)
 */


/**
 * PUT /reports/update/:reportId
 * Body: {
 *   status: 'Accepted' | 'NGO_Departing' | 'NGO_Arrived' | 'Under_Treatment' | 'Treated' | 'Transferred' | 'Rejected',
 *   ngoId: number,
 *   updateMessage?: string
 * }
 */