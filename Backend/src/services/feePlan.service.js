const prisma = require("../prisma");

function getMonthsForPeriod(period) {
  if (period === "Monthly") return 1;
  if (period === "ThreeMonths") return 3;
  if (period === "SixMonths") return 6;
  return 12;
}

async function listFeePlans() {
  return prisma.feePlan.findMany({ orderBy: { createdAt: "desc" } });
}

async function createFeePlan(data) {
  const { name, amount, period, description } = data;
  if (!name || !name.trim()) return { success: false, error: "Name is required" };
  if (amount == null || isNaN(amount) || parseFloat(amount) <= 0) return { success: false, error: "A valid positive amount is required" };
  const safePeriod = period || "Monthly";
  const feePlan = await prisma.feePlan.create({ data: { name: name.trim(), amount: parseFloat(amount), period: safePeriod, months: getMonthsForPeriod(safePeriod), description: description || null } });
  return { success: true, feePlan };
}

async function updateFeePlan(id, data) {
  const existing = await prisma.feePlan.findUnique({ where: { id } });
  if (!existing) return { success: false, error: "Fee plan not found" };
  const period = data.period || existing.period;
  const feePlan = await prisma.feePlan.update({
    where: { id },
    data: {
      name: data.name ?? existing.name,
      amount: data.amount != null ? parseFloat(data.amount) : existing.amount,
      period,
      months: getMonthsForPeriod(period),
      description: data.description !== undefined ? data.description : existing.description,
    },
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

async function resetPlansAndPayments() {
  await prisma.$transaction([
    prisma.payment.deleteMany({}),
    prisma.paymentRequest.deleteMany({}),
    prisma.student.updateMany({ data: { currentFeePlanId: null } }),
    prisma.feePlan.deleteMany({}),
  ]);
  return { success: true };
}

module.exports = { listFeePlans, createFeePlan, updateFeePlan, deleteFeePlan, resetPlansAndPayments, getMonthsForPeriod };
