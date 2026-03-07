const prisma = require("../prisma");

async function getStudentProfile(userId) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      student: {
        include: {
          bed: { include: { room: true } },
          payments: {
            include: { feePlan: true },
            orderBy: { paidAt: "desc" },
            take: 10,
          },
          complaints: { orderBy: { createdAt: "desc" }, take: 5 },
        },
      },
    },
  });
  if (!user) return { success: false, error: "User not found" };
  return { success: true, user };
}

module.exports = { getStudentProfile };
