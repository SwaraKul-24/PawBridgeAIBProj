import express from "express";
import { pool } from "../db.js";
import { sendCredentialsMail } from "../mailer.js";
const router = express.Router();

router.post("/login", async (req, res) => {
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

router.post("/register", async (req, res) => {
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

export default router;