import { useState } from "react";
import { useNavigate, useLocation, Link as RouterLink } from "react-router-dom";
import {
  Box, Typography, TextField, Button, IconButton,
  InputAdornment, Alert, CircularProgress, Divider,
} from "@mui/material";
import { Visibility, VisibilityOff, HomeWork, CheckCircle } from "@mui/icons-material";
import api from "../../services/api";
import { useAuth } from "../../context/AuthContext";

const features = ["Verified university accommodation", "Smart matching for students", "Secure & hassle-free process"];

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) { setError("Please fill in all fields."); return; }
    setLoading(true); setError("");
    try {
      const { data } = await api.post("/auth/login", { email, password });
      login(data.token, data.user);
      const fallbackByRole = data.user.role === "Admin" ? "/admin" : data.user.role === "Staff" ? "/staff" : "/dashboard";
      const from = location.state?.from?.pathname;
      navigate(from && from !== "/" ? from : fallbackByRole, { replace: true });
    } catch (err) {
      setError(err.response?.data?.error || "Login failed. Please try again.");
    } finally { setLoading(false); }
  };

  return (
    <Box sx={{ display: "flex", width: "100%", minHeight: "100vh", flex: 1 }}>
      <Box sx={{ display: { xs: "none", md: "flex" }, flexDirection: "column", justifyContent: "center", alignItems: "flex-start", flex: "0 0 45%", background: "linear-gradient(150deg, #1e1b4b 0%, #3730a3 45%, #6d28d9 100%)", px: 8, py: 6, position: "relative", overflow: "hidden" }}>
        <Box sx={{ position: "absolute", top: -100, right: -100, width: 360, height: 360, borderRadius: "50%", background: "rgba(255,255,255,0.04)" }} />
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 7, zIndex: 1 }}><Box sx={{ width: 50, height: 50, borderRadius: 2.5, bgcolor: "rgba(255,255,255,0.15)", display: "flex", alignItems: "center", justifyContent: "center" }}><HomeWork sx={{ color: "white", fontSize: 28 }} /></Box><Typography variant="h5" fontWeight={800} color="white">HostelAxis</Typography></Box>
        <Typography variant="h3" fontWeight={800} color="white" lineHeight={1.15} mb={2}>Find Your Perfect Student Home</Typography>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>{features.map((f) => <Box key={f} sx={{ display: "flex", alignItems: "center", gap: 1.5 }}><CheckCircle sx={{ color: "#a5b4fc", fontSize: 20 }} /><Typography color="rgba(255,255,255,0.85)" variant="body2">{f}</Typography></Box>)}</Box>
      </Box>

      <Box sx={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", bgcolor: "#f8fafc", px: { xs: 3, sm: 6 }, py: 4 }}>
        <Box sx={{ width: "100%", maxWidth: 420 }}>
          <Typography variant="h4" fontWeight={800} color="#1e1b4b" mb={0.5}>Welcome back</Typography>
          <Typography variant="body2" color="text.secondary" mb={3.5}>Sign in to your HostelAxis account</Typography>
          {error && <Alert severity="error" sx={{ mb: 2.5 }}>{error}</Alert>}
          <Box component="form" onSubmit={handleSubmit} noValidate>
            <TextField fullWidth type="email" placeholder="you@university.com" value={email} onChange={(e) => setEmail(e.target.value)} sx={{ mb: 2.5 }} />
            <TextField fullWidth type={showPassword ? "text" : "password"} placeholder="Enter your password" value={password} onChange={(e) => setPassword(e.target.value)} sx={{ mb: 3 }} InputProps={{ endAdornment: <InputAdornment position="end"><IconButton size="small" onClick={() => setShowPassword((v) => !v)}>{showPassword ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}</IconButton></InputAdornment> }} />
            <Button type="submit" fullWidth variant="contained" size="large" disabled={loading} sx={{ py: 1.5, mb: 1.5 }}>{loading ? <CircularProgress size={22} color="inherit" /> : "Sign In"}</Button>
            <Button fullWidth variant="outlined" size="small" onClick={() => { setEmail("admin@hostelaxis.com"); setPassword("admin123"); }} sx={{ mb: 2, textTransform: "none", fontSize: 12, borderStyle: "dashed", color: "#6366f1", borderColor: "#6366f1" }}>
              🎬 Quick Demo — Fill Admin Credentials
            </Button>
            <Divider sx={{ mb: 2.5 }}><Typography variant="caption" color="text.secondary">New to HostelAxis?</Typography></Divider>
            <Button component={RouterLink} to="/register" fullWidth variant="outlined" size="large" sx={{ py: 1.5 }}>Create Student Account</Button>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
