const { z } = require("zod");

const registerStudentSchema = z.object({
  full_name: z.string().min(1, "Full name is required").trim(),
  email: z.string().min(1, "Email is required").email("Invalid email").trim().toLowerCase(),
  phone: z.string().min(1, "Phone is required").trim(),
  password: z.string().min(6, "Password must be at least 6 characters"),
  university_id: z.string().min(1, "University ID is required").trim(),
  university_name: z.string().min(1, "University name is required").trim(),
});

function validateRegisterStudent(body) {
  const result = registerStudentSchema.safeParse(body);
  if (!result.success) {
    const issues = result.error.issues ?? result.error.errors ?? [];
    const errors = issues.map((e) => ({ field: (e.path ?? []).join("."), message: e.message ?? "Invalid" }));
    return { valid: false, errors };
  }
  return { valid: true, data: result.data };
}

module.exports = { validateRegisterStudent };
