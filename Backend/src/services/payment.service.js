const prisma = require("../prisma");

async function listPayments() {
  return prisma.payment.findMany({
    include: {
      student: { include: { user: { select: { fullName: true, email: true } } } },
      feePlan: true,
    },
    orderBy: { paidAt: "desc" },
  });
}

async function recordPayment(data) {
  const { studentId, feePlanId, amount, notes } = data;
  if (!studentId || !feePlanId || amount == null) {
    return { success: false, error: "studentId, feePlanId, and amount are required" };
  }
  if (isNaN(amount) || parseFloat(amount) <= 0) {
    return { success: false, error: "Amount must be a positive number" };
  }

  const student = await prisma.student.findUnique({ where: { id: studentId } });
  if (!student) return { success: false, error: "Student not found" };

  const feePlan = await prisma.feePlan.findUnique({ where: { id: feePlanId } });
  if (!feePlan) return { success: false, error: "Fee plan not found" };

  const payment = await prisma.payment.create({
    data: { studentId, feePlanId, amount: parseFloat(amount), notes: notes || null },
    include: {
      student: { include: { user: { select: { fullName: true } } } },
      feePlan: true,
    },
  });
  return { success: true, payment };
}

module.exports = { listPayments, recordPayment };
