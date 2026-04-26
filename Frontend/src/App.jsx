import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider, createTheme, CssBaseline, Box, CircularProgress } from "@mui/material";
import { AuthProvider, useAuth } from "./context/AuthContext";
import Layout from "./components/Layout";
import ProtectedRoute from "./components/ProtectedRoute";
import LoginPage from "./pages/auth/LoginPage";
import RegisterPage from "./pages/auth/RegisterPage";
import DashboardPage from "./pages/dashboard/DashboardPage";
import AdminDashboardPage from "./pages/admin/AdminDashboardPage";
import ComplaintsPage from "./pages/student/ComplaintsPage";
import RoomMapPage from "./pages/student/RoomMapPage";
import StaffDashboardPage from "./pages/staff/StaffDashboardPage";

const theme = createTheme({
  palette: { primary: { main: "#6366f1" }, secondary: { main: "#8b5cf6" }, background: { default: "#f1f5f9", paper: "#ffffff" } },
  shape: { borderRadius: 10 },
});

function Busy() { return <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100vh" }}><CircularProgress sx={{ color: "#6366f1" }} /></Box>; }

function HomeRedirect() {
  const { user, loading } = useAuth();
  if (loading) return <Busy />;
  if (!user) return <Navigate to="/login" replace />;
  if (user.role === "Admin") return <Navigate to="/admin" replace />;
  if (user.role === "Staff") return <Navigate to="/staff" replace />;
  return <Navigate to="/dashboard" replace />;
}

function RoleRoute({ roles, children, fallback = "/dashboard" }) {
  const { user, loading } = useAuth();
  if (loading) return <Busy />;
  if (!user) return <Navigate to="/login" replace />;
  if (!roles.includes(user.role)) return <Navigate to={fallback} replace />;
  return children;
}

export default function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />

            {/* Admin: standalone full-page, no sidebar */}
            <Route path="/admin" element={<RoleRoute roles={["Admin"]} fallback="/login"><AdminDashboardPage /></RoleRoute>} />

            {/* Student + Staff: inside Layout with sidebar */}
            <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
              <Route index element={<HomeRedirect />} />
              <Route path="dashboard" element={<RoleRoute roles={["Student"]}><DashboardPage /></RoleRoute>} />
              <Route path="complaints" element={<RoleRoute roles={["Student"]}><ComplaintsPage /></RoleRoute>} />
              <Route path="room-map" element={<RoleRoute roles={["Student"]}><RoomMapPage /></RoleRoute>} />
              <Route path="staff" element={<RoleRoute roles={["Staff"]}><StaffDashboardPage /></RoleRoute>} />
            </Route>

            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </ThemeProvider>
  );
}
