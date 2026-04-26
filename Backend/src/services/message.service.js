const prisma = require("../prisma");

/** Admin sends a message to a specific student/user */
async function sendMessage(fromUserId, toUserId, message) {
  if (!toUserId || !message) return { success: false, error: "toUserId and message are required" };
  const toUser = await prisma.user.findUnique({ where: { id: toUserId } });
  if (!toUser) return { success: false, error: "Recipient not found" };

  const msg = await prisma.directMessage.create({
    data: { fromUserId, toUserId, message },
    include: {
      fromUser: { select: { fullName: true, role: true } },
      toUser: { select: { fullName: true, role: true } },
    },
  });
  return { success: true, message: msg };
}

/** Get the thread between two users */
async function getThread(userId1, userId2) {
  return prisma.directMessage.findMany({
    where: {
      OR: [
        { fromUserId: userId1, toUserId: userId2 },
        { fromUserId: userId2, toUserId: userId1 },
      ],
    },
    include: { fromUser: { select: { fullName: true, role: true } } },
    orderBy: { createdAt: "asc" },
  });
}

/** Admin gets all conversations (grouped by student) */
async function listConversations(adminUserId) {
  // Get all distinct users who have exchanged messages with admin
  const sent = await prisma.directMessage.findMany({
    where: { fromUserId: adminUserId },
    select: { toUserId: true },
    distinct: ["toUserId"],
  });
  const received = await prisma.directMessage.findMany({
    where: { toUserId: adminUserId },
    select: { fromUserId: true },
    distinct: ["fromUserId"],
  });

  const userIds = [
    ...new Set([
      ...sent.map((m) => m.toUserId),
      ...received.map((m) => m.fromUserId),
    ]),
  ];

  const users = await prisma.user.findMany({
    where: { id: { in: userIds } },
    select: {
      id: true,
      fullName: true,
      role: true,
      student: { select: { universityId: true } },
    },
  });

  // Also fetch unread counts per user
  const result = await Promise.all(
    users.map(async (u) => {
      const unread = await prisma.directMessage.count({
        where: { fromUserId: u.id, toUserId: adminUserId, read: false },
      });
      const lastMsg = await prisma.directMessage.findFirst({
        where: {
          OR: [
            { fromUserId: adminUserId, toUserId: u.id },
            { fromUserId: u.id, toUserId: adminUserId },
          ],
        },
        orderBy: { createdAt: "desc" },
      });
      return { user: u, unread, lastMessage: lastMsg };
    })
  );
  return result.sort((a, b) =>
    (b.lastMessage?.createdAt?.getTime() || 0) - (a.lastMessage?.createdAt?.getTime() || 0)
  );
}

/** Mark all messages from a specific sender as read */
async function markThreadRead(fromUserId, toUserId) {
  await prisma.directMessage.updateMany({
    where: { fromUserId, toUserId, read: false },
    data: { read: true },
  });
}

/** Student gets their thread with admin */
async function getStudentThread(studentUserId) {
  const admin = await prisma.user.findFirst({ where: { role: "Admin" } });
  if (!admin) return [];
  return getThread(studentUserId, admin.id);
}

/** Student sends a message to admin */
async function studentSendMessage(studentUserId, message) {
  if (!message) return { success: false, error: "Message is required" };
  const admin = await prisma.user.findFirst({ where: { role: "Admin" } });
  if (!admin) return { success: false, error: "Admin not found" };
  return sendMessage(studentUserId, admin.id, message);
}

module.exports = { sendMessage, getThread, listConversations, markThreadRead, getStudentThread, studentSendMessage };
