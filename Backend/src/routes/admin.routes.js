const express = require("express");
const { authenticate, requireRole } = require("../middleware/auth");
const adminController = require("../controllers/admin.controller");
const roomController = require("../controllers/room.controller");
const feePlanController = require("../controllers/feePlan.controller");
const paymentController = require("../controllers/payment.controller");
const complaintController = require("../controllers/complaint.controller");
const visitorController = require("../controllers/visitor.controller");
const notificationController = require("../controllers/notification.controller");
const bedRequestController = require("../controllers/bedRequest.controller");
const messageController = require("../controllers/message.controller");

const router = express.Router();
router.use(authenticate, requireRole("Admin"));

router.get("/stats", adminController.getAdminStats);
router.post("/notices", adminController.publishNotice);

router.get("/students", adminController.getStudents);
router.patch("/students/:studentId/verify", adminController.verifyStudent);
router.patch("/users/:userId/activation", adminController.setUserActivation);

router.get("/staff", adminController.getStaff);
router.post("/staff", adminController.createStaff);

// IMPORTANT: specific sub-routes before parameterized ones
router.get("/rooms/map", bedRequestController.getRoomMap);
router.get("/rooms", roomController.getRooms);
router.post("/rooms", roomController.addRoom);
router.patch("/rooms/:roomId", roomController.updateRoom);
router.delete("/rooms/:roomId", roomController.removeRoom);

router.get("/beds/available", roomController.getAvailableBeds);
router.post("/beds/assign", roomController.assignBed);
router.delete("/beds/:bedId/unassign", roomController.unassignBed);
router.get("/beds/history", roomController.getAllocationHistory);

router.get("/bed-requests", bedRequestController.listBedRequests);
router.patch("/bed-requests/:id/approve", bedRequestController.approveBedRequest);
router.patch("/bed-requests/:id/reject", bedRequestController.rejectBedRequest);

router.get("/fee-plans", feePlanController.getFeePlans);
router.post("/fee-plans", feePlanController.createFeePlan);
router.patch("/fee-plans/:id", feePlanController.updateFeePlan);
router.delete("/fee-plans/:id", feePlanController.deleteFeePlan);
router.delete("/fee-plans-and-payments/reset", feePlanController.resetFeeData);

router.get("/payments", paymentController.getPayments);
router.post("/payments", paymentController.recordPayment);
router.get("/payment-requests", paymentController.getPaymentRequests);

router.get("/complaints", complaintController.getAllComplaints);
router.patch("/complaints/:id/status", complaintController.updateComplaintStatus);
router.patch("/complaints/:id/assign", complaintController.assignComplaint);

router.get("/visitors", visitorController.getVisitors);
router.post("/visitors", visitorController.addVisitor);
router.patch("/visitors/:id", visitorController.updateVisitor);

router.get("/notifications", notificationController.getMyNotifications);
router.patch("/notifications/:id/read", notificationController.markAsRead);

router.get("/messages", messageController.getConversations);
router.get("/messages/:userId", messageController.getThread);
router.post("/messages", messageController.adminSendMessage);

module.exports = router;
