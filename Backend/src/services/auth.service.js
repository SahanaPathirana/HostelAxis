const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const prisma = require("../prisma");

async function registerStudent(data) {
  const { full_name, email, phone, password, university_id, university_name } = data;
  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) return { success: false, error: "Email already registered" };

  const existingStudent = await prisma.student.findUnique({ where: { universityId: university_id } });
  if (existingStudent) return { success: false, error: "University ID already registered" };

  const hashedPassword = await bcrypt.hash(password, 10);
  const result = await prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: { email, password: hashedPassword, fullName: full_name, phone, role: "Student", active: true },
    });
    await tx.student.create({
      data: { userId: user.id, universityId: university_id, universityName: university_name, verificationStatus: "Pending" },
    });
    return user;
  });

  return { success: true, user: { id: result.id, email: result.email, fullName: result.fullName, role: result.role } };
}

async function loginUser(data) {
  const { email, password } = data;
  // Try by email first, then by phone (for staff who use phone as login ID)
  let user = await prisma.user.findUnique({ where: { email }, include: { student: true, staff: true } });
  if (!user) {
    user = await prisma.user.findFirst({ where: { phone: email }, include: { student: true, staff: true } });
  }
  if (!user) return { success: false, error: "Invalid email or password" };
  if (!user.active) return { success: false, error: "Account is deactivated. Contact admin." };

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) return { success: false, error: "Invalid email or password" };

  const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, process.env.JWT_SECRET, { expiresIn: "7d" });
  return {
    success: true,
    token,
    user: {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      phone: user.phone,
      role: user.role,
      active: user.active,
      student: user.student ? { id: user.student.id, universityId: user.student.universityId, universityName: user.student.universityName, verificationStatus: user.student.verificationStatus } : null,
      staff: user.staff ? { id: user.staff.id, whatsappNumber: user.staff.whatsappNumber, department: user.staff.department } : null,
    },
  };
}

module.exports = { registerStudent, loginUser };
