import { useState } from "react";
import { useNavigate, Link as RouterLink } from "react-router-dom";
import {
  Box, Paper, Typography, TextField, Button, Stepper, Step, StepLabel,
  Alert, CircularProgress, IconButton, InputAdornment,
} from "@mui/material";
import {
  HomeWork, Visibility, VisibilityOff,
  ArrowBack, ArrowForward, CheckCircleOutline,
} from "@mui/icons-material";
import api from "../../services/api";

const steps = ["Personal Info", "Account Security", "University Details"];

const initialForm = {
  full_name: "", email: "", phone: "",
  password: "", confirm_password: "",
  university_id: "", university_name: "",
};

function validateStep(step, form) {
  const errs = {};
  if (step === 0) {
    if (!form.full_name.trim()) errs.full_name = "Full name is required";
    if (!form.email.trim()) errs.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errs.email = "Enter a valid email";
    if (!form.phone.trim()) errs.phone = "Phone number is required";
  }
  if (step === 1) {
    if (!form.password) errs.password = "Password is required";
    else if (form.password.length < 6) errs.password = "Minimum 6 characters";
    if (!form.confirm_password) errs.confirm_password = "Please confirm your password";
    else if (form.password !== form.confirm_password) errs.confirm_password = "Passwords do not match";
  }
  if (step === 2) {
    if (!form.university_id.trim()) errs.university_id = "University ID is required";
    if (!form.university_name.trim()) errs.university_name = "University name is required";
  }
  return errs;
}

