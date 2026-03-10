import { Company, CompanyProfile, Job, Application } from "./company.model.js";

/* ======================
   AUTH
====================== */
export const createCompany = (payload) => Company.create(payload);

export const findCompanyByEmail = (email) => Company.findOne({ email });

export const findCompanyById = (id) => Company.findById(id);

export const updateToken = (id, token) =>
  Company.findByIdAndUpdate(id, { token }, { new: true });

export const getAllCompanies = () =>
  Company.find().select("-password -token").sort({ createdAt: -1 });

export const updateCompanyStatus = (companyId, status) =>
  Company.findByIdAndUpdate(companyId, { status }, { new: true });

/* ======================
   NOTIFICATIONS
====================== */
export const addNotification = (companyId, message) =>
  Company.findByIdAndUpdate(
    companyId,
    { $push: { notifications: { message } } },
    { new: true }
  );

export const markNotificationRead = (companyId, notificationId) =>
  Company.findOneAndUpdate(
    { _id: companyId, "notifications._id": notificationId },
    { $set: { "notifications.$.read": true } },
    { new: true }
  );

export const markAllNotificationsRead = (companyId) =>
  Company.findByIdAndUpdate(
    companyId,
    { $set: { "notifications.$[].read": true } },
    { new: true }
  );

export const getNotifications = (companyId) =>
  Company.findById(companyId).select("notifications");

/* ======================
   PROFILE
====================== */
export const createProfile = (payload) => CompanyProfile.create(payload);

export const getProfile = (companyId) => CompanyProfile.findOne({ companyId });

export const updateProfile = (companyId, payload) =>
  CompanyProfile.findOneAndUpdate({ companyId }, payload, { new: true, runValidators: true });

export const incrementJobsCount = (companyId) =>
  CompanyProfile.findOneAndUpdate(
    { companyId },
    { $inc: { jobsCount: 1 } },
    { new: true }
  );

export const decrementJobsCount = (companyId) =>
  CompanyProfile.findOneAndUpdate(
    { companyId },
    { $inc: { jobsCount: -1 } },
    { new: true }
  );

export const markProfileCompleted = (companyId) =>
  Company.findByIdAndUpdate(companyId, { profileCompleted: true }, { new: true });

/* ======================
   JOB
====================== */
export const createJob = (payload) => Job.create(payload);

export const getCompanyJobs = (companyId) =>
  Job.find({ companyId }).sort({ createdAt: -1 });

export const getJobById = (jobId) => Job.findById(jobId);

export const updateJob = (jobId, payload) =>
  Job.findByIdAndUpdate(jobId, payload, { new: true, runValidators: true });

export const deleteJob = async (jobId) => {
  const job = await Job.findByIdAndDelete(jobId);
  if (job) {
    await CompanyProfile.findOneAndUpdate(
      { companyId: job.companyId },
      { $inc: { jobsCount: -1 } }
    );
  }
  return job;
};

