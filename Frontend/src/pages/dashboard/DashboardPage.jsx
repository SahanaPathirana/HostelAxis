import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import {
  Box, Typography, Paper, Avatar, Chip, Divider, Button, CircularProgress,
} from "@mui/material";
import {
  Person, Email, Phone, School, Badge,
  VerifiedUser, HourglassEmpty, Cancel, AdminPanelSettings,
  KingBed, MeetingRoom, Receipt, ReportProblem,
} from "@mui/icons-material";
import { studentAPI } from "../../services/api";

const statusConfig = {
  Verified: {
    color: "success",
    icon: <VerifiedUser fontSize="small" />,
    message: "Your account is verified. You can browse and book accommodations.",
  },
  Pending: {
    color: "warning",
    icon: <HourglassEmpty fontSize="small" />,
    message: "Your account is under review. We'll notify you once it's verified.",
  },
  Rejected: {
    color: "error",
    icon: <Cancel fontSize="small" />,
    message: "Your verification was rejected. Please contact support for assistance.",
  },
};

function StatCard({ icon, label, value, accent = "#6366f1" }) {
  return (
    <Paper
      elevation={0}
      sx={{
        p: 2.5,
        borderRadius: 3,
        border: "1px solid #e2e8f0",
        display: "flex",
        alignItems: "center",
        gap: 2,
        bgcolor: "white",
        transition: "box-shadow 0.2s",
        "&:hover": { boxShadow: "0 4px 20px rgba(0,0,0,0.07)" },
      }}
    >
      <Box
        sx={{
          width: 46, height: 46, borderRadius: 2,
          bgcolor: `${accent}18`,
          display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
        }}
      >
        <Box sx={{ color: accent, display: "flex" }}>{icon}</Box>
      </Box>
      <Box sx={{ minWidth: 0 }}>
        <Typography variant="caption" color="text.secondary" fontWeight={600} textTransform="uppercase" letterSpacing={0.6} display="block">
          {label}
        </Typography>
        <Typography variant="body1" fontWeight={700} color="#1e1b4b" noWrap>
          {value || "—"}
        </Typography>
      </Box>
    </Paper>
  );
}

