const { validateRegisterStudent } = require("../validators/auth.validator");

function validateRegisterStudentBody(req, res, next) {
  const { valid, errors, data } = validateRegisterStudent(req.body);
  if (!valid) {
    return res.status(400).json({ error: "Validation failed", details: errors });
  }
  req.validated = data;
  next();
}

module.exports = { validateRegisterStudentBody };
