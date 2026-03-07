require("dotenv").config();
const { PrismaClient } = require("@prisma/client");
const { PrismaPg } = require("@prisma/adapter-pg");
const bcrypt = require("bcrypt");

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  // Create default admin user
  const existing = await prisma.user.findUnique({ where: { email: "admin@hostelaxis.com" } });
  if (!existing) {
    const hashed = await bcrypt.hash("Admin@123", 10);
    await prisma.user.create({
      data: {
        email: "admin@hostelaxis.com",
        password: hashed,
        fullName: "System Admin",
        role: "Admin",
      },
    });
    console.log("✓ Admin created  →  admin@hostelaxis.com  /  Admin@123");
  } else {
    console.log("✓ Admin already exists");
  }
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
