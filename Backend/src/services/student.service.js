const prisma = require("../prisma");

async function getStudentProfile(userId) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      notifications: { orderBy: { createdAt: "desc" }, take: 20 },
      student: {
        include: {
          bed: { include: { room: true } },
          currentFeePlan: true,
          payments: { include: { feePlan: true }, orderBy: { paidAt: "desc" }, take: 10 },
          paymentRequests: { include: { feePlan: true }, orderBy: { createdAt: "desc" }, take: 10 },
          complaints: { include: { assignedStaff: { include: { user: true } } }, orderBy: { createdAt: "desc" }, take: 10 },
          visitors: { orderBy: { inAt: "desc" }, take: 15 },
        },
      },
    },
  });
  if (!user) return { success: false, error: "User not found" };
  return { success: true, user };
}

module.exports = { getStudentProfile };
