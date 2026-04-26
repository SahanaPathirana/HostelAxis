const prisma = require("../prisma");

const TYPE_CAPACITY = { Single: 1, Double: 2, Triple: 3, Quad: 4, Quint: 5 };

async function listRooms() {
  return prisma.room.findMany({
    include: {
      beds: {
        include: { student: { include: { user: { select: { fullName: true, email: true } } } } },
        orderBy: { bedNumber: "asc" },
      },
    },
    orderBy: { roomNumber: "asc" },
  });
}

async function createRoom(data) {
  const { roomNumber, type, floor, hostelBlock, preferredBedType } = data;
  if (!roomNumber) return { success: false, error: "Room number is required" };
  if (!floor) return { success: false, error: "Floor is required" };
  if (!hostelBlock) return { success: false, error: "Block is required" };

  const safeType = type || "Single";
  const capacity = TYPE_CAPACITY[safeType] || 1;

  const existing = await prisma.room.findUnique({ where: { roomNumber } });
  if (existing) return { success: false, error: "Room number already exists" };

  const room = await prisma.$transaction(async (tx) => {
    const newRoom = await tx.room.create({
      data: {
        roomNumber,
        type: safeType,
        capacity,
        floor: parseInt(floor),
        hostelBlock,
        preferredBedType: safeType === "Single" ? "Normal" : preferredBedType || "Normal",
      },
    });
    await tx.bed.createMany({
      data: Array.from({ length: capacity }, (_, i) => ({ bedNumber: `B${i + 1}`, roomId: newRoom.id, bedType: newRoom.preferredBedType || "Normal" })),
    });
    return newRoom;
  });

  return { success: true, room };
}

async function updateRoom(roomId, data) {
  const room = await prisma.room.findUnique({ where: { id: roomId }, include: { beds: true } });
  if (!room) return { success: false, error: "Room not found" };
  if (room.beds.some((b) => b.studentId)) return { success: false, error: "Cannot edit room while occupied" };

  const safeType = data.type || room.type;
  const capacity = TYPE_CAPACITY[safeType] || room.capacity;
  const preferredBedType = safeType === "Single" ? "Normal" : (data.preferredBedType || room.preferredBedType || "Normal");

  await prisma.$transaction(async (tx) => {
    await tx.bed.deleteMany({ where: { roomId } });
    await tx.room.update({ where: { id: roomId }, data: { roomNumber: data.roomNumber || room.roomNumber, type: safeType, capacity, floor: parseInt(data.floor || room.floor), hostelBlock: data.hostelBlock || room.hostelBlock, preferredBedType } });
    await tx.bed.createMany({ data: Array.from({ length: capacity }, (_, i) => ({ bedNumber: `B${i + 1}`, roomId, bedType: preferredBedType })) });
  });

  return { success: true };
}

async function deleteRoom(roomId) {
  const room = await prisma.room.findUnique({ where: { id: roomId }, include: { beds: true } });
  if (!room) return { success: false, error: "Room not found" };
  if (room.beds.some((b) => b.studentId !== null)) return { success: false, error: "Cannot delete room with occupied beds" };
  await prisma.room.delete({ where: { id: roomId } });
  return { success: true };
}

async function listAvailableBeds() {
  return prisma.bed.findMany({ where: { studentId: null }, include: { room: true }, orderBy: [{ room: { roomNumber: "asc" } }, { bedNumber: "asc" }] });
}

async function assignBed(bedId, studentId, note) {
  const bed = await prisma.bed.findUnique({ where: { id: bedId } });
  if (!bed) return { success: false, error: "Bed not found" };
  const student = await prisma.student.findUnique({ where: { id: studentId } });
  if (!student) return { success: false, error: "Student not found" };

  const existingBed = await prisma.bed.findUnique({ where: { studentId } });

  const updated = await prisma.$transaction(async (tx) => {
    if (existingBed) {
      await tx.bed.update({ where: { id: existingBed.id }, data: { studentId: null, assignedAt: null } });
      await tx.bedAllocationHistory.updateMany({ where: { studentId, bedId: existingBed.id, releasedAt: null }, data: { releasedAt: new Date(), note: note || "Transferred" } });
    }
    const assigned = await tx.bed.update({ where: { id: bedId }, data: { studentId, assignedAt: new Date() }, include: { room: true, student: { include: { user: true } } } });
    await tx.bedAllocationHistory.create({ data: { studentId, bedId, note: note || (existingBed ? "Transferred" : "Allocated") } });
    return assigned;
  });

  return { success: true, bed: updated };
}

async function unassignBed(bedId) {
  const bed = await prisma.bed.findUnique({ where: { id: bedId } });
  if (!bed) return { success: false, error: "Bed not found" };
  if (!bed.studentId) return { success: false, error: "Bed is not occupied" };

  await prisma.$transaction(async (tx) => {
    await tx.bed.update({ where: { id: bedId }, data: { studentId: null, assignedAt: null } });
    await tx.bedAllocationHistory.updateMany({ where: { bedId, releasedAt: null }, data: { releasedAt: new Date(), note: "Unassigned" } });
  });
  return { success: true };
}

async function listAllocationHistory() {
  return prisma.bedAllocationHistory.findMany({ include: { student: { include: { user: true } }, bed: { include: { room: true } } }, orderBy: { assignedAt: "desc" } });
}

module.exports = { listRooms, createRoom, updateRoom, deleteRoom, listAvailableBeds, assignBed, unassignBed, listAllocationHistory };
