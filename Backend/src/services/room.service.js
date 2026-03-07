const prisma = require("../prisma");

async function listRooms() {
  return prisma.room.findMany({
    include: {
      beds: {
        include: {
          student: {
            include: { user: { select: { fullName: true, email: true } } },
          },
        },
        orderBy: { bedNumber: "asc" },
      },
    },
    orderBy: { roomNumber: "asc" },
  });
}

async function createRoom(data) {
  const { roomNumber, type, capacity, floor, hostelBlock } = data;
  if (!roomNumber) return { success: false, error: "Room number is required" };
  if (!capacity || capacity < 1) return { success: false, error: "Capacity must be at least 1" };

  const existing = await prisma.room.findUnique({ where: { roomNumber } });
  if (existing) return { success: false, error: "Room number already exists" };

  const room = await prisma.$transaction(async (tx) => {
    const newRoom = await tx.room.create({
      data: {
        roomNumber,
        type: type || "Single",
        capacity: parseInt(capacity),
        floor: floor ? parseInt(floor) : null,
        hostelBlock: hostelBlock || null,
      },
    });
    const bedData = Array.from({ length: parseInt(capacity) }, (_, i) => ({
      bedNumber: `B${i + 1}`,
      roomId: newRoom.id,
    }));
    await tx.bed.createMany({ data: bedData });
    return newRoom;
  });

  return { success: true, room };
}

async function deleteRoom(roomId) {
  const room = await prisma.room.findUnique({ where: { id: roomId }, include: { beds: true } });
  if (!room) return { success: false, error: "Room not found" };
  if (room.beds.some((b) => b.studentId !== null)) {
    return { success: false, error: "Cannot delete room with occupied beds" };
  }
  await prisma.room.delete({ where: { id: roomId } });
  return { success: true };
}

async function listAvailableBeds() {
  return prisma.bed.findMany({
    where: { studentId: null },
    include: { room: true },
    orderBy: [{ room: { roomNumber: "asc" } }, { bedNumber: "asc" }],
  });
}

async function assignBed(bedId, studentId) {
  const bed = await prisma.bed.findUnique({ where: { id: bedId } });
  if (!bed) return { success: false, error: "Bed not found" };
  if (bed.studentId) return { success: false, error: "Bed is already occupied" };

  const student = await prisma.student.findUnique({ where: { id: studentId } });
  if (!student) return { success: false, error: "Student not found" };

  const existingBed = await prisma.bed.findUnique({ where: { studentId } });
  if (existingBed) return { success: false, error: "Student already has a bed assigned" };

  const updated = await prisma.bed.update({
    where: { id: bedId },
    data: { studentId, assignedAt: new Date() },
    include: {
      room: true,
      student: { include: { user: { select: { fullName: true, email: true } } } },
    },
  });
  return { success: true, bed: updated };
}

async function unassignBed(bedId) {
  const bed = await prisma.bed.findUnique({ where: { id: bedId } });
  if (!bed) return { success: false, error: "Bed not found" };
  if (!bed.studentId) return { success: false, error: "Bed is not occupied" };
  const updated = await prisma.bed.update({
    where: { id: bedId },
    data: { studentId: null, assignedAt: null },
  });
  return { success: true, bed: updated };
}

module.exports = { listRooms, createRoom, deleteRoom, listAvailableBeds, assignBed, unassignBed };
