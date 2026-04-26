const studentService = require("../services/student.service");
const feePlanService = require("../services/feePlan.service");
const prisma = require("../prisma");

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

async function getFeePlans(req, res) {
  try {
    const feePlans = await feePlanService.listFeePlans();
    res.json({ feePlans });
  } catch (err) {
    console.error("student getFeePlans error:", err.message);
    res.status(500).json({ error: "Failed to fetch fee plans" });
  }
}

async function setCurrentFeePlan(req, res) {
  try {
    const { feePlanId } = req.body;
    if (!feePlanId) return res.status(400).json({ error: "feePlanId is required" });

    const student = await prisma.student.findUnique({ where: { userId: req.user.id } });
    if (!student) return res.status(404).json({ error: "Student not found" });
    if (student.verificationStatus !== "Verified")
      return res.status(403).json({ error: "Only verified students can select a fee plan" });

    const feePlan = await prisma.feePlan.findUnique({ where: { id: feePlanId } });
    if (!feePlan) return res.status(404).json({ error: "Fee plan not found" });

    const updated = await prisma.student.update({
      where: { userId: req.user.id },
      data: { currentFeePlanId: feePlanId },
    });
    res.json({ message: "Fee plan updated", student: updated });
  } catch (err) {
    console.error("setCurrentFeePlan error:", err.message);
    res.status(500).json({ error: "Failed to update fee plan" });
  }
}

module.exports = { getProfile, getFeePlans, setCurrentFeePlan };

