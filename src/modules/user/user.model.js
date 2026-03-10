import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, unique: true, required: true, lowercase: true, trim: true },
    password: { type: String, required: true },

    // Profile
    phone: String,
    skills: [String],
    resume: String,         // file path or cloud URL
    resumeOriginalName: String,
    bio: String,
    experience: String,
    location: String,
    portfolio: String,
    linkedIn: String,
    profilePhoto: String,

    // Education
    education: [
      {
        degree: String,
        institution: String,
        year: String,
      },
    ],

    // Work Experience
    workExperience: [
      {
        company: String,
        role: String,
        from: Date,
        to: Date,
        current: { type: Boolean, default: false },
        description: String,
      },
    ],

    appliedJobs: [{ type: mongoose.Schema.Types.ObjectId, ref: "Job" }],
    savedJobs: [{ type: mongoose.Schema.Types.ObjectId, ref: "Job" }],

    notifications: [
      {
        message: String,
        read: { type: Boolean, default: false },
        createdAt: { type: Date, default: Date.now },
      },
    ],

    profileCompleted: { type: Boolean, default: false },
    status: { type: String, enum: ["active", "inactive", "suspended"], default: "active" },

    audit: {
      createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    },
  },
  { timestamps: true }
);

export default mongoose.model("User", userSchema);
