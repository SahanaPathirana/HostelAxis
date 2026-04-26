const prisma = require("../prisma");

async function getProfile(req, res) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      include: {
        staff: true,
        notifications: { orderBy: { createdAt: "desc" }, take: 30 },
      },
    });
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json(user);
  } catch (err) {
    console.error("staff getProfile error:", err.message);
    res.status(500).json({ error: "Failed to fetch profile" });
  }
}

module.exports = { getProfile };
