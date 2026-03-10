import multer from "multer";
import path from "path";
import fs from "fs";

/* ======================
   STORAGE CONFIG
====================== */

// Resume storage
const resumeStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = "uploads/resumes";
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const uniqueName = `resume_${req.userId}_${Date.now()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  },
});

// Logo storage
const logoStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = "uploads/logos";
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const uniqueName = `logo_${req.companyId}_${Date.now()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  },
});

/* ======================
   FILE FILTERS
====================== */

const resumeFilter = (req, file, cb) => {
  const allowed = [".pdf", ".doc", ".docx"];
  const ext = path.extname(file.originalname).toLowerCase();
  if (allowed.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error("Only PDF, DOC, DOCX files are allowed for resumes"), false);
  }
};

const imageFilter = (req, file, cb) => {
  const allowed = [".jpg", ".jpeg", ".png", ".webp"];
  const ext = path.extname(file.originalname).toLowerCase();
  if (allowed.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error("Only JPG, PNG, WEBP files are allowed for logos"), false);
  }
};

/* ======================
   MULTER INSTANCES
====================== */
export const uploadResume = multer({
  storage: resumeStorage,
  fileFilter: resumeFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB max
});

export const uploadLogo = multer({
  storage: logoStorage,
  fileFilter: imageFilter,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2 MB max
});

/* ======================
   MULTER ERROR HANDLER
====================== */
export const handleMulterError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === "LIMIT_FILE_SIZE")
      return res.status(400).json({ message: "File too large" });
    return res.status(400).json({ message: err.message });
  }
  if (err) return res.status(400).json({ message: err.message });
  next();
};
