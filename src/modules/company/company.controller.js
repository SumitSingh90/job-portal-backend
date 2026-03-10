import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import * as repo from "./company.repository.js";

const SECRET = process.env.JWT_SECRET || "secret123";

/* ======================
   AUTH
====================== */
export async function signup(req, res) {
  try {
    const { email, password } = req.body;

    // Validation
    if (!email || !password)
      return res.status(400).json({ message: "Email and password are required" });
    if (password.length < 6)
      return res.status(400).json({ message: "Password must be at least 6 characters" });

    const exists = await repo.findCompanyByEmail(email);
    if (exists) return res.status(400).json({ message: "Email already registered" });

    // FIX: Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    const company = await repo.createCompany({ email, password: hashedPassword });

    res.status(201).json({
      message: "Company registered successfully",
      data: { id: company._id, email: company.email },
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

    const company = await repo.findCompanyByEmail(email);
    if (!company) return res.status(404).json({ message: "Company not found" });

    if (company.status === "suspended")
      return res.status(403).json({ message: "Account suspended. Contact support." });

    // FIX: Compare hashed password
    const isMatch = await bcrypt.compare(password, company.password);
    if (!isMatch) return res.status(400).json({ message: "Invalid credentials" });

    const token = jwt.sign({ id: company._id, role: "company" }, SECRET, { expiresIn: "7d" });
    await repo.updateToken(company._id, token);

    // Get profile if exists
    const profile = await repo.getProfile(company._id);

    res.json({
      message: "Login successful",
      token,
      data: {
        id: company._id,
        email: company.email,
        profileCompleted: company.profileCompleted,
        profile: profile || null,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Server error" });
  }
}

export async function getMe(req, res) {
  try {
    const company = await repo.findCompanyById(req.companyId);
    if (!company) return res.status(404).json({ message: "Company not found" });
    const profile = await repo.getProfile(req.companyId);
    res.json({
      id: company._id,
      email: company.email,
      status: company.status,
      profileCompleted: company.profileCompleted,
      profile: profile || null,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
}

/* ======================
   PROFILE
====================== */
export async function createProfile(req, res) {
  try {
    const { companyName } = req.body;
    if (!companyName)
      return res.status(400).json({ message: "Company name is required" });

    // Check if profile already exists
    const existing = await repo.getProfile(req.companyId);
    if (existing)
      return res.status(400).json({ message: "Profile already exists. Use PUT to update." });

    const profile = await repo.createProfile({ ...req.body, companyId: req.companyId });

    // FIX: Mark profile as completed
    await repo.markProfileCompleted(req.companyId);

    res.status(201).json({ message: "Profile created successfully", data: profile });
  } catch (error) {
    console.error("Create profile error:", error);
    res.status(500).json({ message: "Server error" });
  }
}

export async function getProfile(req, res) {
  try {
    const profile = await repo.getProfile(req.companyId);
    if (!profile) return res.status(404).json({ message: "Profile not found" });
    res.json({ data: profile });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
}

export async function updateProfile(req, res) {
  try {
    const profile = await repo.updateProfile(req.companyId, { ...req.body, "audit.updatedBy": req.companyId });
    if (!profile) return res.status(404).json({ message: "Profile not found" });
    res.json({ message: "Profile updated successfully", data: profile });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
}

/* ======================
   NOTIFICATIONS
====================== */
export async function getNotifications(req, res) {
  try {
    const company = await repo.getNotifications(req.companyId);
    res.json({ data: company.notifications });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
}

export async function markNotificationRead(req, res) {
  try {
    await repo.markNotificationRead(req.companyId, req.params.notificationId);
    res.json({ message: "Notification marked as read" });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
}

export async function markAllNotificationsRead(req, res) {
  try {
    await repo.markAllNotificationsRead(req.companyId);
    res.json({ message: "All notifications marked as read" });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
}

/* ======================
   JOB
====================== */
export async function createJob(req, res) {
  try {
    const { title } = req.body;
    if (!title) return res.status(400).json({ message: "Job title is required" });

    const job = await repo.createJob({
      ...req.body,
      companyId: req.companyId,
      "audit.createdBy": req.companyId,
    });

    await repo.incrementJobsCount(req.companyId);

    res.status(201).json({ message: "Job posted successfully", data: job });
  } catch (error) {
    console.error("Create job error:", error);
    res.status(500).json({ message: "Server error" });
  }
}

export async function getJobs(req, res) {
  try {
    const jobs = await repo.getCompanyJobs(req.companyId);
    res.json({ data: jobs, total: jobs.length });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
}

export async function getJobById(req, res) {
  try {
    const job = await repo.getJobById(req.params.jobId);
    if (!job) return res.status(404).json({ message: "Job not found" });
    res.json({ data: job });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
}

export async function updateJob(req, res) {
  try {
    const job = await repo.updateJob(req.params.jobId, {
      ...req.body,
      "audit.updatedBy": req.companyId,
    });
    if (!job) return res.status(404).json({ message: "Job not found" });
    res.json({ message: "Job updated successfully", data: job });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
}

export async function deleteJob(req, res) {
  try {
    const job = await repo.deleteJob(req.params.jobId);
    if (!job) return res.status(404).json({ message: "Job not found" });
    res.json({ message: "Job deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
}

export async function updateJobStatus(req, res) {
  try {
    const { status } = req.body;
    if (!["open", "closed", "paused"].includes(status))
      return res.status(400).json({ message: "Invalid status value" });
    const job = await repo.updateJob(req.params.jobId, { status });
    res.json({ message: `Job ${status} successfully`, data: job });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
}

/* ======================
   APPLICATION (COMPANY SIDE)
====================== */
export async function getApplications(req, res) {
  try {
    const apps = await repo.getApplicationsByJob(req.params.jobId);
    const total = apps.length;
    res.json({ data: apps, total });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
}

export async function updateApplicationStatus(req, res) {
  try {
    const { status, feedback } = req.body;
    const validStatuses = ["pending", "shortlisted", "interview", "rejected", "hired"];
    if (!validStatuses.includes(status))
      return res.status(400).json({ message: "Invalid status value" });

    const app = await repo.updateApplicationStatus(req.params.id, status, feedback);
    if (!app) return res.status(404).json({ message: "Application not found" });

    // Notify company (optional: add user notification here too)
    res.json({ message: "Application status updated", data: app });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
}

export async function addApplicationFeedback(req, res) {
  try {
    const { feedback } = req.body;
    if (!feedback) return res.status(400).json({ message: "Feedback is required" });
    const app = await repo.addApplicationFeedback(req.params.id, feedback);
    res.json({ message: "Feedback added", data: app });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
}

export async function setInterviewDate(req, res) {
  try {
    const { interviewDate } = req.body;
    if (!interviewDate)
      return res.status(400).json({ message: "Interview date is required" });
    const app = await repo.setInterviewDate(req.params.id, new Date(interviewDate));
    res.json({ message: "Interview scheduled", data: app });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
}

export async function bulkShortlist(req, res) {
  try {
    const { applicationIds } = req.body;
    if (!applicationIds || !applicationIds.length)
      return res.status(400).json({ message: "Application IDs are required" });
    await repo.bulkShortlistApplications(applicationIds);
    res.json({ message: `${applicationIds.length} applications shortlisted` });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
}

/* ======================
   DASHBOARD
====================== */
export async function getDashboardStats(req, res) {
  try {
    const stats = await repo.getCompanyStats(req.companyId);
    res.json({ data: stats });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
}

/* ======================
   PUBLIC (NO AUTH)
====================== */
// FIX: Proper search + filter + pagination
export async function getJobsForUser(req, res) {
  try {
    const { q, location, employmentType, category, minSalary, maxSalary, skills, page, limit } = req.query;
    const result = await repo.searchAndFilterJobs({
      q, location, employmentType, category, minSalary, maxSalary, skills, page, limit,
    });
    res.json(result);
  } catch (error) {
    console.error("getJobsForUser error:", error);
    res.status(500).json({ message: "Server error" });
  }
}

export async function getPublicJobById(req, res) {
  try {
    const job = await repo.getJobById(req.params.jobId);
    if (!job) return res.status(404).json({ message: "Job not found" });
    res.json({ data: job });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
}
