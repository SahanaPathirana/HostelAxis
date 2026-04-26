const prisma = require("../prisma");
const { createNotificationForAdmins, createNotificationForUser } = require("./notification.service");

async function submitComplaint(userId, data) {
  const { title, description, category } = data;
  if (!title || !title.trim()) return { success: false, error: "Title is required" };
  if (!description || !description.trim()) return { success: false, error: "Description is required" };

  const student = await prisma.student.findUnique({ where: { userId }, include: { user: true } });
  if (!student) return { success: false, error: "Student profile not found" };
  if (student.verificationStatus !== "Verified") return { success: false, error: "Only verified students can submit complaints" };

  const complaint = await prisma.complaint.create({
    data: { studentId: student.id, title: title.trim(), description: description.trim(), category: category || "Other" },
  });

  await createNotificationForAdmins("Complaint", "New complaint", `${student.user.fullName} submitted a complaint: ${title.trim()}`);
  return { success: true, complaint };
}

async function listComplaintsForStudent(userId) {
  const student = await prisma.student.findUnique({ where: { userId } });
  if (!student) return [];
  return prisma.complaint.findMany({
    where: { studentId: student.id },
    include: { assignedStaff: { include: { user: true } } },
    orderBy: { createdAt: "desc" },
  });
}

async function listAllComplaints() {
  return prisma.complaint.findMany({
    include: {
      student: { include: { user: { select: { id: true, fullName: true, email: true } } } },
      assignedStaff: { include: { user: { select: { id: true, fullName: true, email: true } } } },
    },
    orderBy: { createdAt: "desc" },
  });
}

async function assignComplaintToStaff(id, staffId) {
  const complaint = await prisma.complaint.findUnique({ where: { id }, include: { student: { include: { user: true } } } });
  if (!complaint) return { success: false, error: "Complaint not found" };
  const staff = await prisma.staff.findUnique({ where: { id: staffId }, include: { user: true } });
  if (!staff) return { success: false, error: "Staff not found" };

  const updated = await prisma.complaint.update({
    where: { id },
    data: { assignedStaffId: staffId, status: "StaffNotified", whatsappSentAt: new Date() },
    include: { student: { include: { user: true } }, assignedStaff: { include: { user: true } } },
  });

  // Notify the student that their complaint is being handled
  await createNotificationForUser(
    complaint.student.userId, "Complaint", "Complaint in progress",
    `Your complaint "${complaint.title}" has been assigned to staff.`
  );

  // Generate WhatsApp URL for admin to notify staff directly (no staff login needed)
  const staffPhone = (staff.whatsappNumber || "").replace(/\D/g, "");
  const waText = encodeURIComponent(
    `Hello ${staff.user.fullName}, you have been assigned a new complaint:\n\n` +
    `*Title:* ${complaint.title}\n` +
    `*Student:* ${complaint.student.user.fullName}\n` +
    `*Details:* ${complaint.description || "See admin panel for details."}\n\n` +
    `Please attend to this as soon as possible. Thank you.`
  );
  const whatsappUrl = staffPhone ? `https://wa.me/${staffPhone}?text=${waText}` : null;

  return { success: true, complaint: updated, whatsappUrl };
}

async function updateComplaintStatus(id, status) {
  const valid = ["Open", "InProgress", "StaffNotified", "DoneByStaff", "Resolved", "Closed"];
  if (!valid.includes(status)) return { success: false, error: "Invalid status" };
  const complaint = await prisma.complaint.findUnique({ where: { id }, include: { student: { include: { user: true } } } });
  if (!complaint) return { success: false, error: "Complaint not found" };

  const data = { status };
  if (status === "Resolved") data.adminResolvedAt = new Date();

  const updated = await prisma.complaint.update({ where: { id }, data, include: { student: { include: { user: true } }, assignedStaff: { include: { user: true } } } });
  if (["Resolved", "Closed"].includes(status)) {
    await createNotificationForUser(complaint.student.userId, "Complaint", "Complaint updated", `Your complaint "${complaint.title}" was marked as ${status}.`);
  }
  return { success: true, complaint: updated };
}

async function listAssignedComplaintsForStaff(userId) {
  const staff = await prisma.staff.findUnique({ where: { userId } });
  if (!staff) return [];
  return prisma.complaint.findMany({ where: { assignedStaffId: staff.id }, include: { student: { include: { user: true } } }, orderBy: { createdAt: "desc" } });
}

async function markDoneByStaff(userId, complaintId) {
  const staff = await prisma.staff.findUnique({ where: { userId }, include: { user: true } });
  if (!staff) return { success: false, error: "Staff profile not found" };
  const complaint = await prisma.complaint.findUnique({ where: { id: complaintId }, include: { student: { include: { user: true } } } });
  if (!complaint) return { success: false, error: "Complaint not found" };
  if (complaint.assignedStaffId !== staff.id) return { success: false, error: "Not your complaint" };

  const updated = await prisma.complaint.update({ where: { id: complaintId }, data: { status: "DoneByStaff", staffDoneAt: new Date() } });
  await createNotificationForAdmins("Complaint", "Staff marked complaint done", `${staff.user.fullName} marked complaint "${complaint.title}" as done.`);
  return { success: true, complaint: updated };
}

module.exports = { submitComplaint, listComplaintsForStudent, listAllComplaints, updateComplaintStatus, assignComplaintToStaff, listAssignedComplaintsForStaff, markDoneByStaff };