export default function DashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const isStudent = user?.role === "Student";
  const isAdmin = user?.role === "Admin";
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    if (isStudent) {
      studentAPI.getProfile().then(({ data }) => setProfile(data)).catch(() => {});
    }
  }, [isStudent]);

  const studentData = profile?.student ?? user?.student;
  const status = studentData?.verificationStatus;
  const statusCfg = statusConfig[status] ?? statusConfig.Pending;

  const initials =
    user?.fullName
      ?.split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2) || "U";

  const bedInfo = studentData?.bed;
  const payments = studentData?.payments ?? [];

  return (
    <Box>
      {/* Welcome Banner */}
      <Paper
        elevation={0}
        sx={{
          p: { xs: 3, md: 4 },
          borderRadius: 3,
          background: "linear-gradient(135deg, #1e1b4b 0%, #3730a3 50%, #6d28d9 100%)",
          mb: 3,
          display: "flex",
          alignItems: "center",
          gap: 3,
          flexWrap: "wrap",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Decorative blobs */}
        <Box sx={{ position: "absolute", top: -40, right: -40, width: 180, height: 180, borderRadius: "50%", bgcolor: "rgba(255,255,255,0.05)" }} />
        <Box sx={{ position: "absolute", bottom: -30, right: 120, width: 120, height: 120, borderRadius: "50%", bgcolor: "rgba(255,255,255,0.04)" }} />

        <Avatar
          sx={{
            width: 64, height: 64, fontSize: "1.4rem", fontWeight: 700, zIndex: 1,
            background: "rgba(255,255,255,0.2)",
            border: "2px solid rgba(255,255,255,0.3)",
          }}
        >
          {initials}
        </Avatar>
        <Box sx={{ flex: 1, zIndex: 1 }}>
          <Typography variant="h5" fontWeight={800} color="white">
            Welcome back, {user?.fullName?.split(" ")[0]}!
          </Typography>
          <Typography color="rgba(255,255,255,0.65)" variant="body2" mt={0.5}>
            {user?.email}
          </Typography>
        </Box>
        <Chip
          label={user?.role}
          size="small"
          sx={{
            bgcolor: "rgba(255,255,255,0.15)",
            color: "white",
            fontWeight: 700,
            border: "1px solid rgba(255,255,255,0.25)",
            zIndex: 1,
          }}
        />
      </Paper>

      {/* Stats Grid */}
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr", lg: "repeat(3, 1fr)" },
          gap: 2.5,
          mb: 3,
        }}
      >
        <StatCard icon={<Person />} label="Full Name" value={user?.fullName} accent="#6366f1" />
        <StatCard icon={<Email />} label="Email" value={user?.email} accent="#8b5cf6" />
        <StatCard icon={<Phone />} label="Phone" value={user?.phone || "Not set"} accent="#06b6d4" />
        {isStudent && (
          <>
            <StatCard icon={<School />} label="University" value={studentData?.universityName || user?.student?.universityName} accent="#f59e0b" />
            <StatCard icon={<Badge />} label="University ID" value={studentData?.universityId || user?.student?.universityId} accent="#10b981" />
            <StatCard icon={<MeetingRoom />} label="Room" value={bedInfo?.room?.roomNumber ? `Room ${bedInfo.room.roomNumber}` : "Not assigned"} accent="#6366f1" />
            <StatCard icon={<KingBed />} label="Bed" value={bedInfo ? `${bedInfo.bedNumber}` : "Not assigned"} accent="#8b5cf6" />
            <StatCard icon={<Receipt />} label="Payments" value={payments.length > 0 ? `${payments.length} recorded` : "None"} accent="#10b981" />
          </>
        )}
        {isAdmin && (
          <StatCard icon={<AdminPanelSettings />} label="Access Level" value="Administrator" accent="#ef4444" />
        )}
      </Box>

      {/* Verification Status (students only) */}
      {isStudent && status && (
        <Paper elevation={0} sx={{ p: 3.5, borderRadius: 3, border: "1px solid #e2e8f0", bgcolor: "white", mb: 3 }}>
          <Typography variant="subtitle1" fontWeight={700} color="#1e1b4b" mb={2}>
            Verification Status
          </Typography>
          <Divider sx={{ mb: 2.5 }} />
          <Box sx={{ display: "flex", alignItems: "flex-start", gap: 2, flexWrap: "wrap" }}>
            <Chip
              icon={statusCfg.icon}
              label={status}
              color={statusCfg.color}
              sx={{ fontWeight: 700, px: 0.5 }}
            />
            <Typography variant="body2" color="text.secondary" sx={{ flex: 1, pt: 0.3 }}>
              {statusCfg.message}
            </Typography>
          </Box>
        </Paper>
      )}

      {/* Recent Payments (students only) */}
      {isStudent && payments.length > 0 && (
        <Paper elevation={0} sx={{ p: 3.5, borderRadius: 3, border: "1px solid #e2e8f0", bgcolor: "white", mb: 3 }}>
          <Typography variant="subtitle1" fontWeight={700} color="#1e1b4b" mb={2}>
            Recent Payments
          </Typography>
          <Divider sx={{ mb: 2 }} />
          {payments.slice(0, 5).map((p) => (
            <Box key={p.id} sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", py: 1, borderBottom: "1px solid #f1f5f9" }}>
              <Box>
                <Typography variant="body2" fontWeight={600}>{p.feePlan?.name}</Typography>
                <Typography variant="caption" color="text.secondary">{new Date(p.paidAt).toLocaleDateString()}</Typography>
              </Box>
              <Typography variant="body2" fontWeight={700} color="#10b981">LKR {p.amount?.toLocaleString()}</Typography>
            </Box>
          ))}
        </Paper>
      )}

      {/* Quick Actions (students only) */}
      {isStudent && (
        <Paper elevation={0} sx={{ p: 3, borderRadius: 3, border: "1px solid #e2e8f0", bgcolor: "white" }}>
          <Typography variant="subtitle1" fontWeight={700} color="#1e1b4b" mb={2}>Quick Actions</Typography>
          <Divider sx={{ mb: 2 }} />
          <Button
            variant="outlined"
            startIcon={<ReportProblem />}
            onClick={() => navigate("/complaints")}
            sx={{ textTransform: "none", borderColor: "#6366f1", color: "#6366f1", "&:hover": { bgcolor: "rgba(99,102,241,0.05)" } }}
          >
            Submit a Complaint
          </Button>
        </Paper>
      )}
    </Box>
  );
}
