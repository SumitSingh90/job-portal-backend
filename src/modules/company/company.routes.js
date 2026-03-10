import express from "express";
import * as controller from "./company.controller.js";
import authMiddleware from "../../middleware/authMiddleware.js";
import { uploadLogo } from "../../middleware/upload.middleware.js";

const router = express.Router();

/* ======================
   AUTH
====================== */
router.post("/signup", controller.signup);
router.post("/login", controller.login);
router.get("/me", authMiddleware, controller.getMe);

/* ======================
   PROFILE
====================== */
router.post("/profile", authMiddleware, uploadLogo.single("logo"), controller.createProfile);
router.get("/profile", authMiddleware, controller.getProfile);
router.put("/profile", authMiddleware, uploadLogo.single("logo"), controller.updateProfile);

/* ======================
   NOTIFICATIONS
====================== */
router.get("/notifications", authMiddleware, controller.getNotifications);
router.patch("/notifications/:notificationId/read", authMiddleware, controller.markNotificationRead);
router.patch("/notifications/read-all", authMiddleware, controller.markAllNotificationsRead);

/* ======================
   JOB
====================== */
router.post("/job", authMiddleware, controller.createJob);
router.get("/job", authMiddleware, controller.getJobs);
router.get("/job/:jobId", authMiddleware, controller.getJobById);
router.put("/job/:jobId", authMiddleware, controller.updateJob);
router.delete("/job/:jobId", authMiddleware, controller.deleteJob);
router.patch("/job/:jobId/status", authMiddleware, controller.updateJobStatus);

/* ======================
   APPLICATION (COMPANY SIDE)
====================== */
router.get("/applications/:jobId", authMiddleware, controller.getApplications);
router.patch("/applications/:id/status", authMiddleware, controller.updateApplicationStatus);
router.patch("/applications/:id/feedback", authMiddleware, controller.addApplicationFeedback);
router.patch("/applications/:id/interview", authMiddleware, controller.setInterviewDate);
router.post("/applications/bulk-shortlist", authMiddleware, controller.bulkShortlist);

/* ======================
   DASHBOARD
====================== */
router.get("/dashboard/stats", authMiddleware, controller.getDashboardStats);

/* ======================
   PUBLIC ROUTES (NO AUTH)
====================== */
router.get("/jobs", controller.getJobsForUser);           // search + filter + paginate
router.get("/jobs/:jobId", controller.getPublicJobById);  // single job detail

export default router;
