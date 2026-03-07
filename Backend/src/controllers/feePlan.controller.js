const feePlanService = require("../services/feePlan.service");

async function getFeePlans(req, res) {
  try {
    const feePlans = await feePlanService.listFeePlans();
    res.json({ feePlans });
  } catch (err) {
    console.error("getFeePlans error:", err.message);
    res.status(500).json({ error: "Failed to fetch fee plans" });
  }
}

async function createFeePlan(req, res) {
  try {
    const result = await feePlanService.createFeePlan(req.body);
    if (!result.success) return res.status(400).json({ error: result.error });
    res.status(201).json({ message: "Fee plan created", feePlan: result.feePlan });
  } catch (err) {
    console.error("createFeePlan error:", err.message);
    res.status(500).json({ error: "Failed to create fee plan" });
  }
}

async function deleteFeePlan(req, res) {
  try {
    const { id } = req.params;
    const result = await feePlanService.deleteFeePlan(id);
    if (!result.success) return res.status(400).json({ error: result.error });
    res.json({ message: "Fee plan deleted" });
  } catch (err) {
    console.error("deleteFeePlan error:", err.message);
    res.status(500).json({ error: "Failed to delete fee plan" });
  }
}

module.exports = { getFeePlans, createFeePlan, deleteFeePlan };
