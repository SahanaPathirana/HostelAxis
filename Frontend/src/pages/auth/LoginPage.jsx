import { useState } from "react";
import { useNavigate, useLocation, Link as RouterLink } from "react-router-dom";
import {
  Box, Typography, TextField, Button, IconButton,
  InputAdornment, Alert, CircularProgress, Divider,
} from "@mui/material";
import { Visibility, VisibilityOff, HomeWork, CheckCircle } from "@mui/icons-material";
import api from "../../services/api";
import { useAuth } from "../../context/AuthContext";

const features = [
  "Verified university accommodation",
  "Smart matching for students",
  "Secure & hassle-free process",
];

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || "/dashboard";

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) { setError("Please fill in all fields."); return; }
    setLoading(true);
    setError("");
    try {
      const { data } = await api.post("/auth/login", { email, password });
      login(data.token, data.user);
      navigate(from, { replace: true });
    } catch (err) {
      setError(err.response?.data?.error || "Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ display: "flex", width: "100%", minHeight: "100vh", flex: 1 }}>
      {/* ── Left branding panel ── */}
      <Box
        sx={{
          display: { xs: "none", md: "flex" },
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "flex-start",
          flex: "0 0 45%",
          background: "linear-gradient(150deg, #1e1b4b 0%, #3730a3 45%, #6d28d9 100%)",
          px: 8,
          py: 6,
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Decorative blobs */}
        <Box sx={{ position: "absolute", top: -100, right: -100, width: 360, height: 360, borderRadius: "50%", background: "rgba(255,255,255,0.04)" }} />
        <Box sx={{ position: "absolute", bottom: -80, left: -80, width: 280, height: 280, borderRadius: "50%", background: "rgba(255,255,255,0.04)" }} />
        <Box sx={{ position: "absolute", top: "40%", right: "10%", width: 160, height: 160, borderRadius: "50%", background: "rgba(255,255,255,0.03)" }} />

        {/* Logo */}
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 7, zIndex: 1 }}>
          <Box sx={{ width: 50, height: 50, borderRadius: 2.5, bgcolor: "rgba(255,255,255,0.15)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <HomeWork sx={{ color: "white", fontSize: 28 }} />
          </Box>
          <Typography variant="h5" fontWeight={800} color="white" letterSpacing={-0.5}>
            HostelAxis
          </Typography>
        </Box>

        {/* Headline */}
        <Typography variant="h3" fontWeight={800} color="white" lineHeight={1.15} mb={2} sx={{ position: "relative", zIndex: 1 }}>
          Find Your Perfect<br />
          <Box component="span" sx={{ color: "#a5b4fc" }}>Student Home</Box>
        </Typography>
        <Typography color="rgba(255,255,255,0.6)" mb={5} maxWidth={320} sx={{ position: "relative", zIndex: 1, lineHeight: 1.7 }}>
          The smart platform connecting students with verified hostel accommodations near their university.
        </Typography>

        {/* Features */}
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5, position: "relative", zIndex: 1 }}>
          {features.map((f) => (
            <Box key={f} sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
              <CheckCircle sx={{ color: "#a5b4fc", fontSize: 20 }} />
              <Typography color="rgba(255,255,255,0.85)" variant="body2" fontWeight={500}>{f}</Typography>
            </Box>
          ))}
        </Box>
      </Box>

      {/* ── Right form panel ── */}
      <Box
        sx={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          bgcolor: "#f8fafc",
          px: { xs: 3, sm: 6 },
          py: 4,
        }}
      >
        <Box sx={{ width: "100%", maxWidth: 420 }}>
          {/* Mobile logo */}
          <Box sx={{ display: { xs: "flex", md: "none" }, alignItems: "center", gap: 1, mb: 5, justifyContent: "center" }}>
            <Box sx={{ width: 40, height: 40, borderRadius: 2, background: "linear-gradient(135deg,#6366f1,#8b5cf6)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <HomeWork sx={{ color: "white", fontSize: 22 }} />
            </Box>
            <Typography variant="h6" fontWeight={800} color="#1e1b4b">HostelAxis</Typography>
          </Box>

          <Typography variant="h4" fontWeight={800} color="#1e1b4b" mb={0.5}>Welcome back</Typography>
          <Typography variant="body2" color="text.secondary" mb={3.5}>Sign in to your HostelAxis account</Typography>

          {error && <Alert severity="error" sx={{ mb: 2.5, borderRadius: 2 }}>{error}</Alert>}

          <Box component="form" onSubmit={handleSubmit} noValidate>
            <Typography variant="caption" fontWeight={600} color="#374151" mb={0.5} display="block">
              Email Address
            </Typography>
            <TextField
              fullWidth
              type="email"
              placeholder="you@university.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              sx={{ mb: 2.5 }}
              slotProps={{ htmlInput: { autoComplete: "email" } }}
            />

            <Typography variant="caption" fontWeight={600} color="#374151" mb={0.5} display="block">
              Password
            </Typography>
            <TextField
              fullWidth
              type={showPassword ? "text" : "password"}
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              sx={{ mb: 3 }}
              slotProps={{
                htmlInput: { autoComplete: "current-password" },
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

            <Button
              type="submit"
              fullWidth
              variant="contained"
              size="large"
              disabled={loading}
              sx={{
                py: 1.5, fontSize: "1rem", mb: 3,
                background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
                "&:hover": { background: "linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)" },
                boxShadow: "0 4px 14px rgba(99,102,241,0.4)",
              }}
            >
              {loading ? <CircularProgress size={22} color="inherit" /> : "Sign In"}
            </Button>

            <Divider sx={{ mb: 2.5 }}>
              <Typography variant="caption" color="text.secondary">New to HostelAxis?</Typography>
            </Divider>

            <Button
              component={RouterLink}
              to="/register"
              fullWidth
              variant="outlined"
              size="large"
              sx={{
                py: 1.5,
                borderColor: "#e2e8f0",
                color: "#374151",
                "&:hover": { borderColor: "#6366f1", color: "#6366f1", bgcolor: "rgba(99,102,241,0.04)" },
              }}
            >
              Create Student Account
            </Button>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
