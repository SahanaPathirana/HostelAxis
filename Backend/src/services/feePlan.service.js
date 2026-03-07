const prisma = require("../prisma");

async function listFeePlans() {
  return prisma.feePlan.findMany({ orderBy: { createdAt: "desc" } });
}

async function createFeePlan(data) {
  const { name, amount, period, description } = data;
  if (!name || !name.trim()) return { success: false, error: "Name is required" };
  if (amount == null || isNaN(amount) || parseFloat(amount) <= 0) {
    return { success: false, error: "A valid positive amount is required" };
  }
  const feePlan = await prisma.feePlan.create({
    data: { name: name.trim(), amount: parseFloat(amount), period: period || "Monthly", description: description || null },
  });
  return { success: true, feePlan };
}

async function deleteFeePlan(id) {
  const plan = await prisma.feePlan.findUnique({ where: { id } });
  if (!plan) return { success: false, error: "Fee plan not found" };
  const paymentCount = await prisma.payment.count({ where: { feePlanId: id } });
  if (paymentCount > 0) return { success: false, error: "Cannot delete fee plan with existing payments" };
  await prisma.feePlan.delete({ where: { id } });
  return { success: true };
}

module.exports = { listFeePlans, createFeePlan, deleteFeePlan };
