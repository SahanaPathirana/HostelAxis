const bcrypt = require("bcrypt");
const prisma = require("../prisma");

async function listStudents() {
  return prisma.student.findMany({
    include: {
      user: { select: { id: true, email: true, fullName: true, phone: true, role: true, active: true, createdAt: true } },
      bed: { include: { room: true } },
      currentFeePlan: true,
    },
    orderBy: { createdAt: "desc" },
  });
}

async function verifyStudent(studentId, status) {
  const valid = ["Pending", "Verified", "Rejected"];
  if (!valid.includes(status)) return { success: false, error: "Invalid status" };
  const student = await prisma.student.findUnique({ where: { id: studentId }, include: { user: true } });
  if (!student) return { success: false, error: "Student not found" };
  const updated = await prisma.student.update({ where: { id: studentId }, data: { verificationStatus: status }, include: { user: true } });

  // When a student is newly verified, send them all existing notices they missed
  if (status === "Verified" && student.verificationStatus !== "Verified") {
    const existingNotices = await prisma.notification.findMany({
      where: { type: "Notice" },
      distinct: ["title", "message"],
      select: { title: true, message: true },
    });
    if (existingNotices.length > 0) {
      await prisma.notification.createMany({
        data: existingNotices.map((n) => ({ userId: updated.userId, type: "Notice", title: n.title, message: n.message })),
        skipDuplicates: true,
      });
    }
  }

  return { success: true, student: updated };
}

async function setUserActive(userId, active) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return { success: false, error: "User not found" };
  const updated = await prisma.user.update({ where: { id: userId }, data: { active: !!active } });
  return { success: true, user: updated };
}

async function listStaff() {
  return prisma.staff.findMany({ include: { user: { select: { id: true, fullName: true, email: true, phone: true, active: true } } }, orderBy: { createdAt: "desc" } });
}

async function createStaffAccount(data) {
  const { fullName, phone, whatsappNumber, department } = data;
  if (!fullName || !phone || !whatsappNumber)
    return { success: false, error: "fullName, phone and whatsappNumber are required" };

  // Auto-generate email from phone so staff can login
  const cleanPhone = phone.replace(/\D/g, "");
  const autoEmail = `staff_${cleanPhone}@hostelaxis.sys`;

  const existing = await prisma.user.findFirst({ where: { OR: [{ email: autoEmail }, { phone }] } });
  if (existing) return { success: false, error: "A staff member with this phone number already exists" };

  // Generate a readable one-time password shown to admin
  const suffix = Math.floor(1000 + Math.random() * 9000);
  const autoPassword = `Staff@${suffix}`;
  const hashed = await bcrypt.hash(autoPassword, 10);

  const staff = await prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: { fullName, email: autoEmail, phone, password: hashed, role: "Staff", active: true },
    });
    return tx.staff.create({
      data: { userId: user.id, whatsappNumber, department: department || null },
      include: { user: true },
    });
  });

  return { success: true, staff, loginDetails: { email: autoEmail, password: autoPassword } };
}

async function publishNotice(title, message, onlyVerifiedStudents = true, targetStudentId = null) {
  if (!title || !message) return { success: false, error: "title and message required" };

  // If targeting a specific student
  if (targetStudentId) {
    const student = await prisma.student.findUnique({ where: { id: targetStudentId }, include: { user: true } });
    if (!student) return { success: false, error: "Student not found" };
    await prisma.notification.create({ data: { userId: student.userId, type: "Notice", title, message } });
    return { success: true, count: 1, message: `Notice sent to ${student.user.fullName}` };
  }

  // onlyVerifiedStudents: true  → only verified + active students
  // onlyVerifiedStudents: false → ALL students (verified and unverified)
  const students = await prisma.student.findMany({
    where: onlyVerifiedStudents
      ? { verificationStatus: "Verified", user: { active: true } }
      : {}, // no filter = all students
    include: { user: true },
  });
  if (!students.length) return { success: true, count: 0, message: "No students to notify" };

  await prisma.notification.createMany({
    data: students.map((s) => ({ userId: s.userId, type: "Notice", title, message })),
  });
  return {
    success: true,
    count: students.length,
    message: `Notice sent to ${students.length} student(s)${onlyVerifiedStudents ? " (verified only)" : " (all students)"}`,
  };
}


async function getDashboardStats() {
  const [
    studentsTotal, studentsVerified,
    complaintsOpen, paymentRequestsPending, staffCount,
    allBeds, complaintsAll, paymentsAll, feePlansAll,
  ] = await Promise.all([
    prisma.student.count(),
    prisma.student.count({ where: { verificationStatus: "Verified" } }),
    prisma.complaint.count({ where: { status: { in: ["Open", "InProgress", "StaffNotified", "DoneByStaff"] } } }),
    prisma.paymentRequest.count({ where: { status: "Pending" } }),
    prisma.staff.count({ where: { active: true } }),
    prisma.bed.findMany({ select: { studentId: true } }),
    prisma.complaint.findMany({ select: { title: true, status: true } }),
    prisma.payment.findMany({ select: { amount: true, feePlanId: true } }),
    prisma.feePlan.findMany({ select: { id: true, amount: true } }),
  ]);

  // Rooms / beds occupancy
  const bedsOccupied = allBeds.filter((b) => b.studentId).length;
  const bedsTotal = allBeds.length;
  const bedsFree = bedsTotal - bedsOccupied;

  // Complaints breakdown by type (title = type)
  const complaintsByType = {};
  complaintsAll.forEach((c) => {
    const key = c.title || "Other";
    complaintsByType[key] = (complaintsByType[key] || 0) + 1;
  });

  // Payments: full vs partial (half)
  const planAmountMap = {};
  feePlansAll.forEach((fp) => { planAmountMap[fp.id] = Number(fp.amount); });
  let paymentsCompleted = 0;
  let paymentsHalf = 0;
  paymentsAll.forEach((p) => {
    const planAmt = planAmountMap[p.feePlanId] || 0;
    const paid = Number(p.amount);
    if (planAmt > 0 && paid < planAmt) paymentsHalf++;
    else paymentsCompleted++;
  });

  return {
    // Legacy fields kept for compatibility
    studentsTotal, studentsVerified, complaintsOpen, paymentRequestsPending, staffCount,
    // New rich fields
    bedsOccupied, bedsFree, bedsTotal,
    complaintsByType,
    paymentsCompleted,
    paymentsHalf,
    paymentsTotal: paymentsAll.length,
  };
}

module.exports = { listStudents, verifyStudent, setUserActive, listStaff, createStaffAccount, publishNotice, getDashboardStats };

