const express = require("express");
const { authenticate, requireRole } = require("../middleware/auth");
const studentController = require("../controllers/student.controller");
const complaintController = require("../controllers/complaint.controller");

const router = express.Router();
router.use(authenticate, requireRole("Student"));

router.get("/profile", studentController.getProfile);
router.get("/complaints", complaintController.getMyComplaints);
router.post("/complaints", complaintController.submitComplaint);

module.exports = router;
