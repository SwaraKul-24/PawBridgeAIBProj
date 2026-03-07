import fs from "fs";
import path from "path";
import multer from "multer";

const uploadDirs = ["uploads/ngo_docs/", "uploads/injury_reports/", "uploads/adoptions/"];
uploadDirs.forEach(dir => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

export const ngoDocStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/ngo_docs/"),
  filename: (req, file, cb) => cb(null, `ngo_${Date.now()}${path.extname(file.originalname)}`)
});

export const injuryReportStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/injury_reports/"),
  filename: (req, file, cb) => cb(null, `injury_${Date.now()}${path.extname(file.originalname)}`)
});

export const adoptionStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/adoptions/"),
  filename: (req, file, cb) => cb(null, `adoption_${Date.now()}${path.extname(file.originalname)}`)
});

export const ngoDocFilter = (req, file, cb) => {
  if (file.mimetype === "application/pdf") cb(null, true);
  else cb(new Error("Only PDF files are allowed"));
};

export const imageFilter = (req, file, cb) => {
  if (file.mimetype.startsWith("image/")) cb(null, true);
  else cb(new Error("Only image files are allowed"));
};

export const uploadNgoDoc = multer({ storage: ngoDocStorage, fileFilter: ngoDocFilter, limits: { fileSize: 5*1024*1024 } });
export const uploadInjuryImage = multer({ storage: injuryReportStorage, fileFilter: imageFilter, limits: { fileSize: 5*1024*1024 } });
export const uploadAdoptionImage = multer({ storage: adoptionStorage, fileFilter: imageFilter, limits: { fileSize: 5*1024*1024 } });

//ADOPTION ROUTE
export const uploadAdoption = multer({
  storage: adoptionStorage,
  fileFilter: imageFilter,
  limits: { fileSize: 5*1024*1024 }
});
