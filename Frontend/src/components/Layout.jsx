import { useState } from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import {
  Box, AppBar, Toolbar, Typography, IconButton, Avatar,
  Menu, MenuItem, Divider, ListItemIcon, Tooltip, Drawer,
  List, ListItem, ListItemButton, ListItemText,
} from "@mui/material";
import {
  HomeWork, Dashboard, Logout, Person, Menu as MenuIcon,
  AdminPanelSettings, ReportProblem,
} from "@mui/icons-material";
import { useAuth } from "../context/AuthContext";

const DRAWER_WIDTH = 240;

const studentNavItems = [
  { label: "Dashboard", icon: <Dashboard fontSize="small" />, path: "/dashboard" },
  { label: "My Complaints", icon: <ReportProblem fontSize="small" />, path: "/complaints" },
];

const adminNavItems = [
  { label: "Admin Panel", icon: <AdminPanelSettings fontSize="small" />, path: "/admin" },
];

const sidebarGradient = "linear-gradient(180deg, #1e1b4b 0%, #312e81 100%)";

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [anchorEl, setAnchorEl] = useState(null);
  const [mobileOpen, setMobileOpen] = useState(false);

  const navItems = user?.role === "Admin" ? adminNavItems : studentNavItems;

  const initials =
    user?.fullName
      ?.split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2) || "U";

  const handleLogout = () => {
    setAnchorEl(null);
    logout();
    navigate("/login", { replace: true });
  };

  const SidebarContent = () => (
    <Box sx={{ display: "flex", flexDirection: "column", height: "100%" }}>
      {/* Logo */}
      <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, px: 2.5, py: 3 }}>
        <Box
          sx={{
            width: 38, height: 38, borderRadius: 2,
            bgcolor: "rgba(255,255,255,0.15)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}
        >
          <HomeWork sx={{ color: "white", fontSize: 22 }} />
        </Box>
        <Typography fontWeight={800} color="white" variant="h6" letterSpacing={-0.5}>
          HostelAxis
        </Typography>
      </Box>

      <Divider sx={{ borderColor: "rgba(255,255,255,0.1)", mx: 2 }} />

      {/* Navigation */}
      <List sx={{ flex: 1, pt: 2, px: 1 }}>
        {navItems.map((item) => {
          const active = location.pathname === item.path;
          return (
            <ListItem key={item.path} disablePadding sx={{ mb: 0.5 }}>
              <ListItemButton
                onClick={() => { navigate(item.path); setMobileOpen(false); }}
                sx={{
                  borderRadius: 2, px: 2,
                  bgcolor: active ? "rgba(255,255,255,0.15)" : "transparent",
                  "&:hover": { bgcolor: "rgba(255,255,255,0.1)" },
                  transition: "background 0.15s",
                }}
              >
                <ListItemIcon sx={{ color: active ? "white" : "rgba(255,255,255,0.55)", minWidth: 36 }}>
                  {item.icon}
                </ListItemIcon>
                <ListItemText
                  primary={item.label}
                  slotProps={{
                    primary: {
                      variant: "body2",
                      fontWeight: active ? 700 : 500,
                      color: active ? "white" : "rgba(255,255,255,0.65)",
                    },
                  }}
                />
              </ListItemButton>
            </ListItem>
          );
        })}
      </List>

      <Divider sx={{ borderColor: "rgba(255,255,255,0.1)", mx: 2 }} />

      {/* User info */}
      <Box sx={{ px: 2.5, py: 2.5, display: "flex", alignItems: "center", gap: 1.5 }}>
        <Avatar
          sx={{
            width: 34, height: 34,
            bgcolor: "rgba(255,255,255,0.2)",
            fontSize: "0.8rem", fontWeight: 700,
          }}
        >
          {initials}
        </Avatar>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography variant="caption" color="white" fontWeight={600} noWrap display="block">
            {user?.fullName}
          </Typography>
          <Typography variant="caption" color="rgba(255,255,255,0.5)" noWrap display="block" sx={{ fontSize: "0.65rem" }}>
            {user?.role}
          </Typography>
        </Box>
      </Box>
    </Box>
  );

  return (
    <Box sx={{ display: "flex", minHeight: "100vh" }}>
      {/* Desktop permanent sidebar */}
      <Box
        sx={{
          width: DRAWER_WIDTH,
          flexShrink: 0,
          display: { xs: "none", md: "flex" },
          flexDirection: "column",
          background: sidebarGradient,
        }}
      >
        <SidebarContent />
      </Box>

      {/* Mobile temporary drawer */}
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}
        ModalProps={{ keepMounted: true }}
        sx={{
          display: { xs: "block", md: "none" },
          "& .MuiDrawer-paper": {
            width: DRAWER_WIDTH,
            background: sidebarGradient,
            border: "none",
          },
        }}
      >
        <SidebarContent />
      </Drawer>

      {/* Main content */}
      <Box sx={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0, bgcolor: "#f1f5f9" }}>
        {/* Top AppBar */}
        <AppBar
          position="static"
          elevation={0}
          sx={{ bgcolor: "white", borderBottom: "1px solid #e2e8f0" }}
        >
          <Toolbar sx={{ gap: 2, minHeight: { xs: 56, sm: 64 } }}>
            <IconButton
              size="small"
              onClick={() => setMobileOpen((v) => !v)}
              sx={{ color: "#64748b", display: { xs: "inline-flex", md: "none" } }}
            >
              <MenuIcon />
            </IconButton>
            <Typography variant="subtitle1" fontWeight={700} color="#1e1b4b" sx={{ flex: 1 }}>
              {navItems.find((n) => n.path === location.pathname)?.label || "Dashboard"}
            </Typography>
            <Tooltip title="Account">
              <IconButton size="small" onClick={(e) => setAnchorEl(e.currentTarget)} sx={{ p: 0 }}>
                <Avatar
                  sx={{
                    width: 36, height: 36,
                    background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
                    fontSize: "0.85rem", fontWeight: 700,
                  }}
                >
                  {initials}
                </Avatar>
              </IconButton>
            </Tooltip>

            <Menu
              anchorEl={anchorEl}
              open={!!anchorEl}
              onClose={() => setAnchorEl(null)}
              transformOrigin={{ horizontal: "right", vertical: "top" }}
              anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
              slotProps={{
                paper: {
                  elevation: 4,
                  sx: { mt: 1, borderRadius: 2, minWidth: 210, border: "1px solid #e2e8f0" },
                },
              }}
            >
              <Box sx={{ px: 2.5, py: 1.5 }}>
                <Typography variant="subtitle2" fontWeight={700} color="#1e1b4b">
                  {user?.fullName}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {user?.email}
                </Typography>
              </Box>
              <Divider />
              <MenuItem onClick={() => setAnchorEl(null)} sx={{ py: 1.2 }}>
                <ListItemIcon><Person fontSize="small" /></ListItemIcon>
                Profile
              </MenuItem>
              <Divider />
              <MenuItem onClick={handleLogout} sx={{ py: 1.2, color: "#ef4444" }}>
                <ListItemIcon><Logout fontSize="small" sx={{ color: "#ef4444" }} /></ListItemIcon>
                Sign Out
              </MenuItem>
            </Menu>
          </Toolbar>
        </AppBar>

        {/* Page content */}
        <Box sx={{ flex: 1, p: { xs: 2.5, md: 4 }, overflowY: "auto" }}>
          <Outlet />
        </Box>
      </Box>
    </Box>
  );
}
