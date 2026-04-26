const prisma = require("../prisma");
const { createNotificationForAdmins, createNotificationForUser } = require("./notification.service");

function addMonths(date, months) {
  const next = new Date(date);
  next.setMonth(next.getMonth() + months);
  return next;
}

async function listPayments() {
  return prisma.payment.findMany({
    include: {
      student: { include: { user: { select: { fullName: true, email: true } }, currentFeePlan: true } },
      feePlan: true,
    },
    orderBy: { paidAt: "desc" },
  });
}

async function listPaymentRequests() {
  return prisma.paymentRequest.findMany({
    include: {
      student: { include: { user: { select: { fullName: true, email: true } } } },
      feePlan: true,
    },
    orderBy: { createdAt: "desc" },
  });
}

async function recordPayment(data) {
  const { studentId, feePlanId, amount, notes, paidAt } = data;
  if (!studentId || !feePlanId || amount == null) {
    return { success: false, error: "studentId, feePlanId, and amount are required" };
  }
  if (isNaN(amount) || parseFloat(amount) < 0) {
    return { success: false, error: "Amount must be a positive number" };
  }

  const student = await prisma.student.findUnique({ where: { id: studentId }, include: { user: true } });
  if (!student) return { success: false, error: "Student not found" };
  const feePlan = await prisma.feePlan.findUnique({ where: { id: feePlanId } });
  if (!feePlan) return { success: false, error: "Fee plan not found" };

  // Duplicate-month guard: block if a payment already exists for this student in the same calendar month
  const paidDate = paidAt ? new Date(paidAt) : new Date();
  const monthStart = new Date(paidDate.getFullYear(), paidDate.getMonth(), 1);
  const monthEnd = new Date(paidDate.getFullYear(), paidDate.getMonth() + 1, 1);
  const existingThisMonth = await prisma.payment.findFirst({
    where: { studentId, paidAt: { gte: monthStart, lt: monthEnd } },
  });
  if (existingThisMonth) {
    return { success: false, error: "A payment has already been recorded for this student this month" };
  }

  const paidAmount = parseFloat(amount);
  const remainingAmount = Math.max(feePlan.amount - paidAmount, 0);
  const validTill = addMonths(paidDate, feePlan.months);

  const payment = await prisma.$transaction(async (tx) => {
    const created = await tx.payment.create({
      data: {
        studentId,
        feePlanId,
        amount: paidAmount,
        paidAt: paidDate,
        notes: notes || null,
        remainingAmount,
        validTill,
      },
      include: { student: { include: { user: true } }, feePlan: true },
    });

    await tx.student.update({ where: { id: studentId }, data: { currentFeePlanId: feePlanId } });
    await tx.paymentRequest.updateMany({ where: { studentId, status: "Pending" }, data: { status: "Approved" } });
    return created;
  });

  await createNotificationForUser(student.userId, "Payment", "Payment updated", `Your payment of LKR ${paidAmount} has been recorded by admin.`);
  return { success: true, payment };
}

async function submitPaymentRequest(userId, data) {
  const { feePlanId, method, date, paidAmount, notes, slipUrl } = data;
  if (!feePlanId || !method || !date) return { success: false, error: "feePlanId, method and date are required" };
  if (!["Cash", "OnlineTransfer"].includes(method)) return { success: false, error: "Invalid payment method" };

  const student = await prisma.student.findUnique({ where: { userId }, include: { user: true } });
  if (!student) return { success: false, error: "Student profile not found" };
  if (student.verificationStatus !== "Verified") return { success: false, error: "Only verified students can submit payments" };

  const feePlan = await prisma.feePlan.findUnique({ where: { id: feePlanId } });
  if (!feePlan) return { success: false, error: "Fee plan not found" };
  if (method === "OnlineTransfer" && !slipUrl) return { success: false, error: "Slip URL is required for online transfer" };

  const request = await prisma.paymentRequest.create({
    data: {
      studentId: student.id,
      feePlanId,
      method,
      date: new Date(date),
      paidAmount: paidAmount ? parseFloat(paidAmount) : null,
      notes: notes || null,
      slipUrl: slipUrl || null,
    },
    include: { feePlan: true },
  });

  await createNotificationForAdmins("Payment", "New payment request", `${student.user.fullName} submitted a ${method} payment request.`);
  return { success: true, request };
}

module.exports = { listPayments, recordPayment, submitPaymentRequest, listPaymentRequests };
