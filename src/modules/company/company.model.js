import mongoose from "mongoose";

/* ======================
   COMPANY AUTH
====================== */
const companySchema = new mongoose.Schema(
  {
    email: { type: String, unique: true, required: true, trim: true, lowercase: true },
    password: { type: String, required: true },
    token: String,
    roles: { type: [String], default: ["admin"] },
    status: { type: String, enum: ["active", "inactive", "suspended"], default: "active" },
    profileCompleted: { type: Boolean, default: false },
    notifications: [
      {
        message: String,
        read: { type: Boolean, default: false },
        createdAt: { type: Date, default: Date.now },
      },
    ],
    jobsPosted: [{ type: mongoose.Schema.Types.ObjectId, ref: "Job" }],
    audit: {
      createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "Company" },
      updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "Company" },
    },
  },
  { timestamps: true }
);

/* ======================
   COMPANY PROFILE
====================== */
const profileSchema = new mongoose.Schema(
  {
    companyId: { type: mongoose.Schema.Types.ObjectId, ref: "Company", required: true, unique: true },
    companyName: { type: String, required: true, trim: true },
    website: String,
    location: String,
    description: String,
    industry: String,
    size: { type: String, enum: ["1-10", "11-50", "51-200", "201-500", "500+"] },
    logo: String,
    socialLinks: {
      linkedin: String,
      twitter: String,
      facebook: String,
    },
    tags: [String],
    jobsCount: { type: Number, default: 0 },
    audit: {
      createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "Company" },
      updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "Company" },
    },
  },
  { timestamps: true }
);

/* ======================
   JOB MODEL
   FIX: Added text indexes for search
====================== */
const jobSchema = new mongoose.Schema(
  {
    companyId: { type: mongoose.Schema.Types.ObjectId, ref: "Company", required: true },
    title: { type: String, required: true, trim: true },
    experience: String,
    salaryMin: { type: Number },
    salaryMax: { type: Number },
    salary: String, // kept for display
    location: { type: String, trim: true },
    description: { type: String },
    skills: [String],
    employmentType: {
      type: String,
      enum: ["Full-time", "Part-time", "Contract", "Internship", "Remote"],
      default: "Full-time",
    },
    status: { type: String, enum: ["open", "closed", "paused"], default: "open" },
    applicantsCount: { type: Number, default: 0 },
    category: String,
    deadline: Date,
    audit: {
      createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "Company" },
      updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "Company" },
    },
  },
  { timestamps: true }
);

// FIX: Text indexes for proper search
jobSchema.index({ title: "text", description: "text", skills: "text", location: "text", category: "text" });

/* ======================
   APPLICATION MODEL
   FIX: Added userId field (was missing - caused silent data loss)
   FIX: Added compound unique index to prevent duplicate applications
====================== */
const applicationSchema = new mongoose.Schema(
  {
    jobId: { type: mongoose.Schema.Types.ObjectId, ref: "Job", required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }, // FIX: was missing
    candidateName: { type: String, required: true },
    candidateEmail: { type: String },
    resume: String,
    coverLetter: String,
    status: {
      type: String,
      enum: ["pending", "shortlisted", "interview", "rejected", "hired"],
      default: "pending",
    },
    feedback: String,
    interviewDate: Date,
    audit: {
      createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "Company" },
      updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "Company" },
    },
  },
  { timestamps: true }
);

// FIX: Prevent duplicate applications
applicationSchema.index({ jobId: 1, userId: 1 }, { unique: true });

export const Company = mongoose.model("Company", companySchema);
export const CompanyProfile = mongoose.model("CompanyProfile", profileSchema);
export const Job = mongoose.model("Job", jobSchema);
export const Application = mongoose.model("Application", applicationSchema);
