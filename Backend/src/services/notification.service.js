const prisma = require("../prisma");

async function createNotificationForUser(userId, type, title, message) {
  if (!userId) return;
  await prisma.notification.create({ data: { userId, type, title, message } });
}

async function createNotificationForAdmins(type, title, message) {
  const admins = await prisma.user.findMany({ where: { role: "Admin" }, select: { id: true } });
  if (!admins.length) return;
  await prisma.notification.createMany({ data: admins.map((a) => ({ userId: a.id, type, title, message })) });
}

module.exports = { createNotificationForUser, createNotificationForAdmins };
