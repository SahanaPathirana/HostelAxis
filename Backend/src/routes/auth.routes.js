const express = require("express");
const authController = require("../controllers/auth.controller");
const { validateRegisterStudentBody } = require("../middleware/validate");

const router = express.Router();

router.get("/status", (req, res) => {
  res.json({ message: "Auth routes ready" });
});

router.post("/register-student", validateRegisterStudentBody, authController.registerStudent);
router.post("/login", authController.login);

module.exports = router;
