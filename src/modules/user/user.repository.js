import User from "./user.model.js";
import { Application, Job } from "../company/company.model.js";

/* ======================
   AUTH
====================== */
export const createUser = (payload) => User.create(payload);

export const findUserByEmail = (email) => User.findOne({ email });

export const findUserById = (id) => User.findById(id).select("-password");

/* ======================
   PROFILE
====================== */
export const updateUserProfile = (userId, payload) =>
  User.findByIdAndUpdate(userId, payload, { new: true, runValidators: true }).select("-password");

export const addSkill = (userId, skill) =>
  User.findByIdAndUpdate(
    userId,
    { $addToSet: { skills: skill } },
    { new: true }
  ).select("-password");

export const removeSkill = (userId, skill) =>
  User.findByIdAndUpdate(
    userId,
    { $pull: { skills: skill } },
    { new: true }
  ).select("-password");

export const addEducation = (userId, education) =>
  User.findByIdAndUpdate(
    userId,
    { $push: { education: education } },
    { new: true }
  ).select("-password");

export const addWorkExperience = (userId, experience) =>
  User.findByIdAndUpdate(
    userId,
    { $push: { workExperience: experience } },
    { new: true }
  ).select("-password");

export const updateResume = (userId, resume, resumeOriginalName) =>
  User.findByIdAndUpdate(
    userId,
    { resume, resumeOriginalName },
    { new: true }
  ).select("-password");

export const markProfileCompleted = (userId) =>
  User.findByIdAndUpdate(userId, { profileCompleted: true }, { new: true });

/* ======================
   NOTIFICATIONS
====================== */
export const addNotification = (userId, message) =>
  User.findByIdAndUpdate(
    userId,
    { $push: { notifications: { message } } },
    { new: true }
  );

export const markNotificationRead = (userId, notificationId) =>
  User.findOneAndUpdate(
    { _id: userId, "notifications._id": notificationId },
    { $set: { "notifications.$.read": true } },
    { new: true }
  );

export const markAllNotificationsRead = (userId) =>
  User.findByIdAndUpdate(
    userId,
    { $set: { "notifications.$[].read": true } },
    { new: true }
  );

export const getNotifications = (userId) =>
  User.findById(userId).select("notifications");

/* ======================
   JOB APPLICATION
   FIX: userId now properly saved + prevent duplicates checked before create
====================== */
export const applyJob = async (payload) => Application.create(payload);

export const findExistingApplication = (jobId, userId) =>
  Application.findOne({ jobId, userId });

// FIX: was querying wrong field, now uses userId correctly
export const getAppliedJobs = (userId) =>
  Application.find({ userId })
    .populate({
      path: "jobId",
      populate: {
        path: "companyId",
        select: "email",
      },
    })
    .sort({ createdAt: -1 });

export const getApplicationStatus = (userId, jobId) =>
  Application.findOne({ userId, jobId }).select("status feedback interviewDate createdAt");

/* ======================
   SAVED JOBS
====================== */
export const saveJob = (userId, jobId) =>
  User.findByIdAndUpdate(
    userId,
    { $addToSet: { savedJobs: jobId } },
    { new: true }
  ).select("savedJobs");

export const removeSavedJob = (userId, jobId) =>
  User.findByIdAndUpdate(
    userId,
    { $pull: { savedJobs: jobId } },
    { new: true }
  ).select("savedJobs");

export const getSavedJobs = (userId) =>
  User.findById(userId)
    .populate({
      path: "savedJobs",
      match: { status: "open" }, // only show open jobs
    })
    .select("savedJobs");

/* ======================
   USER STATS
====================== */
export const getUserStats = async (userId) => {
  const totalApplied = await Application.countDocuments({ userId });
  const pending = await Application.countDocuments({ userId, status: "pending" });
  const shortlisted = await Application.countDocuments({ userId, status: "shortlisted" });
  const interview = await Application.countDocuments({ userId, status: "interview" });
  const hired = await Application.countDocuments({ userId, status: "hired" });
  const rejected = await Application.countDocuments({ userId, status: "rejected" });
  const user = await User.findById(userId).select("savedJobs");
  const savedCount = user?.savedJobs?.length || 0;

  return {
    applications: { total: totalApplied, pending, shortlisted, interview, hired, rejected },
    savedJobs: savedCount,
  };
};
