import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import multer from 'multer';

import authRoutes from "./routes/auth.routes.js";
import userRoutes from "./routes/user.routes.js";
import ngoRoutes from "./routes/ngo.routes.js";
import injuryRoutes from "./routes/injury.routes.js";
import adminRoutes from "./routes/admin.routes.js";
import adoptionRoutes from "./routes/adoption.routes.js";
import donationRoutes from "./routes/donation.routes.js";
import dashboardRoutes from "./routes/dashboard.routes.js";
import volunteerRoutes from "./routes/volunteer.routes.js";

dotenv.config();

const app = express();

app.use(cors({
  origin: ["https://paw-bridge-aib-proj.vercel.app", "http://127.0.0.1:5500"],
  methods: ["GET", "POST", "PUT", "DELETE"],
  credentials: true
}));
app.use(express.json());
app.use("/uploads", express.static("uploads"));

// Mount routes
app.use(authRoutes);
app.use(userRoutes);
app.use(ngoRoutes);
app.use(injuryRoutes);
app.use(adminRoutes);
app.use(adoptionRoutes);
app.use(donationRoutes);
app.use(dashboardRoutes);
app.use(volunteerRoutes);

app.post("/ai-analyze", async (req, res) => {

  try {

    const image = req.body.image;

const prompt = `
Analyze this injured animal image.

Return ONLY JSON:

{
 "animal_type":"dog | cat | cow | goat | sheep | snake",
 "injury_description":"short description",
 "severity":"Low | Medium | Critical"
}
`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent?key=${process.env.GEMINI_KEY}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                { text: prompt },
                {
                  inline_data: {
                    mime_type: "image/jpeg",
                    data: image
                  }
                }
              ]
            }
          ]
        })
      }
    );

    const data = await response.json();
    console.log("Gemini raw response:", data);

let text = data.candidates[0].content.parts[0].text;

// remove markdown if Gemini adds it
text = text.replace(/```json/g, "").replace(/```/g, "").trim();

let ai = {};

try {
  ai = JSON.parse(text);
} catch (err) {
  console.error("AI JSON parse error:", text);
}

res.json(ai);

  } catch (error) {

    console.error(error);

    res.json({});

  }

});

const PORT = process.env.PORT || 5001;
app.listen(PORT, () =>
  console.log(`🚀 PawBridge Server running on port ${PORT}`)
);