const prisma = require("../prisma");

async function getMyNotifications(req, res) {
  try {
    const notifications = await prisma.notification.findMany({ where: { userId: req.user.id }, orderBy: { createdAt: "desc" }, take: 50 });
    res.json({ notifications });
  } catch (err) {
    console.error("getMyNotifications error:", err.message);
    res.status(500).json({ error: "Failed to fetch notifications" });
  }
}

async function markAsRead(req, res) {
  try {
    await prisma.notification.updateMany({ where: { userId: req.user.id, id: req.params.id }, data: { read: true } });
    res.json({ message: "Marked as read" });
  } catch (err) {
    console.error("markAsRead error:", err.message);
    res.status(500).json({ error: "Failed to mark as read" });
  }
}

module.exports = { getMyNotifications, markAsRead };
