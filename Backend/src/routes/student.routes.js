const express = require("express");
const { authenticate, requireRole } = require("../middleware/auth");
const studentController = require("../controllers/student.controller");
const complaintController = require("../controllers/complaint.controller");
const paymentController = require("../controllers/payment.controller");
const notificationController = require("../controllers/notification.controller");
const bedRequestController = require("../controllers/bedRequest.controller");
const messageController = require("../controllers/message.controller");

const router = express.Router();
router.use(authenticate, requireRole("Student"));

router.get("/profile", studentController.getProfile);
router.get("/fee-plans", studentController.getFeePlans);
router.patch("/current-fee-plan", studentController.setCurrentFeePlan);
router.get("/complaints", complaintController.getMyComplaints);
router.post("/complaints", complaintController.submitComplaint);
router.post("/payment-requests", paymentController.submitPaymentRequest);
router.get("/notifications", notificationController.getMyNotifications);
router.patch("/notifications/:id/read", notificationController.markAsRead);

// Room map (verified students only — enforced at service level)
router.get("/rooms/map", bedRequestController.getRoomMap);

// Bed requests
router.get("/bed-requests", bedRequestController.getStudentBedRequests);
router.post("/bed-requests", bedRequestController.submitBedRequest);

// Direct messages with admin
router.get("/messages", messageController.studentGetThread);
router.post("/messages", messageController.studentSendMessage);

module.exports = router;
