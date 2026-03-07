import express from "express";
import {uploadAdoptionImage,uploadAdoption} from "../utils/upload.js";
import { pool } from "../db.js";
const router = express.Router();

router.post("/adoptions/add", uploadAdoption.single("image"), async (req, res) => {
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

router.get("/adoptions/list/:ngoId", async (req, res) => {
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

router.put("/adoptions/remove/:apId", async (req, res) => {
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

router.get("/adoption/posts", async (req, res) => {
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


router.get("/adoptions/all", async (req, res) => {
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

export default router;