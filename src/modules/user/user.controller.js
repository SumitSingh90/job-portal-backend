import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import * as repo from "./user.repository.js";

const SECRET = process.env.JWT_SECRET || "secret123";

/* ======================
   AUTH
====================== */
export async function signup(req, res) {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password)
      return res.status(400).json({ message: "Name, email and password are required" });
    if (password.length < 6)
      return res.status(400).json({ message: "Password must be at least 6 characters" });

    const exists = await repo.findUserByEmail(email);
    if (exists) return res.status(400).json({ message: "Email already registered" });

    // FIX: Hash password before saving
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await repo.createUser({ name, email, password: hashedPassword });

    res.status(201).json({
      message: "User registered successfully",
      data: { id: user._id, name: user.name, email: user.email },
    });
  } catch (error) {
    console.error("Signup error:", error);
    res.status(500).json({ message: "Server error" });
  }
}

export async function login(req, res) {
  try {
    const { email, password } = req.body;

    if (!email || !password)
      return res.status(400).json({ message: "Email and password are required" });

    const user = await repo.findUserByEmail(email);
    if (!user) return res.status(404).json({ message: "User not found" });

    if (user.status === "suspended")
      return res.status(403).json({ message: "Account suspended. Contact support." });

    // FIX: Compare with hashed password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: "Invalid credentials" });

    const token = jwt.sign({ id: user._id, role: "user" }, SECRET, { expiresIn: "7d" });

    res.json({
      message: "Login successful",
      token,
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
        profileCompleted: user.profileCompleted,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Server error" });
  }
}

export async function getMe(req, res) {
  try {
    const user = await repo.findUserById(req.userId);
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json({ data: user });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
}

/* ======================
   PROFILE
====================== */
export async function getProfile(req, res) {
  try {
    const user = await repo.findUserById(req.userId);
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json({ data: user });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
}

export async function updateProfile(req, res) {
  try {
    // Prevent password update through this route
    const { password, ...updateData } = req.body;
    const user = await repo.updateUserProfile(req.userId, updateData);
    res.json({ message: "Profile updated successfully", data: user });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
}

export async function addSkill(req, res) {
  try {
    const { skill } = req.body;
    if (!skill) return res.status(400).json({ message: "Skill is required" });
    const user = await repo.addSkill(req.userId, skill.trim());
    res.json({ message: "Skill added", data: user.skills });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
}

export async function removeSkill(req, res) {
  try {
    const { skill } = req.body;
    if (!skill) return res.status(400).json({ message: "Skill is required" });
    const user = await repo.removeSkill(req.userId, skill.trim());
    res.json({ message: "Skill removed", data: user.skills });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
}

export async function addEducation(req, res) {
  try {
    const { degree, institution, year } = req.body;
    if (!degree || !institution)
      return res.status(400).json({ message: "Degree and institution are required" });
    const user = await repo.addEducation(req.userId, { degree, institution, year });
    res.json({ message: "Education added", data: user.education });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
}

export async function addWorkExperience(req, res) {
  try {
    const { company, role, from, to, current, description } = req.body;
    if (!company || !role)
      return res.status(400).json({ message: "Company and role are required" });
    const user = await repo.addWorkExperience(req.userId, { company, role, from, to, current, description });
    res.json({ message: "Work experience added", data: user.workExperience });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
}

export async function uploadResume(req, res) {
  try {
    if (!req.file)
      return res.status(400).json({ message: "Resume file is required" });

    const resumePath = req.file.path;
    const originalName = req.file.originalname;

    const user = await repo.updateResume(req.userId, resumePath, originalName);
    res.json({
      message: "Resume uploaded successfully",
      data: { resume: user.resume, resumeOriginalName: user.resumeOriginalName },
    });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
}

/* ======================
   JOB APPLICATION
   FIX: duplicate check + userId stored + cover letter support
====================== */
export async function applyJob(req, res) {
  try {
    const { jobId } = req.params;
    const { coverLetter } = req.body;

    // FIX: Check for duplicate application
    const existing = await repo.findExistingApplication(jobId, req.userId);
    if (existing)
      return res.status(400).json({ message: "You have already applied for this job" });

    const user = await repo.findUserById(req.userId);

    const payload = {
      jobId,
      userId: req.userId,                          // FIX: was missing from schema
      candidateName: user.name,
      candidateEmail: user.email,
      resume: user.resume || "",
      coverLetter: coverLetter || "",
    };

    const application = await repo.applyJob(payload);

    // Notify user
    await repo.addNotification(req.userId, `You applied for job successfully`);

    res.status(201).json({ message: "Application submitted successfully", data: application });
  } catch (error) {
    console.error("Apply job error:", error);
    res.status(500).json({ message: "Server error" });
  }
}

export async function appliedJobs(req, res) {
  try {
    const jobs = await repo.getAppliedJobs(req.userId);
    res.json({ data: jobs, total: jobs.length });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
}

export async function checkApplicationStatus(req, res) {
  try {
    const { jobId } = req.params;
    const application = await repo.getApplicationStatus(req.userId, jobId);
    if (!application)
      return res.json({ applied: false });
    res.json({ applied: true, data: application });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
}

/* ======================
   SAVED JOBS
====================== */
export async function saveJob(req, res) {
  try {
    const user = await repo.saveJob(req.userId, req.params.jobId);
    res.json({ message: "Job saved", data: user.savedJobs });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
}

export async function removeSavedJob(req, res) {
  try {
    const user = await repo.removeSavedJob(req.userId, req.params.jobId);
    res.json({ message: "Job removed from saved list", data: user.savedJobs });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
}

export async function getSavedJobs(req, res) {
  try {
    const user = await repo.getSavedJobs(req.userId);
    res.json({ data: user.savedJobs });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
}

/* ======================
   NOTIFICATIONS
====================== */
export async function getNotifications(req, res) {
  try {
    const user = await repo.getNotifications(req.userId);
    res.json({ data: user.notifications });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
}

export async function markNotificationRead(req, res) {
  try {
    await repo.markNotificationRead(req.userId, req.params.notificationId);
    res.json({ message: "Notification marked as read" });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
}

export async function markAllNotificationsRead(req, res) {
  try {
    await repo.markAllNotificationsRead(req.userId);
    res.json({ message: "All notifications marked as read" });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
}

/* ======================
   DASHBOARD
====================== */
export async function getDashboardStats(req, res) {
  try {
    const stats = await repo.getUserStats(req.userId);
    res.json({ data: stats });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
}
