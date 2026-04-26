const feePlanService = require("../services/feePlan.service");

async function getFeePlans(req, res) {
  try { res.json({ feePlans: await feePlanService.listFeePlans() }); }
  catch (err) { console.error("getFeePlans error:", err.message); res.status(500).json({ error: "Failed to fetch fee plans" }); }
}

async function createFeePlan(req, res) {
  try {
    const result = await feePlanService.createFeePlan(req.body);
    if (!result.success) return res.status(400).json({ error: result.error });
    res.status(201).json({ message: "Fee plan created", feePlan: result.feePlan });
  } catch (err) { console.error("createFeePlan error:", err.message); res.status(500).json({ error: "Failed to create fee plan" }); }
}

async function updateFeePlan(req, res) {
  try {
    const result = await feePlanService.updateFeePlan(req.params.id, req.body);
    if (!result.success) return res.status(400).json({ error: result.error });
    res.json({ message: "Fee plan updated", feePlan: result.feePlan });
  } catch (err) { console.error("updateFeePlan error:", err.message); res.status(500).json({ error: "Failed to update fee plan" }); }
}

async function deleteFeePlan(req, res) {
  try {
    const result = await feePlanService.deleteFeePlan(req.params.id);
    if (!result.success) return res.status(400).json({ error: result.error });
    res.json({ message: "Fee plan deleted" });
  } catch (err) { console.error("deleteFeePlan error:", err.message); res.status(500).json({ error: "Failed to delete fee plan" }); }
}

async function resetFeeData(req, res) {
  try { await feePlanService.resetPlansAndPayments(); res.json({ message: "All fee plans and payments deleted" }); }
  catch (err) { console.error("resetFeeData error:", err.message); res.status(500).json({ error: "Failed to reset fee data" }); }
}

module.exports = { getFeePlans, createFeePlan, updateFeePlan, deleteFeePlan, resetFeeData };
