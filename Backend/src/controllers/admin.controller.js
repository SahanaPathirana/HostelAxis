const adminService = require("../services/admin.service");

async function getStudents(req, res) {
  try { res.json({ students: await adminService.listStudents() }); }
  catch (err) { console.error("getStudents error:", err.message); res.status(500).json({ error: "Failed to fetch students" }); }
}

async function verifyStudent(req, res) {
  try {
    const result = await adminService.verifyStudent(req.params.studentId, req.body.status);
    if (!result.success) return res.status(400).json({ error: result.error });
    res.json({ message: "Verification status updated", student: result.student });
  } catch (err) { console.error("verifyStudent error:", err.message); res.status(500).json({ error: "Failed to update verification" }); }
}

async function setUserActivation(req, res) {
  try {
    const result = await adminService.setUserActive(req.params.userId, req.body.active);
    if (!result.success) return res.status(400).json({ error: result.error });
    res.json({ message: "Account status updated", user: result.user });
  } catch (err) { console.error("setUserActivation error:", err.message); res.status(500).json({ error: "Failed to update account status" }); }
}

async function getStaff(req, res) {
  try { res.json({ staff: await adminService.listStaff() }); }
  catch (err) { console.error("getStaff error:", err.message); res.status(500).json({ error: "Failed to fetch staff" }); }
}

async function createStaff(req, res) {
  try {
    const result = await adminService.createStaffAccount(req.body);
    if (!result.success) return res.status(400).json({ error: result.error });
    res.status(201).json({ message: "Staff account created", staff: result.staff, loginDetails: result.loginDetails });
  } catch (err) { console.error("createStaff error:", err.message); res.status(500).json({ error: "Failed to create staff" }); }
}

async function publishNotice(req, res) {
  try {
    const { title, message, onlyVerifiedStudents = true, targetStudentId = null } = req.body;
    const result = await adminService.publishNotice(title, message, onlyVerifiedStudents, targetStudentId);
    if (!result.success) return res.status(400).json({ error: result.error });
    res.json({ message: result.message || `Notice sent to ${result.count} student(s)` });
  } catch (err) { console.error("publishNotice error:", err.message); res.status(500).json({ error: "Failed to publish notice" }); }
}


async function getAdminStats(req, res) {
  try { res.json({ stats: await adminService.getDashboardStats() }); }
  catch (err) { console.error("getAdminStats error:", err.message); res.status(500).json({ error: "Failed to load stats" }); }
}

module.exports = { getStudents, verifyStudent, setUserActivation, getStaff, createStaff, publishNotice, getAdminStats };
