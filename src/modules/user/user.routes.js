import express from "express";
import * as controller from "./user.controller.js";
import userAuthMiddleware from "../../middleware/userAuthMiddleware.js";
import { uploadResume } from "../../middleware/upload.middleware.js";

const router = express.Router();

/* ======================
   AUTH
====================== */
router.post("/signup", controller.signup);
router.post("/login", controller.login);
router.get("/me", userAuthMiddleware, controller.getMe);

/* ======================
   PROFILE
====================== */
router.get("/profile", userAuthMiddleware, controller.getProfile);
router.put("/profile", userAuthMiddleware, controller.updateProfile);

// Skills
router.post("/profile/skill", userAuthMiddleware, controller.addSkill);
router.delete("/profile/skill", userAuthMiddleware, controller.removeSkill);

// Education
router.post("/profile/education", userAuthMiddleware, controller.addEducation);

// Work experience
router.post("/profile/experience", userAuthMiddleware, controller.addWorkExperience);

// Resume upload
router.post("/profile/resume", userAuthMiddleware, uploadResume.single("resume"), controller.uploadResume);

/* ======================
   JOB APPLICATION
====================== */
router.post("/apply/:jobId", userAuthMiddleware, controller.applyJob);
router.get("/applied-jobs", userAuthMiddleware, controller.appliedJobs);
router.get("/application-status/:jobId", userAuthMiddleware, controller.checkApplicationStatus);

/* ======================
   SAVED JOBS
====================== */
router.post("/save-job/:jobId", userAuthMiddleware, controller.saveJob);
router.delete("/remove-job/:jobId", userAuthMiddleware, controller.removeSavedJob);
router.get("/saved-jobs", userAuthMiddleware, controller.getSavedJobs);

/* ======================
   NOTIFICATIONS
====================== */
router.get("/notifications", userAuthMiddleware, controller.getNotifications);
router.patch("/notifications/:notificationId/read", userAuthMiddleware, controller.markNotificationRead);
router.patch("/notifications/read-all", userAuthMiddleware, controller.markAllNotificationsRead);

/* ======================
   DASHBOARD
====================== */
router.get("/dashboard/stats", userAuthMiddleware, controller.getDashboardStats);

export default router;
