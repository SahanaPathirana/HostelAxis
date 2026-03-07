const authService = require("../services/auth.service");

async function registerStudent(req, res) {
  try {
    const result = await authService.registerStudent(req.validated || req.body);
    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }
    res.status(201).json({
      message: "Registration successful. Your account is pending verification.",
      user: result.user,
    });
  } catch (err) {
    console.error("Register student error:", err?.message ?? err);
    if (err?.code) console.error("Prisma error code:", err.code);
    res.status(500).json({ error: "Registration failed" });
  }
}

async function login(req, res) {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }
    const result = await authService.loginUser({ email, password });
    if (!result.success) {
      return res.status(401).json({ error: result.error });
    }
    res.json({ token: result.token, user: result.user });
  } catch (err) {
    console.error("Login error:", err?.message ?? err);
    res.status(500).json({ error: "Login failed" });
  }
}

module.exports = { registerStudent, login };
