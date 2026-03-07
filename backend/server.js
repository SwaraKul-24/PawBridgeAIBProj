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
  origin: [process.env.FRONTEND_URL, "http://127.0.0.1:5500/"],
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

const PORT = process.env.PORT || 5001;
app.listen(PORT, () =>
  console.log(`🚀 PawBridge Server running on port ${PORT}`)
);