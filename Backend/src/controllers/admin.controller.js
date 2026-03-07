const adminService = require("../services/admin.service");

async function getStudents(req, res) {
  try {
    const students = await adminService.listStudents();
    res.json({ students });
  } catch (err) {
    console.error("getStudents error:", err.message);
    res.status(500).json({ error: "Failed to fetch students" });
  }
}

async function verifyStudent(req, res) {
  try {
    const { studentId } = req.params;
    const { status } = req.body;
    const result = await adminService.verifyStudent(studentId, status);
    if (!result.success) return res.status(400).json({ error: result.error });
    res.json({ message: "Verification status updated", student: result.student });
  } catch (err) {
    console.error("verifyStudent error:", err.message);
    res.status(500).json({ error: "Failed to update verification" });
  }
}

module.exports = { getStudents, verifyStudent };
