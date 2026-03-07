import express from "express";
import { pool } from "../db.js";
const router = express.Router();

router.get("/user/profile/:userId", async (req, res) => {
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

router.put("/user/profile/:userId", async (req, res) => {
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

router.get("/user-reports/:userId", async (req, res) => {
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

router.get("/user/reports/:userId", async (req, res) => {
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

router.get("/user/notifications/:userId", async (req, res) => {
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

export default router;