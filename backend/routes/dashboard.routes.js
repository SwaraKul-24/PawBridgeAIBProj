import express from "express";
import { pool } from "../db.js";
const router = express.Router();

router.get("/ngo/stats/:ngoId", async (req, res) => {
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

export default router;