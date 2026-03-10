import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import connectionDB from "./connection/db.connection.js";
import { companyRouter, userRouter } from "./src/routes/index.js";
import { handleMulterError } from "./src/middleware/upload.middleware.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/* ======================
   MIDDLEWARE
====================== */
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors({
  origin: process.env.CLIENT_URL || "*",
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"],
}));

// Serve uploaded files statically
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

/* ======================
   HEALTH CHECK
====================== */
app.get("/", (req, res) => {
  res.json({
    message: "JobiEz API is running 🚀",
    version: "2.0.0",
    endpoints: {
      company: "/api/company",
      user: "/api/user",
    },
  });
});

/* ======================
   API ROUTES
====================== */
app.use("/api/company", companyRouter);
app.use("/api/user", userRouter);

/* ======================
   MULTER ERROR HANDLER
====================== */
app.use(handleMulterError);

/* ======================
   404 HANDLER
====================== */
app.use((req, res) => {
  res.status(404).json({ message: `Route ${req.method} ${req.path} not found` });
});

/* ======================
   GLOBAL ERROR HANDLER
====================== */
app.use((err, req, res, next) => {
  console.error("Unhandled error:", err);
  res.status(500).json({ message: "Internal server error" });
});

/* ======================
   START SERVER
====================== */
async function connect() {
  try {
    await connectionDB();
    app.listen(PORT, () => {
      console.log(`✅ JobiEz server running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Database connection failed:", error);
    process.exit(1);
  }
}

connect();