/* ======================
   JOB SEARCH + FILTER + PAGINATION
   FIX: Replaced broken $text search with proper regex + filters
====================== */
export const searchAndFilterJobs = async ({
  q,
  location,
  employmentType,
  category,
  minSalary,
  maxSalary,
  skills,
  page = 1,
  limit = 10,
  status = "open",
}) => {
  const query = { status };

  // Text search across title, description, category
  if (q) {
    query.$or = [
      { title: { $regex: q, $options: "i" } },
      { description: { $regex: q, $options: "i" } },
      { category: { $regex: q, $options: "i" } },
    ];
  }

  if (location) query.location = { $regex: location, $options: "i" };
  if (employmentType) query.employmentType = employmentType;
  if (category) query.category = { $regex: category, $options: "i" };
  if (skills) {
    const skillsArray = Array.isArray(skills) ? skills : skills.split(",");
    query.skills = { $in: skillsArray.map((s) => new RegExp(s.trim(), "i")) };
  }
  if (minSalary) query.salaryMin = { $gte: Number(minSalary) };
  if (maxSalary) query.salaryMax = { $lte: Number(maxSalary) };

  const skip = (Number(page) - 1) * Number(limit);
  const total = await Job.countDocuments(query);

  const jobs = await Job.find(query)
    .populate({
      path: "companyId",
      select: "_id email",
    })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(Number(limit));

  // Attach company profile info
  // const jobsWithProfile = await Promise.all(
  //   jobs.map(async (job) => {
  //     const profile = await CompanyProfile.findOne({
  //       companyId: job.companyId._id,
  //     }).select("companyName logo location industry");
  //     return { ...job.toObject(), companyProfile: profile };
  //   })
  // );

  // Attach company profile info
  const jobsWithProfile = await Promise.all(
    jobs.map(async (job) => {
      // FIX: companyId can be null if company was deleted
      if (!job.companyId) return { ...job.toObject(), companyProfile: null };
      const profile = await CompanyProfile.findOne({
        companyId: job.companyId._id,
      }).select("companyName logo location industry");
      return { ...job.toObject(), companyProfile: profile };
    })
  );

  return {
    jobs: jobsWithProfile,
    pagination: {
      total,
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.ceil(total / Number(limit)),
      hasNext: Number(page) < Math.ceil(total / Number(limit)),
      hasPrev: Number(page) > 1,
    },
  };
};

// FIX: getAllJobs now properly populates company + profile
export const getAllJobs = async (page = 1, limit = 10) => {
  return searchAndFilterJobs({ page, limit });
};

/* ======================
   APPLICATION
====================== */
export const createApplication = (payload) => Application.create(payload);

export const findExistingApplication = (jobId, userId) =>
  Application.findOne({ jobId, userId });

export const getApplicationsByJob = (jobId) =>
  Application.find({ jobId })
    .populate("userId", "name email skills experience location")
    .sort({ createdAt: -1 });

export const getApplicationById = (id) => Application.findById(id);

export const updateApplicationStatus = (id, status, feedback = null) => {
  const update = { status };
  if (feedback) update.feedback = feedback;
  return Application.findByIdAndUpdate(id, update, { new: true });
};

export const addApplicationFeedback = (id, feedback) =>
  Application.findByIdAndUpdate(id, { feedback }, { new: true });

export const setInterviewDate = (id, interviewDate) =>
  Application.findByIdAndUpdate(id, { interviewDate, status: "interview" }, { new: true });

export const countApplicationsByJob = (jobId) =>
  Application.countDocuments({ jobId });

export const bulkShortlistApplications = (applicationIds) =>
  Application.updateMany(
    { _id: { $in: applicationIds } },
    { status: "shortlisted" }
  );

export const incrementApplicantsCount = (jobId) =>
  Job.findByIdAndUpdate(jobId, { $inc: { applicantsCount: 1 } }, { new: true });

/* ======================
   DASHBOARD STATS
====================== */
export const getCompanyStats = async (companyId) => {
  const totalJobs = await Job.countDocuments({ companyId });
  const openJobs = await Job.countDocuments({ companyId, status: "open" });
  const closedJobs = await Job.countDocuments({ companyId, status: "closed" });
  const pausedJobs = await Job.countDocuments({ companyId, status: "paused" });

  const jobIds = await Job.find({ companyId }).distinct("_id");
  const totalApplications = await Application.countDocuments({ jobId: { $in: jobIds } });
  const pendingApplications = await Application.countDocuments({ jobId: { $in: jobIds }, status: "pending" });
  const shortlistedApplications = await Application.countDocuments({ jobId: { $in: jobIds }, status: "shortlisted" });
  const hiredApplications = await Application.countDocuments({ jobId: { $in: jobIds }, status: "hired" });

  return {
    jobs: { total: totalJobs, open: openJobs, closed: closedJobs, paused: pausedJobs },
    applications: {
      total: totalApplications,
      pending: pendingApplications,
      shortlisted: shortlistedApplications,
      hired: hiredApplications,
    },
  };
};
