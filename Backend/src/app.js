const express = require("express");
const cors = require("cors");
const authRoutes = require("./routes/auth.routes");
const adminRoutes = require("./routes/admin.routes");
const studentRoutes = require("./routes/student.routes");
const staffRoutes = require("./routes/staff.routes");

const app = express();

app.use(cors());
app.use(express.json({ limit: "10mb" }));

app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/student", studentRoutes);
app.use("/api/staff", staffRoutes);

app.get("/health", (req, res) => {
  res.json({ message: "Server running" });
});

module.exports = app;
