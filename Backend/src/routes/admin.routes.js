const express = require("express");
const { authenticate, requireRole } = require("../middleware/auth");
const adminController = require("../controllers/admin.controller");
const roomController = require("../controllers/room.controller");
const feePlanController = require("../controllers/feePlan.controller");
const paymentController = require("../controllers/payment.controller");
const complaintController = require("../controllers/complaint.controller");

const router = express.Router();
router.use(authenticate, requireRole("Admin"));

// Student verification
router.get("/students", adminController.getStudents);
router.patch("/students/:studentId/verify", adminController.verifyStudent);

// Room management
router.get("/rooms", roomController.getRooms);
router.post("/rooms", roomController.addRoom);
router.delete("/rooms/:roomId", roomController.removeRoom);

// Bed assignment
router.get("/beds/available", roomController.getAvailableBeds);
router.post("/beds/assign", roomController.assignBed);
router.delete("/beds/:bedId/unassign", roomController.unassignBed);

// Fee plans
router.get("/fee-plans", feePlanController.getFeePlans);
router.post("/fee-plans", feePlanController.createFeePlan);
router.delete("/fee-plans/:id", feePlanController.deleteFeePlan);

// Payments
router.get("/payments", paymentController.getPayments);
router.post("/payments", paymentController.recordPayment);

// Complaints
router.get("/complaints", complaintController.getAllComplaints);
router.patch("/complaints/:id/status", complaintController.updateComplaintStatus);

module.exports = router;
