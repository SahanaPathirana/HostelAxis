const studentService = require("../services/student.service");

async function getProfile(req, res) {
  try {
    const result = await studentService.getStudentProfile(req.user.id);
    if (!result.success) return res.status(404).json({ error: result.error });
    res.json(result.user);
  } catch (err) {
    console.error("getProfile error:", err.message);
    res.status(500).json({ error: "Failed to fetch profile" });
  }
}

module.exports = { getProfile };
