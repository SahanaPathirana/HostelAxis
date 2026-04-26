const express = require("express");
const { authenticate, requireRole } = require("../middleware/auth");
const complaintController = require("../controllers/complaint.controller");
const notificationController = require("../controllers/notification.controller");
const staffController = require("../controllers/staff.controller");

const router = express.Router();
router.use(authenticate, requireRole("Staff"));

router.get("/profile", staffController.getProfile);
router.get("/complaints", complaintController.getStaffComplaints);
router.patch("/complaints/:id/done", complaintController.markComplaintDoneByStaff);
router.get("/notifications", notificationController.getMyNotifications);

module.exports = router;
