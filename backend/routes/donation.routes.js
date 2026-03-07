import express from "express";
import { pool } from "../db.js";
const router = express.Router();

router.get("/donations/total", async (req, res) => {
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

router.post("/api/donation/pay", async (req,res)=>{

  const {user_id, donor_name, email, amount, transaction_id} = req.body;

  try{

    await pool.execute(
      `INSERT INTO donations 
      (user_id, donor_name, email, amount, transaction_id) 
      VALUES (?,?,?,?,?)`,
      [user_id, donor_name, email, amount, transaction_id]
    );

    res.json({
      success:true
    });

  }catch(err){

    console.log(err);

    res.status(500).json({
      success:false
    });

  }

});

export default router;