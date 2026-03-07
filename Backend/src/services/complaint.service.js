const prisma = require("../prisma");

async function submitComplaint(userId, data) {
  const { title, description } = data;
  if (!title || !title.trim()) return { success: false, error: "Title is required" };
  if (!description || !description.trim()) return { success: false, error: "Description is required" };

  const student = await prisma.student.findUnique({ where: { userId } });
  if (!student) return { success: false, error: "Student profile not found" };

  const complaint = await prisma.complaint.create({
    data: { studentId: student.id, title: title.trim(), description: description.trim() },
  });
  return { success: true, complaint };
}

async function listComplaintsForStudent(userId) {
  const student = await prisma.student.findUnique({ where: { userId } });
  if (!student) return [];
  return prisma.complaint.findMany({
    where: { studentId: student.id },
    orderBy: { createdAt: "desc" },
  });
}

async function listAllComplaints() {
  return prisma.complaint.findMany({
    include: {
      student: { include: { user: { select: { fullName: true, email: true } } } },
    },
    orderBy: { createdAt: "desc" },
  });
}

async function updateComplaintStatus(id, status) {
  const valid = ["Open", "InProgress", "Resolved", "Closed"];
  if (!valid.includes(status)) return { success: false, error: "Invalid status" };
  const complaint = await prisma.complaint.findUnique({ where: { id } });
  if (!complaint) return { success: false, error: "Complaint not found" };
  const updated = await prisma.complaint.update({ where: { id }, data: { status } });
  return { success: true, complaint: updated };
}

module.exports = { submitComplaint, listComplaintsForStudent, listAllComplaints, updateComplaintStatus };
