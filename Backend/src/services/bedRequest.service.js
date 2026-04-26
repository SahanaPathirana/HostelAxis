const prisma = require("../prisma");
const { createNotificationForAdmins, createNotificationForUser } = require("./notification.service");

/** Get all rooms with beds (and student info) for the map view */
async function getRoomMap() {
  return prisma.room.findMany({
    include: {
      beds: {
        include: {
          student: { include: { user: { select: { fullName: true } } } },
        },
        orderBy: { bedNumber: "asc" },
      },
    },
    orderBy: [{ hostelBlock: "asc" }, { floor: "asc" }, { roomNumber: "asc" }],
  });
}

/** Student submits a bed request */
async function submitBedRequest(userId, bedId, bunkPosition, reason) {
  const student = await prisma.student.findUnique({
    where: { userId },
    include: { user: true, bed: true },
  });
  if (!student) return { success: false, error: "Student profile not found" };
  if (student.verificationStatus !== "Verified")
    return { success: false, error: "Only verified students can request beds" };

  const bed = await prisma.bed.findUnique({ where: { id: bedId } });
  if (!bed) return { success: false, error: "Bed not found" };
  if (bed.studentId) return { success: false, error: "This bed is already occupied" };

  // If student already has a bed, this is a TRANSFER — reason is mandatory
  const isTransfer = !!student.bed;
  if (isTransfer && (!reason || !reason.trim()))
    return { success: false, error: "A reason is required for transfer requests" };

  // Check for existing pending request from this student
  const existingPending = await prisma.bedRequest.findFirst({
    where: { studentId: student.id, status: "Pending" },
  });
  if (existingPending) return { success: false, error: "You already have a pending bed request" };

  const request = await prisma.bedRequest.create({
    data: {
      studentId: student.id, bedId,
      bunkPosition: bunkPosition || null,
      reason: reason ? reason.trim() : null,
    },
    include: { bed: { include: { room: true } }, student: { include: { user: true } } },
  });

  const posLabel = bunkPosition ? ` (${bunkPosition})` : "";
  const typeLabel = isTransfer ? "Transfer" : "Bed";
  await createNotificationForAdmins(
    "General",
    `New ${typeLabel} Request`,
    `${student.user.fullName} requested ${isTransfer ? "a transfer to" : "bed"} ${bed.bedNumber}${posLabel} in room.`
  );
  return { success: true, request };
}

/** List all bed requests (admin) */
async function listBedRequests() {
  return prisma.bedRequest.findMany({
    include: {
      student: { include: { user: true } },
      bed: { include: { room: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}

/** Admin approves a bed request → assigns bed */
async function approveBedRequest(requestId) {
  const req = await prisma.bedRequest.findUnique({
    where: { id: requestId },
    include: { student: { include: { user: true } }, bed: { include: { room: true } } },
  });
  if (!req) return { success: false, error: "Request not found" };
  if (req.status !== "Pending") return { success: false, error: "Request is not pending" };

  const bed = await prisma.bed.findUnique({ where: { id: req.bedId } });
  if (bed.studentId) return { success: false, error: "Bed is now occupied — cannot assign" };

  // Release any current bed the student has
  const existingBed = await prisma.bed.findUnique({ where: { studentId: req.studentId } });

  await prisma.$transaction(async (tx) => {
    if (existingBed) {
      await tx.bed.update({ where: { id: existingBed.id }, data: { studentId: null, assignedAt: null } });
      await tx.bedAllocationHistory.updateMany({
        where: { studentId: req.studentId, bedId: existingBed.id, releasedAt: null },
        data: { releasedAt: new Date(), note: "Transferred via request" },
      });
    }
    await tx.bed.update({ where: { id: req.bedId }, data: { studentId: req.studentId, assignedAt: new Date() } });
    await tx.bedAllocationHistory.create({
      data: { studentId: req.studentId, bedId: req.bedId, note: "Approved bed request" },
    });
    await tx.bedRequest.update({ where: { id: requestId }, data: { status: "Approved" } });
  });

  await createNotificationForUser(
    req.student.userId,
    "General",
    "Bed Request Approved",
    `Your bed request has been approved! You are now assigned to ${req.bed.room.roomNumber} / ${req.bed.bedNumber}.`
  );
  return { success: true };
}

/** Admin rejects a bed request */
async function rejectBedRequest(requestId) {
  const req = await prisma.bedRequest.findUnique({
    where: { id: requestId },
    include: { student: { include: { user: true } } },
  });
  if (!req) return { success: false, error: "Request not found" };
  if (req.status !== "Pending") return { success: false, error: "Request is not pending" };

  await prisma.bedRequest.update({ where: { id: requestId }, data: { status: "Rejected" } });

  await createNotificationForUser(
    req.student.userId,
    "General",
    "Bed Request Rejected",
    "Your bed request was rejected by the admin. Please contact reception for more information."
  );
  return { success: true };
}

/** Get student's own bed requests */
async function getStudentBedRequests(userId) {
  const student = await prisma.student.findUnique({ where: { userId } });
  if (!student) return [];
  return prisma.bedRequest.findMany({
    where: { studentId: student.id },
    include: { bed: { include: { room: true } } },
    orderBy: { createdAt: "desc" },
  });
}

module.exports = { getRoomMap, submitBedRequest, listBedRequests, approveBedRequest, rejectBedRequest, getStudentBedRequests };
