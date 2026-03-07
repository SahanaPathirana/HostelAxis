const prisma = require("../prisma");

async function listStudents() {
  return prisma.student.findMany({
    include: {
      user: {
        select: { id: true, email: true, fullName: true, phone: true, role: true, createdAt: true },
      },
      bed: { include: { room: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}

async function verifyStudent(studentId, status) {
  const valid = ["Pending", "Verified", "Rejected"];
  if (!valid.includes(status)) return { success: false, error: "Invalid status" };

  const student = await prisma.student.findUnique({ where: { id: studentId } });
  if (!student) return { success: false, error: "Student not found" };

  const updated = await prisma.student.update({
    where: { id: studentId },
    data: { verificationStatus: status },
    include: { user: { select: { email: true, fullName: true } } },
  });
  return { success: true, student: updated };
}

module.exports = { listStudents, verifyStudent };
