import { useState, useEffect } from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import {
  Box, AppBar, Toolbar, Typography, IconButton, Avatar,
  Menu, MenuItem, Divider, ListItemIcon, Tooltip, Drawer,
  List, ListItem, ListItemButton, ListItemText,
} from "@mui/material";
import {
  HomeWork, Dashboard, Logout, Person, Menu as MenuIcon,
  ReportProblem, Engineering,
} from "@mui/icons-material";
import { useAuth } from "../context/AuthContext";
import { studentAPI } from "../services/api";

const DRAWER_WIDTH = 240;

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [anchorEl, setAnchorEl] = useState(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isVerified, setIsVerified] = useState(false);

  // Admin should NEVER land inside the Layout — redirect immediately
  useEffect(() => {
    if (user?.role === "Admin") {
      navigate("/admin", { replace: true });
    }
  }, [user, navigate]);

  // Fetch verification status for students so we can conditionally show My Complaints
  useEffect(() => {
    if (user?.role === "Student") {
      studentAPI.getProfile()
        .then((r) => {
          const status = r.data?.student?.verificationStatus;
          setIsVerified(status === "Verified");
        })
        .catch(() => setIsVerified(false));
    }
  }, [user]);

  if (user?.role === "Admin") return null;

  const initials = user?.fullName?.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2) || "U";

  const handleLogout = () => {
    setAnchorEl(null);
    logout();
    navigate("/login", { replace: true });
  };

  // Build nav items — "My Complaints" only shown when student is verified
  const navItems = user?.role === "Student"
    ? [
        { label: "Dashboard", icon: <Dashboard fontSize="small" />, path: "/dashboard" },
        // Only show Complaints link to verified students
        ...(isVerified ? [{ label: "My Complaints", icon: <ReportProblem fontSize="small" />, path: "/complaints" }] : []),
      ]
    : user?.role === "Staff"
    ? [{ label: "Staff Dashboard", icon: <Engineering fontSize="small" />, path: "/staff" }]
    : [];

  const SidebarContent = () => (
    <Box sx={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, px: 2.5, py: 3 }}>
        <HomeWork sx={{ color: "white" }} />
        <Typography fontWeight={800} color="white" variant="h6">HostelAxis</Typography>
      </Box>
      <Divider sx={{ borderColor: "rgba(255,255,255,0.1)", mx: 2 }} />
      <List sx={{ flex: 1, pt: 2, px: 1 }}>
        {navItems.map((item) => {
          const active = location.pathname === item.path;
          return (
            <ListItem key={item.path} disablePadding sx={{ mb: 0.5 }}>
              <ListItemButton
                onClick={() => { navigate(item.path); setMobileOpen(false); }}
                sx={{ borderRadius: 2, bgcolor: active ? "rgba(255,255,255,0.18)" : "transparent" }}>
                <ListItemIcon sx={{ color: "white", minWidth: 36 }}>{item.icon}</ListItemIcon>
                <ListItemText
                  primary={item.label}
                  primaryTypographyProps={{ fontSize: 14, fontWeight: active ? 700 : 500, color: "white" }} />
              </ListItemButton>
            </ListItem>
          );
        })}
      </List>
    </Box>
  );

  return (
    <Box sx={{ display: "flex", minHeight: "100vh" }}>
      {/* Desktop sidebar */}
      <Box sx={{ width: DRAWER_WIDTH, display: { xs: "none", md: "flex" }, background: "linear-gradient(180deg, #1e1b4b 0%, #312e81 100%)" }}>
        <SidebarContent />
      </Box>
      {/* Mobile drawer */}
      <Drawer variant="temporary" open={mobileOpen} onClose={() => setMobileOpen(false)} ModalProps={{ keepMounted: true }}
        sx={{ display: { xs: "block", md: "none" }, "& .MuiDrawer-paper": { width: DRAWER_WIDTH, background: "linear-gradient(180deg, #1e1b4b 0%, #312e81 100%)" } }}>
        <SidebarContent />
      </Drawer>

      <Box sx={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0, bgcolor: "#f1f5f9" }}>
        <AppBar position="static" elevation={0} sx={{ bgcolor: "white", borderBottom: "1px solid #e2e8f0" }}>
          <Toolbar sx={{ gap: 2 }}>
            <IconButton size="small" onClick={() => setMobileOpen((v) => !v)} sx={{ display: { xs: "inline-flex", md: "none" } }}><MenuIcon /></IconButton>
            <Typography variant="subtitle1" fontWeight={700} sx={{ flex: 1 }}>
              {navItems.find((n) => n.path === location.pathname)?.label || "Dashboard"}
            </Typography>
            <Tooltip title="Account">
              <IconButton size="small" onClick={(e) => setAnchorEl(e.currentTarget)}>
                <Avatar sx={{ width: 34, height: 34 }}>{initials}</Avatar>
              </IconButton>
            </Tooltip>
            <Menu anchorEl={anchorEl} open={!!anchorEl} onClose={() => setAnchorEl(null)}>
              <MenuItem onClick={() => setAnchorEl(null)}><ListItemIcon><Person fontSize="small" /></ListItemIcon>{user?.fullName}</MenuItem>
              <MenuItem onClick={handleLogout}><ListItemIcon><Logout fontSize="small" /></ListItemIcon>Sign Out</MenuItem>
            </Menu>
          </Toolbar>
        </AppBar>
        <Box sx={{ flex: 1, p: { xs: 2, md: 3 }, overflowY: "auto" }}><Outlet /></Box>
      </Box>
    </Box>
  );
}