export default function RegisterPage() {
  const [activeStep, setActiveStep] = useState(0);
  const [form, setForm] = useState(initialForm);
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [backendError, setBackendError] = useState("");
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
    setBackendError("");
  };

  const handleNext = () => {
    const errs = validateStep(activeStep, form);
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setErrors({});
    setActiveStep((s) => s + 1);
  };

  const handleBack = () => { setErrors({}); setActiveStep((s) => s - 1); };

  const handleSubmit = async () => {
    const errs = validateStep(2, form);
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setLoading(true);
    setBackendError("");
    // eslint-disable-next-line no-unused-vars
    const { confirm_password, ...payload } = form;
    try {
      await api.post("/auth/register-student", payload);
      setSuccess(true);
      setTimeout(() => navigate("/login", { replace: true }), 3000);
    } catch (err) {
      const res = err.response?.data;
      setBackendError(res?.error || res?.message || "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const fieldLabel = (text) => (
    <Typography variant="caption" fontWeight={600} color="#374151" mb={0.5} display="block">
      {text}
    </Typography>
  );

  const stepContent = [
    <Box key="personal" sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
      <Box>
        {fieldLabel("Full Name")}
        <TextField fullWidth name="full_name" placeholder="John Doe" value={form.full_name} onChange={handleChange} error={!!errors.full_name} helperText={errors.full_name} slotProps={{ htmlInput: { autoComplete: "name" } }} />
      </Box>
      <Box>
        {fieldLabel("Email Address")}
        <TextField fullWidth name="email" type="email" placeholder="you@university.com" value={form.email} onChange={handleChange} error={!!errors.email} helperText={errors.email} slotProps={{ htmlInput: { autoComplete: "email" } }} />
      </Box>
      <Box>
        {fieldLabel("Phone Number")}
        <TextField fullWidth name="phone" placeholder="+1 234 567 8900" value={form.phone} onChange={handleChange} error={!!errors.phone} helperText={errors.phone} slotProps={{ htmlInput: { autoComplete: "tel" } }} />
      </Box>
    </Box>,

    <Box key="security" sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
      <Box>
        {fieldLabel("Password")}
        <TextField
          fullWidth name="password" type={showPassword ? "text" : "password"}
          placeholder="Min. 6 characters" value={form.password} onChange={handleChange}
          error={!!errors.password} helperText={errors.password}
          slotProps={{
            htmlInput: { autoComplete: "new-password" },
            input: {
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton size="small" onClick={() => setShowPassword((v) => !v)} edge="end">
                    {showPassword ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                  </IconButton>
                </InputAdornment>
              ),
            },
          }}
        />
      </Box>
      <Box>
        {fieldLabel("Confirm Password")}
        <TextField
          fullWidth name="confirm_password" type={showConfirm ? "text" : "password"}
          placeholder="Repeat your password" value={form.confirm_password} onChange={handleChange}
          error={!!errors.confirm_password} helperText={errors.confirm_password}
          slotProps={{
            htmlInput: { autoComplete: "new-password" },
            input: {
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton size="small" onClick={() => setShowConfirm((v) => !v)} edge="end">
                    {showConfirm ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                  </IconButton>
                </InputAdornment>
              ),
            },
          }}
        />
      </Box>
    </Box>,

    <Box key="university" sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
      <Box>
        {fieldLabel("University ID")}
        <TextField fullWidth name="university_id" placeholder="UNI-2024-001" value={form.university_id} onChange={handleChange} error={!!errors.university_id} helperText={errors.university_id} />
      </Box>
      <Box>
        {fieldLabel("University Name")}
        <TextField fullWidth name="university_name" placeholder="University of Technology" value={form.university_name} onChange={handleChange} error={!!errors.university_name} helperText={errors.university_name} />
      </Box>
    </Box>,
  ];

  if (success) {
    return (
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", width: "100%", minHeight: "100vh", flex: 1, bgcolor: "#f8fafc", p: 3 }}>
        <Box sx={{ textAlign: "center", maxWidth: 400 }}>
          <CheckCircleOutline sx={{ fontSize: 80, color: "#10b981", mb: 2 }} />
          <Typography variant="h5" fontWeight={800} color="#1e1b4b" mb={1}>Registration Successful!</Typography>
          <Typography color="text.secondary" mb={2.5}>
            Your account is pending verification by our team. Redirecting to login...
          </Typography>
          <CircularProgress size={20} sx={{ color: "#6366f1" }} />
        </Box>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        width: "100%",
        flex: 1,
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        py: 4,
        px: 3,
        backgroundImage:
          "radial-gradient(circle at 15% 15%, rgba(99,102,241,0.1) 0%, transparent 55%), radial-gradient(circle at 85% 85%, rgba(139,92,246,0.1) 0%, transparent 55%)",
        bgcolor: "#f8fafc",
      }}
    >
      <Box sx={{ width: "100%", maxWidth: 480 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 3, justifyContent: "center" }}>
          <Box sx={{ width: 42, height: 42, borderRadius: 2, background: "linear-gradient(135deg,#6366f1,#8b5cf6)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <HomeWork sx={{ color: "white", fontSize: 24 }} />
          </Box>
          <Typography variant="h6" fontWeight={800} color="#1e1b4b">HostelAxis</Typography>
        </Box>

        <Paper elevation={0} sx={{ p: { xs: 3, sm: 4 }, borderRadius: 3, border: "1px solid #e2e8f0" }}>
          <Typography variant="h5" fontWeight={800} color="#1e1b4b" mb={0.5}>Create Account</Typography>
          <Typography variant="body2" color="text.secondary" mb={3.5}>Join HostelAxis as a verified student</Typography>

          <Stepper activeStep={activeStep} alternativeLabel sx={{ mb: 4 }}>
            {steps.map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>

          {backendError && <Alert severity="error" sx={{ mb: 2.5, borderRadius: 2 }}>{backendError}</Alert>}

          {stepContent[activeStep]}

          <Box sx={{ display: "flex", gap: 2, mt: 3.5 }}>
            {activeStep > 0 && (
              <Button
                variant="outlined"
                onClick={handleBack}
                sx={{ flex: 1, py: 1.3, borderColor: "#e2e8f0", color: "#374151", "&:hover": { borderColor: "#6366f1", color: "#6366f1" } }}
                startIcon={<ArrowBack />}
              >
                Back
              </Button>
            )}
            {activeStep < steps.length - 1 ? (
              <Button
                variant="contained"
                onClick={handleNext}
                sx={{
                  flex: 1, py: 1.3,
                  background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
                  "&:hover": { background: "linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)" },
                  boxShadow: "0 4px 14px rgba(99,102,241,0.35)",
                }}
                endIcon={<ArrowForward />}
              >
                Next
              </Button>
            ) : (
              <Button
                variant="contained"
                onClick={handleSubmit}
                disabled={loading}
                sx={{
                  flex: 1, py: 1.3,
                  background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
                  "&:hover": { background: "linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)" },
                  boxShadow: "0 4px 14px rgba(99,102,241,0.35)",
                }}
              >
                {loading ? <CircularProgress size={20} color="inherit" /> : "Create Account"}
              </Button>
            )}
          </Box>

          <Typography variant="body2" color="text.secondary" textAlign="center" mt={3}>
            Already have an account?{" "}
            <RouterLink to="/login" style={{ color: "#6366f1", fontWeight: 700, textDecoration: "none" }}>
              Sign in
            </RouterLink>
          </Typography>
        </Paper>
      </Box>
    </Box>
  );
}
