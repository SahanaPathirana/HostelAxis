const prisma = require("../prisma");

async function listVisitors() {
  return prisma.visitorLog.findMany({
    include: { student: { include: { user: { select: { fullName: true, email: true } } } } },
    orderBy: { inAt: "desc" },
  });
}

async function createVisitor(data) {
  const { studentId, visitorName, relation, inAt, outAt, notes } = data;
  if (!studentId || !visitorName || !inAt) return { success: false, error: "studentId, visitorName and inAt are required" };

  const student = await prisma.student.findUnique({ where: { id: studentId }, include: { user: true } });
  if (!student) return { success: false, error: "Student not found" };

  const visitor = await prisma.visitorLog.create({
    data: {
      studentId,
      visitorName: visitorName.trim(),
      relation: relation || null,
      inAt: new Date(inAt),
      outAt: outAt ? new Date(outAt) : null,
      notes: notes || null,
    },
  });

  return { success: true, visitor };
}

async function updateVisitor(id, data) {
  const existing = await prisma.visitorLog.findUnique({ where: { id } });
  if (!existing) return { success: false, error: "Visitor log not found" };

  const visitor = await prisma.visitorLog.update({
    where: { id },
    data: {
      outAt: data.outAt ? new Date(data.outAt) : null,
      notes: data.notes !== undefined ? data.notes : existing.notes,
    },
  });
  return { success: true, visitor };
}

module.exports = { listVisitors, createVisitor, updateVisitor };

