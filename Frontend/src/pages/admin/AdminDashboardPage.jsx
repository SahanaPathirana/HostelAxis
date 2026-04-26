import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Alert, Avatar, Badge, Box, Button, Card, CardContent, Chip,
  Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle,
  Divider, IconButton, LinearProgress, Menu, MenuItem,
  Paper, Step, StepLabel, Stepper, Tab, Tabs, Table, TableBody, TableCell, TableHead,
  TableRow, TextField, Tooltip, Typography,
} from "@mui/material";
import {
  Notifications, Logout, Payments as PaymentsIcon, MapOutlined, ListAlt, Send, Chat,
  Bed as BedIcon, ReportProblem, PlayArrow, WhatsApp,
} from "@mui/icons-material";
import { adminAPI } from "../../services/api";
import { useAuth } from "../../context/AuthContext";

const STAFF_TYPES = ["Cleaning", "Maintenance", "Electricity", "Water Supply", "Repair"];
const tabList = [
  "Verification", "Rooms", "Bed Assignment", "Fee Plans",
  "Payments", "Staff", "Complaints", "Visitors", "Notices", "Requests",
];
const TAB_BED = 2;
const TAB_PAYMENTS = 4;
const TAB_COMPLAINTS = 6;
const TAB_REQUESTS = 9;

// ─── BLOCK CONFIG ─────────────────────────────────────────────────────────────
const BLOCK_FLOORS = { B1: [1, 2, 3, 4, 5], B2: [1, 2, 3, 4, 5], B3: [1, 2, 3, 4], B4: [1, 2, 3], B5: [1] };
const ALL_BLOCKS = ["B1", "B2", "B3", "B4", "B5"];
// Base room number for each block (first room number in that block)
const BLOCK_ROOM_BASE = { B1: 1, B2: 51, B3: 101, B4: 141, B5: 171 };
// Get the label for a room slot: R(base + (floor-1)*10 + slotIndex)
function slotLabel(block, floor, slotIndex) {
  return `R${BLOCK_ROOM_BASE[block] + (floor - 1) * 10 + slotIndex}`;
}

function loadErr(err) {
  return err?.response?.data?.error || "Action failed";
}

// ─── CONFIRM DIALOG ───────────────────────────────────────────────────────────
function ConfirmDialog({ open, title, message, onConfirm, onCancel }) {
  return (
    <Dialog open={open} onClose={onCancel} maxWidth="xs" fullWidth>
      <DialogTitle>{title}</DialogTitle>
      <DialogContent><DialogContentText>{message}</DialogContentText></DialogContent>
      <DialogActions>
        <Button onClick={onCancel}>Cancel</Button>
        <Button variant="contained" color="error" onClick={onConfirm}>Delete</Button>
      </DialogActions>
    </Dialog>
  );
}

// ─── NOTIFICATION BELL ────────────────────────────────────────────────────────
function NotificationBell({ onGoToPayments, onGoToBed, onGoToComplaints, onPaymentAutoFill }) {
  const [notifications, setNotifications] = useState([]);
  const [anchor, setAnchor] = useState(null);

  const load = async () => {
    try { const { data } = await adminAPI.getNotifications(); setNotifications(data.notifications || []); } catch { }
  };
  useEffect(() => { load(); const t = setInterval(load, 20000); return () => clearInterval(t); }, []);

  const unread = notifications.filter((n) => !n.read).length;

  const markRead = async (n) => {
    if (!n.read) { try { await adminAPI.markNotificationRead(n.id); load(); } catch { } }
    setAnchor(null);
    if (n.type === "Payment") {
      if (n.metadata) { try { const m = JSON.parse(n.metadata); if (m.studentId) onPaymentAutoFill(m.studentId); } catch { } }
      onGoToPayments();
    } else if (n.type === "General" && (n.title?.toLowerCase().includes("bed") || n.title?.toLowerCase().includes("transfer"))) {
      onGoToBed();
    } else if (n.type === "Complaint") {
      onGoToComplaints();
    }
  };

  const markAll = async () => {
    await Promise.all(notifications.filter((n) => !n.read).map((n) => adminAPI.markNotificationRead(n.id).catch(() => { })));
    load();
  };

  const chipMeta = (n) => {
    if (n.type === "Payment") return { label: "→ Payments", icon: <PaymentsIcon sx={{ fontSize: 11 }} /> };
    if (n.type === "General" && (n.title?.toLowerCase().includes("bed") || n.title?.toLowerCase().includes("transfer"))) return { label: "→ Beds", icon: <BedIcon sx={{ fontSize: 11 }} /> };
    if (n.type === "Complaint") return { label: "→ Complaints", icon: <ReportProblem sx={{ fontSize: 11 }} /> };
    return null;
  };

  return (
    <>
      <IconButton onClick={(e) => { setAnchor(e.currentTarget); load(); }} sx={{ color: "white" }}>
        <Badge badgeContent={unread} color="error"><Notifications /></Badge>
      </IconButton>
      <Menu anchorEl={anchor} open={!!anchor} onClose={() => setAnchor(null)}
        PaperProps={{ sx: { width: 360, maxHeight: 480, borderRadius: 2, overflow: "hidden" } }}>
        <Box sx={{ px: 2, py: 1.5, display: "flex", justifyContent: "space-between", alignItems: "center", bgcolor: "#f8fafc" }}>
          <Typography fontWeight={700} variant="subtitle2">Notifications {unread > 0 && `(${unread} new)`}</Typography>
          {unread > 0 && <Button size="small" onClick={markAll} sx={{ textTransform: "none", fontSize: 12 }}>Mark all read</Button>}
        </Box>
        <Divider />
        <Box sx={{ maxHeight: 400, overflowY: "auto" }}>
          {notifications.length === 0 && <Box sx={{ py: 4, textAlign: "center" }}><Typography variant="body2" color="text.secondary">No notifications yet</Typography></Box>}
          {notifications.map((n) => {
            const cm = chipMeta(n);
            return (
              <Box key={n.id} onClick={() => markRead(n)} sx={{
                px: 2, py: 1.5, cursor: "pointer",
                borderLeft: n.read ? "3px solid transparent" : "3px solid #6366f1",
                bgcolor: n.read ? "transparent" : "rgba(99,102,241,0.04)",
                "&:hover": { bgcolor: "rgba(0,0,0,0.03)" }, borderBottom: "1px solid #f1f5f9",
              }}>
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <Typography variant="body2" fontWeight={n.read ? 400 : 700} sx={{ flex: 1 }}>{n.title}</Typography>
                  {cm && <Chip icon={cm.icon} label={cm.label} size="small" color="primary" variant="outlined" sx={{ fontSize: 10, height: 18, ml: 1 }} />}
                </Box>
                <Typography variant="caption" color="text.secondary" display="block">{n.message}</Typography>
                <Typography variant="caption" color="text.disabled">{new Date(n.createdAt).toLocaleString()}</Typography>
              </Box>
            );
          })}
        </Box>
      </Menu>
    </>
  );
}

// ─── BED VISUAL BOX ──────────────────────────────────────────────────────────
const ROOM_COLORS = { occupied: "#64748b", occupiedText: "#ffffff", free: "#e2e8f0", freeText: "#374151", bunkFrame: "#94a3b8" };

// A single half of a bunk bed (Top or Bottom) — independently clickable.
function BunkHalf({ bed, position, onClick, readOnly }) {
  const occupied = !!bed.studentId;
  const clickable = !occupied && !readOnly && onClick;
  const isTop = position === "Top";
  const bgH = occupied ? ROOM_COLORS.occupied : ROOM_COLORS.free;
  const textColH = occupied ? ROOM_COLORS.occupiedText : ROOM_COLORS.freeText;

  return (
    <Tooltip title={occupied
      ? `${bed.bedNumber} ${position} — Occupied (${bed.student?.user?.fullName || ""})`
      : `${bed.bedNumber} ${position} — click to assign`} arrow>
      <Box
        onClick={() => clickable && onClick({ ...bed, bunkPosition: position })}
        sx={{
          flex: 1, display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center",
          bgcolor: bgH, cursor: clickable ? "pointer" : "default",
          transition: "background .12s",
          ...(isTop ? { borderBottom: `1.5px dashed ${ROOM_COLORS.bunkFrame}`, borderRadius: "6px 6px 0 0" } : { borderRadius: "0 0 6px 6px" }),
          "&:hover": clickable ? { bgcolor: "#6366f1", "& *": { color: "#fff" } } : {},
        }}>
        <Typography sx={{ fontSize: 9, fontWeight: 700, color: textColH }}>{position}</Typography>
        {occupied
          ? <Typography sx={{ fontSize: 8, color: textColH, opacity: 0.75 }}>Occupied</Typography>
          : <Typography sx={{ fontSize: 8, color: textColH, opacity: 0.6 }}>Free</Typography>}
      </Box>
    </Tooltip>
  );
}

function BedVisualBox({ bed, index, onClick, readOnly }) {
  const occupied = !!bed.studentId;
  const isBunk = bed.bedType === "Bunk";
  const facesRight = index % 2 === 0;
  const bg = occupied ? ROOM_COLORS.occupied : ROOM_COLORS.free;
  const textCol = occupied ? ROOM_COLORS.occupiedText : ROOM_COLORS.freeText;
  const clickable = !occupied && !readOnly && onClick;

  if (!isBunk) {
    return (
      <Tooltip title={occupied ? `Occupied – ${bed.student?.user?.fullName || ""}` : `${bed.bedNumber} (Normal) – click to assign`} arrow>
        <Box onClick={() => clickable && onClick({ ...bed, bunkPosition: null })}
          sx={{
            position: "relative", width: 52, height: 80, bgcolor: bg, borderRadius: 1.5,
            border: `2px solid ${occupied ? "#475569" : "#cbd5e1"}`,
            cursor: clickable ? "pointer" : "default", transition: "all .15s",
            "&:hover": clickable ? { transform: "scale(1.06)", boxShadow: "0 2px 10px rgba(99,102,241,.4)", bgcolor: "#6366f1", "& *": { color: "white" } } : {},
            display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
          }}>
          <Box sx={{ position: "absolute", [facesRight ? "right" : "left"]: 0, top: 0, bottom: 0, width: 8, bgcolor: occupied ? "#334155" : "#94a3b8", borderRadius: facesRight ? "0 8px 8px 0" : "8px 0 0 8px" }} />
          <Typography sx={{ fontSize: 10, fontWeight: 700, color: textCol, zIndex: 1, textAlign: "center" }}>{bed.bedNumber}</Typography>
          <Typography sx={{ fontSize: 9, color: textCol, opacity: 0.75, zIndex: 1 }}>Normal</Typography>
        </Box>
      </Tooltip>
    );
  }

  // Bunk bed — two clickable halves stacked vertically
  return (
    <Box sx={{
      position: "relative", width: 52, height: 80, borderRadius: 1.5, overflow: "hidden",
      border: `2px solid ${occupied ? "#475569" : "#cbd5e1"}`,
      display: "flex", flexDirection: "column",
    }}>
      {/* Headboard rail */}
      <Box sx={{ position: "absolute", [facesRight ? "right" : "left"]: 0, top: 0, bottom: 0, width: 6, bgcolor: ROOM_COLORS.bunkFrame, zIndex: 2 }} />
      <BunkHalf bed={bed} position="Top" onClick={onClick} readOnly={readOnly} />
      <BunkHalf bed={bed} position="Bottom" onClick={onClick} readOnly={readOnly} />
    </Box>
  );
}


// ─── ROOM CELL ────────────────────────────────────────────────────────────────
function RoomCell({ room, onBedClick, readOnly, slotNum }) {
  const [open, setOpen] = useState(false);
  const occupied = (room.beds || []).filter((b) => b.studentId).length;
  const total = room.beds?.length || 0;
  const allFull = occupied === total;

  return (
    <Box sx={{ border: "1px solid #dde3ef", borderRadius: 2, overflow: "hidden", minWidth: 90 }}>
      <Box onClick={() => setOpen((p) => !p)} sx={{ px: 1.5, py: 1, cursor: "pointer", bgcolor: allFull ? "#f1f5f9" : "white", display: "flex", justifyContent: "space-between", alignItems: "center", "&:hover": { bgcolor: "#f8fafc" } }}>
        <Box>
          <Typography variant="caption" fontWeight={800} color="#1e3a8a">{room.roomNumber}</Typography>
          {slotNum && <Typography variant="caption" display="block" color="text.disabled" sx={{ fontSize: 9 }}>Slot {slotNum}</Typography>}
          <Typography variant="caption" display="block" color="text.secondary" sx={{ fontSize: 10 }}>{room.type}</Typography>
        </Box>
        <Chip label={`${occupied}/${total}`} size="small" color={allFull ? "error" : occupied > 0 ? "warning" : "success"} sx={{ height: 18, fontSize: 10, fontWeight: 700 }} />
      </Box>
      {open && (
        <Box sx={{ p: 1, bgcolor: "#fafbff", borderTop: "1px solid #e8edf5", display: "flex", flexWrap: "wrap", gap: 0.75, justifyContent: "center" }}>
          {(room.beds || []).map((bed, i) => (
            <BedVisualBox key={bed.id} bed={bed} index={i} readOnly={readOnly} onClick={onBedClick ? (b) => onBedClick(b, room) : null} />
          ))}
          {room.beds?.length === 0 && <Typography variant="caption" color="text.secondary">No beds</Typography>}
          <Box sx={{ width: "100%", display: "flex", gap: 1, mt: 0.5, justifyContent: "center" }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.4 }}><Box sx={{ width: 10, height: 10, borderRadius: 0.5, bgcolor: ROOM_COLORS.occupied }} /><Typography sx={{ fontSize: 9 }}>Occupied</Typography></Box>
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.4 }}><Box sx={{ width: 10, height: 10, borderRadius: 0.5, bgcolor: ROOM_COLORS.free, border: "1px solid #cbd5e1" }} /><Typography sx={{ fontSize: 9 }}>Free</Typography></Box>
          </Box>
        </Box>
      )}
    </Box>
  );
}

// ─── EMPTY SLOT ───────────────────────────────────────────────────────────────
function EmptySlot({ slotNum }) {
  return (
    <Box sx={{ border: "1px dashed #cbd5e1", borderRadius: 2, minWidth: 90, opacity: 0.5 }}>
      <Box sx={{ px: 1.5, py: 1, display: "flex", flexDirection: "column", alignItems: "center" }}>
        <Typography variant="caption" fontWeight={700} color="text.disabled">{slotNum}</Typography>
        <Typography sx={{ fontSize: 9, color: "text.disabled" }}>Empty</Typography>
      </Box>
    </Box>
  );
}

// ─── BLOCK MAP VIEW ───────────────────────────────────────────────────────────
function BlockMapView({ rooms, onBedClick, readOnly }) {
  const [selectedBlock, setSelectedBlock] = useState(null);

  // Group actual DB rooms by block → floor
  const grouped = useMemo(() => {
    const g = {};
    (rooms || []).forEach((room) => {
      const blk = room.hostelBlock || "Unknown";
      const fl = String(room.floor);
      if (!g[blk]) g[blk] = {};
      if (!g[blk][fl]) g[blk][fl] = [];
      g[blk][fl].push(room);
    });
    return g;
  }, [rooms]);

  const blockStats = useMemo(() => {
    const s = {};
    ALL_BLOCKS.forEach((b) => {
      const blockRooms = [];
      Object.values(grouped[b] || {}).forEach((flRooms) => blockRooms.push(...flRooms));
      const total = blockRooms.reduce((a, r) => a + (r.beds?.length || 0), 0);
      const occupied = blockRooms.reduce((a, r) => a + (r.beds || []).filter((bd) => bd.studentId).length, 0);
      s[b] = { rooms: blockRooms.length, total, occupied, free: total - occupied };
    });
    return s;
  }, [grouped]);

  return (
    <Box>
      {/* Block selector row */}
      <Box sx={{ display: "flex", gap: 2, mb: 3, flexWrap: "nowrap", overflowX: "auto", pb: 1 }}>
        {ALL_BLOCKS.map((block) => {
          const stat = blockStats[block] || {};
          const isActive = selectedBlock === block;
          return (
            <Box key={block} onClick={() => setSelectedBlock(isActive ? null : block)}
              sx={{
                flexShrink: 0, width: 160, cursor: "pointer",
                border: isActive ? "2px solid #6366f1" : "1px solid #e2e8f0",
                borderRadius: 3, p: 2, bgcolor: isActive ? "rgba(99,102,241,0.07)" : "white",
                transition: "all .2s",
                "&:hover": { borderColor: "#6366f1", bgcolor: "rgba(99,102,241,0.04)", transform: "translateY(-2px)", boxShadow: "0 4px 14px rgba(99,102,241,.15)" },
              }}>
              <Typography variant="h6" fontWeight={800} color={isActive ? "#6366f1" : "#1e3a8a"}>🏢 {block}</Typography>
              <Typography variant="caption" color="text.secondary" display="block">
                {BLOCK_FLOORS[block]?.length} floor(s) · {stat.rooms} room(s)
              </Typography>
              <Box sx={{ display: "flex", gap: 0.5, mt: 0.5, flexWrap: "wrap" }}>
                <Chip label={`${stat.free ?? 0} free`} size="small" color={stat.free > 0 ? "success" : "error"} sx={{ height: 18, fontSize: 10 }} />
                <Chip label={`${stat.occupied ?? 0} occ.`} size="small" color="default" sx={{ height: 18, fontSize: 10 }} />
              </Box>
            </Box>
          );
        })}
      </Box>

      {/* Floors + rooms for selected block */}
      {selectedBlock && (
        <Box>
          <Typography variant="subtitle1" fontWeight={800} color="#1e3a8a" mb={2}>Block {selectedBlock} — Floors</Typography>
          {(BLOCK_FLOORS[selectedBlock] || []).map((fl) => {
            const flKey = String(fl);
            const flRooms = (grouped[selectedBlock]?.[flKey] || []).sort((a, b) => a.roomNumber.localeCompare(b.roomNumber));
            const flBeds = flRooms.reduce((a, r) => a + (r.beds?.length || 0), 0);
            const flOcc = flRooms.reduce((a, r) => a + (r.beds || []).filter((bd) => bd.studentId).length, 0);

            // Generate 10 slots for this floor; map DB rooms into slots by position
            const slots = Array.from({ length: 10 }, (_, i) => {
              const label = slotLabel(selectedBlock, fl, i);
              const room = flRooms[i] || null;
              return { label, room };
            });

            return (
              <Box key={fl} sx={{ mb: 3 }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 1.5, pb: 0.5, borderBottom: "2px solid #e2e8f0" }}>
                  <Box sx={{ px: 1.5, py: 0.25, bgcolor: "#1e3a8a", borderRadius: 1 }}>
                    <Typography color="white" fontWeight={700} fontSize={13}>F{fl}</Typography>
                  </Box>
                  <Typography variant="caption" color="text.secondary">
                    {flRooms.length} room(s) · {flBeds - flOcc} bed(s) free / {flBeds} total
                    · Slots: {slotLabel(selectedBlock, fl, 0)} – {slotLabel(selectedBlock, fl, 9)}
                  </Typography>
                </Box>
                <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1.5 }}>
                  {slots.map(({ label, room }) =>
                    room
                      ? <RoomCell key={room.id} room={room} onBedClick={onBedClick} readOnly={readOnly} slotNum={label} />
                      : <EmptySlot key={label} slotNum={label} />
                  )}
                </Box>
              </Box>
            );
          })}
        </Box>
      )}

      {!selectedBlock && (
        <Box sx={{ textAlign: "center", py: 6, color: "text.secondary" }}>
          <Typography>👆 Click on a block above to view its floors and rooms</Typography>
        </Box>
      )}
    </Box>
  );
}

// ─── VERIFICATION TAB ─────────────────────────────────────────────────────────
function VerificationTab() {
  const [students, setStudents] = useState([]);
  const [stats, setStats] = useState(null);
  const [error, setError] = useState("");
  const load = async () => {
    try { const { data } = await adminAPI.getStudents(); setStudents(data.students || []); } catch (e) { setError(loadErr(e)); }
    try { const { data } = await adminAPI.getStats(); setStats(data.stats); } catch { }
  };
  useEffect(() => { load(); }, []);
  const doStatus = async (sid, status) => { try { await adminAPI.verifyStudent(sid, status); load(); } catch (e) { setError(loadErr(e)); } };
  const doActivation = async (uid, active) => { try { await adminAPI.setUserActivation(uid, active); load(); } catch (e) { setError(loadErr(e)); } };
  const statCards = [["Total Students", stats?.studentsTotal ?? "—"], ["Verified", stats?.studentsVerified ?? "—"], ["Open Complaints", stats?.complaintsOpen ?? "—"], ["Pending Payments", stats?.paymentRequestsPending ?? "—"], ["Active Staff", stats?.staffCount ?? "—"]];
  const sColor = { Verified: "success", Rejected: "error", Pending: "warning" };
  return (
    <Box>
      {/* Rich stat cards grouped by category */}
      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr 1fr", md: "repeat(4,1fr)" }, gap: 2, mb: 3 }}>
        {/* Rooms / Beds */}
        <Card elevation={0} sx={{ border: "1px solid #e2e8f0", borderRadius: 2 }}>
          <CardContent sx={{ py: "14px !important", px: 2 }}>
            <Typography color="text.secondary" variant="caption" fontWeight={600}>🏠 Rooms / Beds</Typography>
            <Box sx={{ display: "flex", gap: 2, mt: 0.5 }}>
              <Box><Typography variant="h6" fontWeight={800} color="success.main">{stats?.bedsFree ?? "—"}</Typography><Typography variant="caption" color="text.secondary">Available</Typography></Box>
              <Box><Typography variant="h6" fontWeight={800} color="error.main">{stats?.bedsOccupied ?? "—"}</Typography><Typography variant="caption" color="text.secondary">Occupied</Typography></Box>
            </Box>
            <Typography variant="caption" color="text.disabled">Total beds: {stats?.bedsTotal ?? "—"}</Typography>
          </CardContent>
        </Card>
        {/* Students */}
        <Card elevation={0} sx={{ border: "1px solid #e2e8f0", borderRadius: 2 }}>
          <CardContent sx={{ py: "14px !important", px: 2 }}>
            <Typography color="text.secondary" variant="caption" fontWeight={600}>🎓 Students</Typography>
            <Box sx={{ display: "flex", gap: 2, mt: 0.5 }}>
              <Box><Typography variant="h6" fontWeight={800}>{stats?.studentsTotal ?? "—"}</Typography><Typography variant="caption" color="text.secondary">Total</Typography></Box>
              <Box><Typography variant="h6" fontWeight={800} color="success.main">{stats?.studentsVerified ?? "—"}</Typography><Typography variant="caption" color="text.secondary">Verified</Typography></Box>
            </Box>
          </CardContent>
        </Card>
        {/* Complaints */}
        <Card elevation={0} sx={{ border: "1px solid #e2e8f0", borderRadius: 2 }}>
          <CardContent sx={{ py: "14px !important", px: 2 }}>
            <Typography color="text.secondary" variant="caption" fontWeight={600}>📋 Complaints</Typography>
            {stats?.complaintsByType && Object.keys(stats.complaintsByType).length > 0
              ? Object.entries(stats.complaintsByType).map(([type, count]) => (
                  <Box key={type} sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mt: 0.3 }}>
                    <Typography variant="caption" color="text.secondary">{type}</Typography>
                    <Chip label={count} size="small" sx={{ height: 16, fontSize: 10 }} color="warning" />
                  </Box>
                ))
              : <Typography variant="caption" color="text.disabled">No complaints yet</Typography>}
          </CardContent>
        </Card>
        {/* Payments */}
        <Card elevation={0} sx={{ border: "1px solid #e2e8f0", borderRadius: 2 }}>
          <CardContent sx={{ py: "14px !important", px: 2 }}>
            <Typography color="text.secondary" variant="caption" fontWeight={600}>💳 Payments</Typography>
            <Box sx={{ display: "flex", gap: 2, mt: 0.5 }}>
              <Box><Typography variant="h6" fontWeight={800} color="success.main">{stats?.paymentsCompleted ?? "—"}</Typography><Typography variant="caption" color="text.secondary">Completed</Typography></Box>
              <Box><Typography variant="h6" fontWeight={800} color="warning.main">{stats?.paymentsHalf ?? "—"}</Typography><Typography variant="caption" color="text.secondary">Partial</Typography></Box>
            </Box>
            <Typography variant="caption" color="text.disabled">Total recorded: {stats?.paymentsTotal ?? "—"}</Typography>
          </CardContent>
        </Card>
      </Box>
      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError("")}>{error}</Alert>}
      <Table size="small">
        <TableHead sx={{ bgcolor: "#f8fafc" }}><TableRow>{["Name", "University ID", "Status", "Account", "Actions"].map((h) => <TableCell key={h}><b>{h}</b></TableCell>)}</TableRow></TableHead>
        <TableBody>
          {students.length === 0 && <TableRow><TableCell colSpan={5} align="center" sx={{ py: 4, color: "text.secondary" }}>No students yet.</TableCell></TableRow>}
          {students.map((s) => (
            <TableRow key={s.id} hover>
              <TableCell>{s.user.fullName}</TableCell><TableCell>{s.universityId}</TableCell>
              <TableCell><Chip label={s.verificationStatus} color={sColor[s.verificationStatus] || "default"} size="small" /></TableCell>
              <TableCell><Chip label={s.user.active ? "Active" : "Inactive"} size="small" color={s.user.active ? "success" : "default"} variant="outlined" /></TableCell>
              <TableCell>
                <Box sx={{ display: "flex", gap: 0.5, flexWrap: "wrap" }}>
                  {s.verificationStatus !== "Verified" && <Button size="small" variant="contained" color="success" onClick={() => doStatus(s.id, "Verified")}>Verify</Button>}
                  {s.verificationStatus !== "Rejected" && <Button size="small" variant="outlined" color="error" onClick={() => doStatus(s.id, "Rejected")}>Reject</Button>}
                  {s.verificationStatus !== "Pending" && <Button size="small" variant="outlined" onClick={() => doStatus(s.id, "Pending")}>Reset</Button>}
                  <Button size="small" variant={s.user.active ? "outlined" : "contained"} color={s.user.active ? "warning" : "primary"} onClick={() => doActivation(s.user.id, !s.user.active)}>
                    {s.user.active ? "Deactivate" : "Activate"}
                  </Button>
                </Box>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Box>
  );
}

// ─── ROOMS TAB ────────────────────────────────────────────────────────────────
function RoomsTab() {
  const [rooms, setRooms] = useState([]);
  const [error, setError] = useState("");
  const [form, setForm] = useState({ roomNumber: "", type: "", preferredBedType: "", floor: "", hostelBlock: "" });
  const [confirmDelete, setConfirmDelete] = useState(null);
  const load = async () => { try { const { data } = await adminAPI.getRooms(); setRooms(data.rooms || []); } catch (e) { setError(loadErr(e)); } };
  useEffect(() => { load(); }, []);

  // Auto-suggest room number from block+floor selection
  const suggestedRoom = useMemo(() => {
    if (!form.hostelBlock || !form.floor) return "";
    const base = BLOCK_ROOM_BASE[form.hostelBlock] || 1;
    const floorOffset = (parseInt(form.floor, 10) - 1) * 10;
    const existingInFloor = rooms.filter((r) => r.hostelBlock === form.hostelBlock && String(r.floor) === form.floor).length;
    if (existingInFloor >= 10) return "";
    return `R${base + floorOffset + existingInFloor}`;
  }, [form.hostelBlock, form.floor, rooms]);

  // When block+floor selected, auto-fill suggested room number
  useEffect(() => {
    if (suggestedRoom && !form.roomNumber) setForm((p) => ({ ...p, roomNumber: suggestedRoom }));
  }, [suggestedRoom]);

  const cap = { Single: 1, Double: 2, Triple: 3, Quad: 4, Quint: 5 }[form.type] || 0;
  const canCreate = form.roomNumber.trim() && form.type && form.floor && form.hostelBlock && (form.type === "Single" || form.preferredBedType);

  const create = async () => {
    if (!canCreate) return setError("Fill all required fields");
    try {
      await adminAPI.addRoom({ ...form, preferredBedType: form.type === "Single" ? "Normal" : form.preferredBedType });
      setForm({ roomNumber: "", type: "", preferredBedType: "", floor: "", hostelBlock: "" });
      setError(""); load();
    } catch (e) { setError(loadErr(e)); }
  };

  return (
    <Box>
      <ConfirmDialog open={!!confirmDelete} title="Delete Room" message="Are you sure? This cannot be undone."
        onConfirm={async () => { try { await adminAPI.deleteRoom(confirmDelete); setConfirmDelete(null); load(); } catch (e) { setError(loadErr(e)); setConfirmDelete(null); } }}
        onCancel={() => setConfirmDelete(null)} />
      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError("")}>{error}</Alert>}
      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "repeat(3,1fr)" }, gap: 2, mb: 2 }}>
        <TextField required select label="Hostel Block" value={form.hostelBlock}
          onChange={(e) => setForm((p) => ({ ...p, hostelBlock: e.target.value, roomNumber: "" }))}>
          {["B1", "B2", "B3", "B4", "B5"].map((b) => <MenuItem key={b} value={b}>{b}</MenuItem>)}
        </TextField>
        <TextField required select label="Floor" value={form.floor}
          onChange={(e) => setForm((p) => ({ ...p, floor: e.target.value, roomNumber: "" }))}>
          {(BLOCK_FLOORS[form.hostelBlock] || [1, 2, 3, 4, 5]).map((f) => <MenuItem key={f} value={String(f)}>F{f}</MenuItem>)}
        </TextField>
        <TextField required label="Room Number" placeholder="Auto-suggested from Block+Floor"
          value={form.roomNumber} onChange={(e) => setForm((p) => ({ ...p, roomNumber: e.target.value }))}
          helperText={suggestedRoom ? `Suggested: ${suggestedRoom}` : form.hostelBlock && form.floor ? "Floor full (10/10)" : "Select block + floor first"} />
        <TextField required select label="Room Type" value={form.type}
          onChange={(e) => setForm((p) => ({ ...p, type: e.target.value, preferredBedType: "" }))}>
          {["Single", "Double", "Triple", "Quad", "Quint"].map((t) => <MenuItem key={t} value={t}>{t}</MenuItem>)}
        </TextField>
        {form.type && form.type !== "Single" && (
          <TextField required select label="Bed Type" value={form.preferredBedType}
            onChange={(e) => setForm((p) => ({ ...p, preferredBedType: e.target.value }))}>
            <MenuItem value="Normal">Normal Beds</MenuItem><MenuItem value="Bunk">Bunk Beds</MenuItem>
          </TextField>
        )}
        <TextField label="Capacity (auto)" value={cap || "—"} InputProps={{ readOnly: true }} />
      </Box>
      <Button variant="contained" disabled={!canCreate} onClick={create}>Create Room</Button>
      <Table size="small" sx={{ mt: 3 }}>
        <TableHead sx={{ bgcolor: "#f8fafc" }}>
          <TableRow>{["Room", "Type", "Block", "Floor", "Capacity", "Vacancy", ""].map((h) => <TableCell key={h}><b>{h}</b></TableCell>)}</TableRow>
        </TableHead>
        <TableBody>
          {rooms.length === 0 && <TableRow><TableCell colSpan={7} align="center" sx={{ py: 4, color: "text.secondary" }}>No rooms yet.</TableCell></TableRow>}
          {rooms.map((r) => {
            const occ = (r.beds || []).filter((b) => b.studentId).length;
            return (
              <TableRow key={r.id} hover>
                <TableCell>{r.roomNumber}</TableCell><TableCell>{r.type}</TableCell>
                <TableCell>{r.hostelBlock}</TableCell><TableCell>F{r.floor}</TableCell>
                <TableCell>{r.capacity}</TableCell>
                <TableCell><Chip label={`${r.capacity - occ} free`} size="small" color={r.capacity - occ > 0 ? "success" : "error"} variant="outlined" /></TableCell>
                <TableCell><Button size="small" color="error" onClick={() => setConfirmDelete(r.id)}>Delete</Button></TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </Box>
  );
}

// ─── BED TAB ──────────────────────────────────────────────────────────────────
function BedTab() {
  const [students, setStudents] = useState([]);
  const [beds, setBeds] = useState([]);
  const [history, setHistory] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [error, setError] = useState("");
  const [form, setForm] = useState({ studentId: "", bedId: "" });
  const [viewMode, setViewMode] = useState("list");

  const load = async () => {
    try { const s = await adminAPI.getStudents(); setStudents((s.data.students || []).filter((x) => x.verificationStatus === "Verified")); } catch (e) { setError(loadErr(e)); }
    try { const b = await adminAPI.getAvailableBeds(); setBeds(b.data.beds || []); } catch (e) { setError(loadErr(e)); }
    try { const h = await adminAPI.getBedHistory(); setHistory(h.data.history || []); } catch (e) { setError(loadErr(e)); }
    try { const m = await adminAPI.getRoomMap(); setRooms(m.data.rooms || []); } catch (e) { setError(loadErr(e)); }
  };
  useEffect(() => { load(); }, []);

  const assign = async () => {
    if (!form.studentId || !form.bedId) return setError("Student and bed required");
    try { await adminAPI.assignBed(form); setForm({ studentId: "", bedId: "" }); setError(""); load(); }
    catch (e) { setError(loadErr(e)); }
  };

  return (
    <Box>
      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError("")}>{error}</Alert>}
      <Box sx={{ display: "flex", gap: 1, mb: 2 }}>
        <Button size="small" variant={viewMode === "list" ? "contained" : "outlined"} startIcon={<ListAlt />} onClick={() => setViewMode("list")}>List View</Button>
        <Button size="small" variant={viewMode === "map" ? "contained" : "outlined"} startIcon={<MapOutlined />} onClick={() => setViewMode("map")}>Map View</Button>
      </Box>

      {viewMode === "list" ? (
        <>
          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" }, gap: 2, mb: 2 }}>
            <TextField select label="Student (Verified)" value={form.studentId} onChange={(e) => setForm((p) => ({ ...p, studentId: e.target.value }))}>
              {students.length === 0 && <MenuItem disabled value="">No verified students</MenuItem>}
              {students.map((s) => <MenuItem key={s.id} value={s.id}>{s.user.fullName} — {s.universityId}</MenuItem>)}
            </TextField>
            <TextField select label="Available Bed" value={form.bedId} onChange={(e) => setForm((p) => ({ ...p, bedId: e.target.value }))}>
              {beds.length === 0 && <MenuItem disabled value="">No beds — create rooms first</MenuItem>}
              {beds.map((b) => <MenuItem key={b.id} value={b.id}>{b.room.roomNumber} / {b.bedNumber} / {b.bedType} (Block {b.room.hostelBlock}, F{b.room.floor})</MenuItem>)}
            </TextField>
          </Box>
          <Button variant="contained" onClick={assign}>Assign / Transfer Bed</Button>
          <Typography fontWeight={700} mt={3} mb={1}>Allocation History</Typography>
          <Table size="small">
            <TableHead sx={{ bgcolor: "#f8fafc" }}>
              <TableRow>{["Student", "University ID", "Room / Bed", "Assigned", "Released"].map((h) => <TableCell key={h}><b>{h}</b></TableCell>)}</TableRow>
            </TableHead>
            <TableBody>
              {history.map((h) => (
                <TableRow key={h.id} hover>
                  <TableCell>{h.student?.user?.fullName}</TableCell><TableCell>{h.student?.universityId}</TableCell>
                  <TableCell>{h.bed?.room?.roomNumber} / {h.bed?.bedNumber}</TableCell>
                  <TableCell>{new Date(h.assignedAt).toLocaleString()}</TableCell>
                  <TableCell>{h.releasedAt ? new Date(h.releasedAt).toLocaleString() : "—"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </>
      ) : (
        <BlockMapView rooms={rooms} readOnly />
      )}
    </Box>
  );
}

// ─── FEE PLANS TAB ────────────────────────────────────────────────────────────
function FeePlansTab() {
  const [feePlans, setFeePlans] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState("");
  const [form, setForm] = useState({ name: "", amount: "", period: "", description: "" });
  const [confirmDelete, setConfirmDelete] = useState(null);
  const load = async () => { try { const { data } = await adminAPI.getFeePlans(); setFeePlans(data.feePlans || []); } catch (e) { setError(loadErr(e)); } };
  useEffect(() => { load(); }, []);

  const create = async () => {
    if (!form.name || !form.amount || !form.period) return setError("Name, amount and duration are required");
    try { await adminAPI.createFeePlan(form); setForm({ name: "", amount: "", period: "", description: "" }); setError(""); load(); }
    catch (e) { setError(loadErr(e)); }
  };
  const saveEdit = async (p) => { try { await adminAPI.updateFeePlan(p.id, p); setEditingId(null); load(); } catch (e) { setError(loadErr(e)); } };
  const pLabels = { Monthly: "1 month", ThreeMonths: "3 months", SixMonths: "6 months", OneYear: "1 year" };

  return (
    <Box>
      <ConfirmDialog open={!!confirmDelete} title="Delete Fee Plan" message="Are you sure? This cannot be undone."
        onConfirm={async () => { try { await adminAPI.deleteFeePlan(confirmDelete); setConfirmDelete(null); load(); } catch (e) { setError(loadErr(e)); setConfirmDelete(null); } }}
        onCancel={() => setConfirmDelete(null)} />
      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError("")}>{error}</Alert>}
      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "repeat(4,1fr)" }, gap: 2, mb: 2 }}>
        <TextField label="Plan Name" value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} />
        <TextField label="Amount (LKR)" type="number" value={form.amount} onChange={(e) => setForm((p) => ({ ...p, amount: e.target.value }))} />
        <TextField select label="Duration" value={form.period} onChange={(e) => setForm((p) => ({ ...p, period: e.target.value }))}>
          <MenuItem value="Monthly">1 month</MenuItem><MenuItem value="ThreeMonths">3 months</MenuItem>
          <MenuItem value="SixMonths">6 months</MenuItem><MenuItem value="OneYear">1 year</MenuItem>
        </TextField>
        <TextField label="Description" value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} />
      </Box>
      <Button variant="contained" onClick={create}>Create Plan</Button>
      <Table size="small" sx={{ mt: 3 }}>
        <TableHead sx={{ bgcolor: "#f8fafc" }}>
          <TableRow>{["Name", "Amount (LKR)", "Duration", "Description", "Actions"].map((h) => <TableCell key={h}><b>{h}</b></TableCell>)}</TableRow>
        </TableHead>
        <TableBody>
          {feePlans.length === 0 && <TableRow><TableCell colSpan={5} align="center" sx={{ py: 4, color: "text.secondary" }}>No fee plans yet.</TableCell></TableRow>}
          {feePlans.map((p) => (
            <TableRow key={p.id} hover>
              <TableCell>{editingId === p.id ? <TextField size="small" value={p.name} onChange={(e) => setFeePlans((prev) => prev.map((x) => x.id === p.id ? { ...x, name: e.target.value } : x))} /> : p.name}</TableCell>
              <TableCell>{editingId === p.id ? <TextField size="small" type="number" value={p.amount} onChange={(e) => setFeePlans((prev) => prev.map((x) => x.id === p.id ? { ...x, amount: e.target.value } : x))} /> : `LKR ${p.amount}`}</TableCell>
              <TableCell>{editingId === p.id ? <TextField size="small" select value={p.period} onChange={(e) => setFeePlans((prev) => prev.map((x) => x.id === p.id ? { ...x, period: e.target.value } : x))}>{["Monthly", "ThreeMonths", "SixMonths", "OneYear"].map((v) => <MenuItem key={v} value={v}>{pLabels[v]}</MenuItem>)}</TextField> : (pLabels[p.period] || p.period)}</TableCell>
              <TableCell>{editingId === p.id ? <TextField size="small" value={p.description || ""} onChange={(e) => setFeePlans((prev) => prev.map((x) => x.id === p.id ? { ...x, description: e.target.value } : x))} /> : (p.description || "—")}</TableCell>
              <TableCell sx={{ display: "flex", gap: 0.5 }}>
                {editingId === p.id ? <Button size="small" variant="contained" color="success" onClick={() => saveEdit(p)}>Save</Button> : <Button size="small" variant="outlined" onClick={() => setEditingId(p.id)}>Edit</Button>}
                <Button size="small" color="error" onClick={() => setConfirmDelete(p.id)}>Delete</Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Box>
  );
}

// ─── PAYMENTS TAB ─────────────────────────────────────────────────────────────
function PaymentsTab({ autoFillStudentId, onAutoFillUsed }) {
  const [students, setStudents] = useState([]);
  const [feePlans, setFeePlans] = useState([]);
  const [requests, setRequests] = useState([]);
  const [payments, setPayments] = useState([]);
  const [error, setError] = useState("");
  const [form, setForm] = useState({ studentId: "", feePlanId: "", amount: "", paidAt: "" });

  const load = async () => {
    try { const s = await adminAPI.getStudents(); setStudents((s.data.students || []).filter((x) => x.verificationStatus === "Verified")); } catch (e) { setError(loadErr(e)); }
    try { const f = await adminAPI.getFeePlans(); setFeePlans(f.data.feePlans || []); } catch (e) { setError(loadErr(e)); }
    try { const r = await adminAPI.getPaymentRequests(); setRequests(r.data.requests || []); } catch (e) { setError(loadErr(e)); }
    try { const p = await adminAPI.getPayments(); setPayments(p.data.payments || []); } catch (e) { setError(loadErr(e)); }
  };
  useEffect(() => { load(); }, []);

  // Auto-fill from notification
  useEffect(() => {
    if (autoFillStudentId && students.length > 0) {
      const student = students.find((s) => s.id === autoFillStudentId);
      if (student) {
        const updates = { studentId: student.id };
        if (student.currentFeePlanId) updates.feePlanId = student.currentFeePlanId;
        const pending = requests.find((r) => r.studentId === student.id && r.status === "Pending");
        if (pending) {
          if (pending.feePlanId) updates.feePlanId = pending.feePlanId;
          const amt = pending.paidAmount ?? pending.feePlan?.amount;
          if (amt != null) updates.amount = String(amt);
          if (pending.date) updates.paidAt = new Date(pending.date).toISOString().split("T")[0];
        }
        setForm((p) => ({ ...p, ...updates }));
        onAutoFillUsed?.();
      }
    }
  }, [autoFillStudentId, students, requests]);

  const selectedStudent = useMemo(() => students.find((s) => s.id === form.studentId), [students, form.studentId]);
  useEffect(() => {
    if (!selectedStudent) return;
    const updates = {};
    if (selectedStudent.currentFeePlanId) updates.feePlanId = selectedStudent.currentFeePlanId;
    const pending = requests.find((r) => r.studentId === selectedStudent.id && r.status === "Pending");
    if (pending) {
      if (pending.feePlanId) updates.feePlanId = pending.feePlanId;
      const amt = pending.paidAmount ?? pending.feePlan?.amount;
      if (amt != null) updates.amount = String(amt);
      if (pending.date) updates.paidAt = new Date(pending.date).toISOString().split("T")[0];
    }
    if (Object.keys(updates).length > 0) setForm((p) => ({ ...p, ...updates }));
  }, [selectedStudent?.id]);

  const alreadyPaidThisMonth = useMemo(() => {
    if (!form.studentId || !form.paidAt) return false;
    const d = new Date(form.paidAt);
    return payments.some((p) => { if (p.studentId !== form.studentId) return false; const pd = new Date(p.paidAt); return pd.getFullYear() === d.getFullYear() && pd.getMonth() === d.getMonth(); });
  }, [form.studentId, form.paidAt, payments]);

  const selectedPlan = feePlans.find((f) => f.id === form.feePlanId);
  const balance = useMemo(() => { if (!selectedPlan || !form.amount) return 0; const paid = Number(form.amount); return paid > selectedPlan.amount ? paid - selectedPlan.amount : 0; }, [selectedPlan, form.amount]);
  const validTill = useMemo(() => {
    if (!selectedPlan || !form.paidAt) return "—";
    const d = new Date(form.paidAt); if (isNaN(d.getTime())) return "—";
    const r = new Date(d); r.setMonth(r.getMonth() + selectedPlan.months);
    return r.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
  }, [selectedPlan, form.paidAt]);

  const save = async () => {
    if (!form.studentId || !form.feePlanId || !form.amount || !form.paidAt) return setError("Fill all required fields");
    if (alreadyPaidThisMonth) return setError("A payment has already been recorded for this student this month");
    try { await adminAPI.recordPayment(form); setError(""); setForm({ studentId: "", feePlanId: "", amount: "", paidAt: "" }); load(); }
    catch (e) { setError(loadErr(e)); }
  };

  return (
    <Box>
      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError("")}>{error}</Alert>}
      {alreadyPaidThisMonth && <Alert severity="warning" sx={{ mb: 2 }}>⚠️ This student already has a payment recorded for the selected month.</Alert>}
      {autoFillStudentId && <Alert severity="info" sx={{ mb: 2 }}>✅ Student details auto-filled from notification.</Alert>}
      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "repeat(3,1fr)" }, gap: 2, mb: 2 }}>
        <TextField select label="Student (Verified)" value={form.studentId} onChange={(e) => setForm((p) => ({ ...p, studentId: e.target.value }))}>
          {students.length === 0 && <MenuItem disabled value="">No verified students</MenuItem>}
          {students.map((s) => <MenuItem key={s.id} value={s.id}>{s.user.fullName} — {s.universityId}</MenuItem>)}
        </TextField>
        <TextField select label="Fee Plan" value={form.feePlanId} onChange={(e) => setForm((p) => ({ ...p, feePlanId: e.target.value }))}>
          {feePlans.length === 0 && <MenuItem disabled value="">No fee plans</MenuItem>}
          {feePlans.map((f) => <MenuItem key={f.id} value={f.id}>{f.name} — LKR {f.amount}</MenuItem>)}
        </TextField>
        <TextField label="Paid Amount (LKR)" type="number" value={form.amount} onChange={(e) => setForm((p) => ({ ...p, amount: e.target.value }))} />
        <TextField type="date" label="Payment Date" InputLabelProps={{ shrink: true }} value={form.paidAt} onChange={(e) => setForm((p) => ({ ...p, paidAt: e.target.value }))} />
        <TextField label="Balance (LKR)" value={balance > 0 ? `+${balance.toFixed(2)} (overpaid)` : "0.00"} InputProps={{ readOnly: true }}
          helperText={balance > 0 ? "Student paid more than plan amount" : "No balance"}
          sx={{ "& input": { color: balance > 0 ? "#16a34a" : "inherit", fontWeight: balance > 0 ? 700 : 400 } }} />
        <TextField label="Valid Till" value={validTill} InputProps={{ readOnly: true }} helperText={selectedPlan ? `${selectedPlan.months} month(s) from payment date` : ""} />
      </Box>
      <Button variant="contained" disabled={alreadyPaidThisMonth} onClick={save}>Save Payment</Button>
      <Typography mt={3} mb={1} fontWeight={700}>Payment Requests from Students</Typography>
      <Table size="small">
        <TableHead sx={{ bgcolor: "#f8fafc" }}><TableRow>{["Student", "Plan", "Method", "Date", "Status", "Slip"].map((h) => <TableCell key={h}><b>{h}</b></TableCell>)}</TableRow></TableHead>
        <TableBody>
          {requests.length === 0 && <TableRow><TableCell colSpan={6} align="center" sx={{ py: 3, color: "text.secondary" }}>No payment requests yet.</TableCell></TableRow>}
          {requests.map((r) => (
            <TableRow key={r.id} hover>
              <TableCell>{r.student?.user?.fullName}</TableCell><TableCell>{r.feePlan?.name}</TableCell>
              <TableCell>{r.method}</TableCell><TableCell>{new Date(r.date).toLocaleDateString()}</TableCell>
              <TableCell><Chip label={r.status} size="small" color={r.status === "Approved" ? "success" : r.status === "Rejected" ? "error" : "warning"} /></TableCell>
              <TableCell>{r.slipUrl ? <a href={r.slipUrl} target="_blank" rel="noreferrer">View</a> : "—"}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Box>
  );
}

// ─── STAFF TAB ────────────────────────────────────────────────────────────────
function StaffTab() {
  const [staff, setStaff] = useState([]);
  const [error, setError] = useState("");
  const [form, setForm] = useState({ fullName: "", phone: "", whatsappNumber: "", department: "" });
  const load = async () => { try { const { data } = await adminAPI.getStaff(); setStaff(data.staff || []); } catch (e) { setError(loadErr(e)); } };
  useEffect(() => { load(); }, []);

  const create = async () => {
    if (!form.fullName || !form.phone || !form.whatsappNumber) return setError("Name, phone and WhatsApp are required");
    try { await adminAPI.createStaff(form); setForm({ fullName: "", phone: "", whatsappNumber: "", department: "" }); setError(""); load(); }
    catch (e) { setError(loadErr(e)); }
  };

  return (
    <Box>
      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError("")}>{error}</Alert>}
      <Alert severity="info" sx={{ mb: 2 }}>
        Staff members are contacted via <strong>WhatsApp</strong> when assigned to a complaint — no login required for staff.
      </Alert>
      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "repeat(2,1fr)" }, gap: 2, mb: 2 }}>
        <TextField required label="Full Name" value={form.fullName} onChange={(e) => setForm((p) => ({ ...p, fullName: e.target.value }))} />
        <TextField required label="Phone Number" placeholder="+94771234567" value={form.phone} onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))} />
        <TextField required label="WhatsApp Number" placeholder="+94771234567" value={form.whatsappNumber} onChange={(e) => setForm((p) => ({ ...p, whatsappNumber: e.target.value }))} helperText="Used to send WhatsApp notifications" />
        <TextField select label="Staff Type (optional)" value={form.department} onChange={(e) => setForm((p) => ({ ...p, department: e.target.value }))}>
          <MenuItem value="">— None —</MenuItem>
          {STAFF_TYPES.map((t) => <MenuItem key={t} value={t}>{t}</MenuItem>)}
        </TextField>
      </Box>
      <Button variant="contained" onClick={create}>Add Staff Member</Button>
      <Typography fontWeight={700} mt={3} mb={1}>Staff Members</Typography>
      <Table size="small">
        <TableHead sx={{ bgcolor: "#f8fafc" }}><TableRow>{["Name", "Phone", "WhatsApp", "Type"].map((h) => <TableCell key={h}><b>{h}</b></TableCell>)}</TableRow></TableHead>
        <TableBody>
          {staff.length === 0 && <TableRow><TableCell colSpan={4} align="center" sx={{ py: 4, color: "text.secondary" }}>No staff yet.</TableCell></TableRow>}
          {staff.map((s) => (
            <TableRow key={s.id} hover>
              <TableCell>{s.user.fullName}</TableCell><TableCell>{s.user.phone || "—"}</TableCell>
              <TableCell>
                <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                  <WhatsApp sx={{ color: "#25d366", fontSize: 16 }} />
                  <a href={`https://wa.me/${s.whatsappNumber?.replace(/\D/g, "")}`} target="_blank" rel="noreferrer">{s.whatsappNumber}</a>
                </Box>
              </TableCell>
              <TableCell>{s.department || "—"}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Box>
  );
}

// ─── COMPLAINTS TAB ───────────────────────────────────────────────────────────
function ComplaintsTab() {
  const [complaints, setComplaints] = useState([]);
  const [staff, setStaff] = useState([]);
  const [error, setError] = useState("");
  const [whatsappLink, setWhatsappLink] = useState(null);
  const load = async () => {
    try { const c = await adminAPI.getAllComplaints(); setComplaints(c.data.complaints || []); } catch (e) { setError(loadErr(e)); }
    try { const s = await adminAPI.getStaff(); setStaff(s.data.staff || []); } catch { }
  };
  useEffect(() => { load(); }, []);

  const statusOptions = [
    { value: "Open", label: "Open" }, { value: "StaffNotified", label: "Staff Notified" },
    { value: "InProgress", label: "In Progress" }, { value: "Resolved", label: "Done" },
  ];
  const sColor = { Open: "error", InProgress: "warning", StaffNotified: "info", DoneByStaff: "secondary", Resolved: "success", Closed: "default" };
  const statusLabel = { Open: "Open", StaffNotified: "Staff Notified", InProgress: "In Progress", Resolved: "Done", DoneByStaff: "Done by Staff", Closed: "Closed" };

  const assignStaff = async (complaintId, staffId) => {
    if (!staffId) return;
    try {
      const resp = await adminAPI.assignComplaint(complaintId, staffId);
      load();
      // Show WhatsApp link so admin can notify staff
      const link = resp?.data?.whatsappUrl;
      if (link) setWhatsappLink(link);
    } catch (er) { setError(loadErr(er)); }
  };

  return (
    <Box>
      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError("")}>{error}</Alert>}
      {whatsappLink && (
        <Alert severity="success" sx={{ mb: 2 }} action={
          <Button color="inherit" size="small" startIcon={<WhatsApp />} href={whatsappLink} target="_blank" rel="noreferrer" onClick={() => setWhatsappLink(null)}>
            Open WhatsApp
          </Button>
        } onClose={() => setWhatsappLink(null)}>
          Staff assigned! Click to send WhatsApp notification to staff member.
        </Alert>
      )}
      {staff.length === 0 && <Alert severity="warning" sx={{ mb: 2 }}>No staff found — go to <b>Staff</b> tab to add staff members first.</Alert>}
      <Table size="small">
        <TableHead sx={{ bgcolor: "#f8fafc" }}>
          <TableRow>{["Student", "Title (Type)", "Description", "Status", "Assign Staff (→ WhatsApp)", "Update Status"].map((h) => <TableCell key={h}><b>{h}</b></TableCell>)}</TableRow>
        </TableHead>
        <TableBody>
          {complaints.length === 0 && <TableRow><TableCell colSpan={6} align="center" sx={{ py: 3, color: "text.secondary" }}>No complaints yet.</TableCell></TableRow>}
          {complaints.map((c) => (
            <TableRow key={c.id} hover>
              <TableCell>{c.student?.user?.fullName}</TableCell>
              <TableCell>{c.title}</TableCell>
              <TableCell sx={{ maxWidth: 200 }}>
                <Typography variant="caption" sx={{ display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{c.description}</Typography>
              </TableCell>
              <TableCell><Chip label={statusLabel[c.status] || c.status} size="small" color={sColor[c.status] || "default"} /></TableCell>
              <TableCell>
                <TextField select size="small" value={c.assignedStaffId || ""} label="Staff" sx={{ minWidth: 160 }}
                  onChange={(e) => assignStaff(c.id, e.target.value)}>
                  <MenuItem value="">— None —</MenuItem>
                  {staff.map((s) => <MenuItem key={s.id} value={s.id}>{s.user.fullName}{s.department ? ` (${s.department})` : ""}</MenuItem>)}
                </TextField>
              </TableCell>
              <TableCell>
                <TextField select size="small" value={c.status} sx={{ minWidth: 150 }}
                  onChange={async (e) => { try { await adminAPI.updateComplaintStatus(c.id, e.target.value); load(); } catch (er) { setError(loadErr(er)); } }}>
                  {statusOptions.map((st) => <MenuItem key={st.value} value={st.value}>{st.label}</MenuItem>)}
                </TextField>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Box>
  );
}

// ─── VISITORS TAB ─────────────────────────────────────────────────────────────
function VisitorsTab() {
  const [students, setStudents] = useState([]);
  const [visitors, setVisitors] = useState([]);
  const [error, setError] = useState("");
  const [form, setForm] = useState({ studentId: "", visitorName: "", relation: "", inAt: "", outAt: "" });
  const [editingCheckout, setEditingCheckout] = useState(null);
  const [editCheckoutVal, setEditCheckoutVal] = useState("");

  const nowLocal = () => {
    const n = new Date(); const pad = (x) => String(x).padStart(2, "0");
    return `${n.getFullYear()}-${pad(n.getMonth() + 1)}-${pad(n.getDate())}T${pad(n.getHours())}:${pad(n.getMinutes())}`;
  };
  // Convert a stored ISO datetime to local datetime-local value
  const toLocalDTL = (iso) => {
    if (!iso) return "";
    const d = new Date(iso); const pad = (x) => String(x).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  };
  // Min checkout = checkin + 1 minute
  const minCheckout = (inAt) => {
    if (!inAt) return nowLocal();
    const d = new Date(new Date(inAt).getTime() + 60000); const pad = (x) => String(x).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  };

  const load = async () => {
    try { const s = await adminAPI.getStudents(); setStudents((s.data.students || []).filter((x) => x.verificationStatus === "Verified")); } catch (e) { setError(loadErr(e)); }
    try { const v = await adminAPI.getVisitors(); setVisitors(v.data.visitors || []); } catch (e) { setError(loadErr(e)); }
  };
  useEffect(() => { load(); }, []);

  const add = async () => {
    if (!form.studentId || !form.visitorName || !form.inAt) return setError("Student, visitor name and check-in time required");
    if (form.outAt && form.outAt <= form.inAt) return setError("Check-out must be after check-in time");
    try { await adminAPI.addVisitor(form); setForm({ studentId: "", visitorName: "", relation: "", inAt: "", outAt: "" }); setError(""); load(); }
    catch (e) { setError(loadErr(e)); }
  };

  const saveCheckout = async (id) => {
    const v = visitors.find((x) => x.id === id);
    if (v) {
      const minCO = minCheckout(v.inAt);
      if (editCheckoutVal && editCheckoutVal < minCO) return setError("Check-out time cannot be earlier than check-in time");
    }
    try { await adminAPI.updateVisitor(id, { outAt: editCheckoutVal }); setEditingCheckout(null); setError(""); load(); }
    catch (e) { setError(loadErr(e)); }
  };

  return (
    <Box>
      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError("")}>{error}</Alert>}
      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "repeat(3,1fr)" }, gap: 2, mb: 2 }}>
        <TextField select label="Student" value={form.studentId} onChange={(e) => setForm((p) => ({ ...p, studentId: e.target.value }))}>
          {students.length === 0 && <MenuItem disabled value="">No verified students</MenuItem>}
          {students.map((s) => <MenuItem key={s.id} value={s.id}>{s.user.fullName} — {s.universityId}</MenuItem>)}
        </TextField>
        <TextField required label="Visitor Name" value={form.visitorName} onChange={(e) => setForm((p) => ({ ...p, visitorName: e.target.value }))} />
        <TextField label="Relation" placeholder="e.g. Parent, Friend" value={form.relation} onChange={(e) => setForm((p) => ({ ...p, relation: e.target.value }))} />
        <TextField required type="datetime-local" label="Check-in Time" InputLabelProps={{ shrink: true }}
          inputProps={{ min: nowLocal() }}
          value={form.inAt}
          onChange={(e) => setForm((p) => ({ ...p, inAt: e.target.value, outAt: "" }))} />
        <TextField type="datetime-local" label="Check-out (optional)" InputLabelProps={{ shrink: true }}
          inputProps={{ min: form.inAt ? minCheckout(form.inAt) : nowLocal() }}
          value={form.outAt}
          onChange={(e) => setForm((p) => ({ ...p, outAt: e.target.value }))}
          disabled={!form.inAt}
          helperText={form.inAt ? "Must be after check-in time" : "Set check-in first"} />
      </Box>
      <Button variant="contained" onClick={add}>Add Visitor</Button>
      <Table size="small" sx={{ mt: 3 }}>
        <TableHead sx={{ bgcolor: "#f8fafc" }}>
          <TableRow>{["Visitor", "Relation", "Student", "Univ. ID", "Check-in", "Check-out", "Edit"].map((h) => <TableCell key={h}><b>{h}</b></TableCell>)}</TableRow>
        </TableHead>
        <TableBody>
          {visitors.length === 0 && <TableRow><TableCell colSpan={7} align="center" sx={{ py: 3, color: "text.secondary" }}>No visitor records yet.</TableCell></TableRow>}
          {visitors.map((v) => (
            <TableRow key={v.id} hover>
              <TableCell>{v.visitorName}</TableCell><TableCell>{v.relation || "—"}</TableCell>
              <TableCell>{v.student?.user?.fullName}</TableCell><TableCell>{v.student?.universityId}</TableCell>
              <TableCell>{new Date(v.inAt).toLocaleString()}</TableCell>
              <TableCell>
                {editingCheckout === v.id ? (
                  <Box sx={{ display: "flex", gap: 0.5, alignItems: "center" }}>
                    <TextField type="datetime-local" size="small"
                      value={editCheckoutVal}
                      inputProps={{ min: minCheckout(v.inAt) }}
                      onChange={(e) => setEditCheckoutVal(e.target.value)}
                      sx={{ minWidth: 185 }} />
                    <Button size="small" variant="contained" color="success" onClick={() => saveCheckout(v.id)}>Save</Button>
                    <Button size="small" onClick={() => setEditingCheckout(null)}>Cancel</Button>
                  </Box>
                ) : (v.outAt ? new Date(v.outAt).toLocaleString() : "—")}
              </TableCell>
              <TableCell>
                {editingCheckout !== v.id && (
                  <Button size="small" variant="outlined" onClick={() => { setEditingCheckout(v.id); setEditCheckoutVal(v.outAt ? toLocalDTL(v.outAt) : ""); }}>
                    Edit Checkout
                  </Button>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Box>
  );
}

// ─── NOTICES TAB ──────────────────────────────────────────────────────────────
function NoticesTab() {
  const [form, setForm] = useState({ title: "", message: "", onlyVerifiedStudents: true, targetStudentId: "" });
  const [students, setStudents] = useState([]);
  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");
  useEffect(() => {
    adminAPI.getStudents().then((r) => setStudents(r.data.students || [])).catch(() => { });
  }, []);

  const sendTo = form.targetStudentId ? "specific" : String(form.onlyVerifiedStudents);
  const verifiedStudents = students.filter((s) => s.verificationStatus === "Verified");

  return (
    <Box>
      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError("")}>{error}</Alert>}
      <TextField fullWidth label="Notice Title" value={form.title} onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))} sx={{ mb: 2 }} />
      <TextField fullWidth multiline rows={4} label="Notice Message" value={form.message} onChange={(e) => setForm((p) => ({ ...p, message: e.target.value }))} sx={{ mb: 2 }} />
      <TextField select label="Send To" value={sendTo}
        onChange={(e) => {
          const v = e.target.value;
          if (v === "specific") setForm((p) => ({ ...p, targetStudentId: verifiedStudents[0]?.id || "", onlyVerifiedStudents: true }));
          else setForm((p) => ({ ...p, targetStudentId: "", onlyVerifiedStudents: v === "true" }));
        }} sx={{ mb: 2, minWidth: 300 }}>
        <MenuItem value="true">Verified students only</MenuItem>
        <MenuItem value="false">All students (verified + unverified)</MenuItem>
        <MenuItem value="specific">Specific verified student</MenuItem>
      </TextField>
      {sendTo === "specific" && (
        <TextField select label="Select Student" value={form.targetStudentId}
          onChange={(e) => setForm((p) => ({ ...p, targetStudentId: e.target.value }))} sx={{ mb: 2, minWidth: 320 }}>
          {verifiedStudents.map((s) => <MenuItem key={s.id} value={s.id}>{s.user.fullName} — {s.universityId}</MenuItem>)}
        </TextField>
      )}
      <Button variant="contained" onClick={async () => {
        if (!form.title || !form.message) return setError("Title and message required");
        if (sendTo === "specific" && !form.targetStudentId) return setError("Select a student");
        try {
          const r = await adminAPI.publishNotice({ title: form.title, message: form.message, onlyVerifiedStudents: form.onlyVerifiedStudents, targetStudentId: form.targetStudentId || null });
          setMsg(r.data.message); setError("");
          setForm({ title: "", message: "", onlyVerifiedStudents: true, targetStudentId: "" });
        } catch (e) { setError(loadErr(e)); }
      }}>Send Notice</Button>
      {msg && <Alert severity="success" sx={{ mt: 2 }}>{msg}</Alert>}
    </Box>
  );
}

// ─── REQUESTS TAB (bed requests — renamed from Messages) ──────────────────────
function RequestsTab() {
  const [bedRequests, setBedRequests] = useState([]);
  const [error, setError] = useState("");

  const load = async () => {
    try { const r = await adminAPI.getBedRequests(); setBedRequests(r.data.requests || []); } catch (e) { setError(loadErr(e)); }
  };
  useEffect(() => { load(); }, []);

  const handleRequest = async (id, action) => {
    try {
      if (action === "approve") await adminAPI.approveBedRequest(id);
      else await adminAPI.rejectBedRequest(id);
      load();
    } catch (e) { setError(loadErr(e)); }
  };

  const pendingRequests = bedRequests.filter((r) => r.status === "Pending");

  return (
    <Box>
      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError("")}>{error}</Alert>}
      {pendingRequests.length > 0 && (
        <Alert severity="info" sx={{ mb: 2 }}>
          📋 {pendingRequests.length} pending bed transfer request(s) awaiting approval
        </Alert>
      )}
      <Typography fontWeight={700} mb={2}>Student Bed & Transfer Requests</Typography>
      <Table size="small">
        <TableHead sx={{ bgcolor: "#f8fafc" }}>
          <TableRow>{["Student", "Univ. ID", "Room / Bed", "Bunk Position", "Block", "Reason", "Date", "Status", "Actions"].map((h) => <TableCell key={h}><b>{h}</b></TableCell>)}</TableRow>
        </TableHead>
        <TableBody>
          {bedRequests.length === 0 && <TableRow><TableCell colSpan={9} align="center" sx={{ py: 5, color: "text.secondary" }}>No bed requests yet.</TableCell></TableRow>}
          {bedRequests.map((r) => (
            <TableRow key={r.id} hover>
              <TableCell>{r.student?.user?.fullName}</TableCell>
              <TableCell>{r.student?.universityId || "—"}</TableCell>
              <TableCell>{r.bed?.room?.roomNumber} / {r.bed?.bedNumber}</TableCell>
              <TableCell>
                {r.bunkPosition
                  ? <Chip label={r.bunkPosition} size="small" color={r.bunkPosition === "Top" ? "primary" : "secondary"} />
                  : <Typography variant="caption" color="text.disabled">—</Typography>}
              </TableCell>
              <TableCell>{r.bed?.room?.hostelBlock}</TableCell>
              <TableCell sx={{ maxWidth: 160 }}>
                {r.reason
                  ? <Typography variant="caption" sx={{ display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{r.reason}</Typography>
                  : <Typography variant="caption" color="text.disabled">Initial request</Typography>}
              </TableCell>
              <TableCell>{new Date(r.createdAt).toLocaleDateString()}</TableCell>
              <TableCell>
                <Chip label={r.status} size="small"
                  color={r.status === "Approved" ? "success" : r.status === "Rejected" ? "error" : "warning"} />
              </TableCell>
              <TableCell>
                {r.status === "Pending" && (
                  <Box sx={{ display: "flex", gap: 0.5 }}>
                    <Button size="small" variant="contained" color="success" onClick={() => handleRequest(r.id, "approve")}>Approve</Button>
                    <Button size="small" variant="outlined" color="error" onClick={() => handleRequest(r.id, "reject")}>Reject</Button>
                  </Box>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

    </Box>
  );
}

// ─── DEMO DIALOG ──────────────────────────────────────────────────────────────
const DEMO_STEPS = [
  { label: "Verification", desc: "Admin verifies a student's account after checking their university ID and personal details." },
  { label: "Room Setup", desc: "Admin creates hostel blocks (B1-B5), floors, and rooms (R1-R10 per floor). Each room has beds assigned by type (Single, Double, Bunk, etc.)." },
  { label: "Bed Assignment", desc: "Admin assigns a verified student to a specific bed via List View or the visual Map View." },
  { label: "Fee Plans", desc: "Admin creates fee plans (Monthly, 3 Months, 6 Months, 1 Year) with amounts. Student selects their applicable plan." },
  { label: "Payments", desc: "Student submits a payment request. Admin verifies and records it. Balance is calculated if overpaid. Duplicate month protection is built in." },
  { label: "Complaints", desc: "Student submits a complaint with a type (Cleaning, Maintenance, etc.). Admin assigns relevant staff. Staff is notified via WhatsApp automatically." },
  { label: "Visitors", desc: "Admin logs visitor check-in and check-out. Past dates are blocked. Checkout cannot be before check-in." },
  { label: "Notices", desc: "Admin sends notices to all students, verified-only, or a specific student." },
  { label: "Bed Requests", desc: "Student views the Room Map and requests a bed transfer. Admin approves or rejects from the Requests tab." },
];

function DemoDialog({ open, onClose }) {
  const [step, setStep] = useState(0);
  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ background: "linear-gradient(135deg,#1e3a8a,#6366f1)", color: "white", fontWeight: 800 }}>
        🎬 HostelAxis — System Flow Demo
      </DialogTitle>
      <LinearProgress variant="determinate" value={((step + 1) / DEMO_STEPS.length) * 100} sx={{ height: 4 }} />
      <DialogContent sx={{ pt: 3 }}>
        <Stepper activeStep={step} alternativeLabel sx={{ mb: 3, overflowX: "auto" }}>
          {DEMO_STEPS.map((s, i) => (
            <Step key={s.label} completed={i < step}>
              <StepLabel sx={{ "& .MuiStepLabel-label": { fontSize: 10 } }}>{s.label}</StepLabel>
            </Step>
          ))}
        </Stepper>
        <Paper elevation={0} sx={{ p: 3, bgcolor: "#f8fafc", borderRadius: 2, border: "1px solid #e2e8f0" }}>
          <Typography variant="h6" fontWeight={800} color="#1e3a8a" mb={1}>
            Step {step + 1}: {DEMO_STEPS[step].label}
          </Typography>
          <Typography color="text.secondary">{DEMO_STEPS[step].desc}</Typography>
        </Paper>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose}>Close</Button>
        <Button disabled={step === 0} onClick={() => setStep((p) => p - 1)}>← Back</Button>
        {step < DEMO_STEPS.length - 1
          ? <Button variant="contained" onClick={() => setStep((p) => p + 1)}>Next →</Button>
          : <Button variant="contained" color="success" onClick={onClose}>✅ Done</Button>}
      </DialogActions>
    </Dialog>
  );
}

// ─── MAIN ADMIN DASHBOARD ─────────────────────────────────────────────────────
export default function AdminDashboardPage() {
  const [tab, setTab] = useState(0);
  const [paymentAutoFillId, setPaymentAutoFillId] = useState(null);
  const [demoOpen, setDemoOpen] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const initials = user?.fullName?.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2) || "SA";

  const handleLogout = () => { logout(); navigate("/login", { replace: true }); };

  const panels = [
    <VerificationTab key="v" />, <RoomsTab key="r" />, <BedTab key="b" />,
    <FeePlansTab key="f" />, <PaymentsTab key="p" autoFillStudentId={paymentAutoFillId} onAutoFillUsed={() => setPaymentAutoFillId(null)} />,
    <StaffTab key="st" />, <ComplaintsTab key="c" />, <VisitorsTab key="vi" />,
    <NoticesTab key="n" />, <RequestsTab key="req" />,
  ];

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "#f1f5f9", display: "flex", flexDirection: "column" }}>
      <DemoDialog open={demoOpen} onClose={() => setDemoOpen(false)} />

      <Box sx={{ background: "linear-gradient(135deg, #0f172a 0%, #1e3a8a 60%, #312e81 100%)", boxShadow: "0 4px 20px rgba(0,0,0,0.3)" }}>
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", px: { xs: 2, md: 4 }, pt: 2, pb: 0.5 }}>
          <Box>
            <Typography variant="h6" fontWeight={800} color="white" letterSpacing={-0.5}>🏠 HostelAxis</Typography>
            <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.6)" }}>Admin Panel — Smart Hostel Operations</Typography>
          </Box>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            {/* Demo button */}
            <Button
              size="small" startIcon={<PlayArrow />} onClick={() => setDemoOpen(true)}
              sx={{ color: "rgba(255,255,255,0.85)", borderColor: "rgba(255,255,255,0.35)", textTransform: "none", fontSize: 12, "&:hover": { bgcolor: "rgba(255,255,255,0.1)" } }}
              variant="outlined">
              Demo
            </Button>
            <NotificationBell
              onGoToPayments={() => setTab(TAB_PAYMENTS)}
              onGoToBed={() => setTab(TAB_BED)}
              onGoToComplaints={() => setTab(TAB_COMPLAINTS)}
              onPaymentAutoFill={(sid) => { setPaymentAutoFillId(sid); setTab(TAB_PAYMENTS); }}
            />
            <Tooltip title={`Logged in as ${user?.fullName || "Admin"}`}>
              <Avatar sx={{ width: 34, height: 34, bgcolor: "rgba(255,255,255,0.2)", fontSize: 13, fontWeight: 700, cursor: "default" }}>{initials}</Avatar>
            </Tooltip>
            <Tooltip title="Sign Out">
              <IconButton onClick={handleLogout} sx={{ color: "rgba(255,255,255,0.7)", "&:hover": { color: "white" } }}>
                <Logout fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>

        <Tabs value={tab} onChange={(_, v) => setTab(v)} variant="scrollable" scrollButtons="auto"
          TabIndicatorProps={{ style: { backgroundColor: "white", height: 3, borderRadius: "3px 3px 0 0" } }}
          sx={{
            px: { xs: 1, md: 3 },
            "& .MuiTab-root": { color: "rgba(255,255,255,0.55)", textTransform: "none", fontWeight: 500, fontSize: 13, minHeight: 44, py: 0, "&:hover": { color: "rgba(255,255,255,0.85)" } },
            "& .Mui-selected": { color: "white !important", fontWeight: 700 },
          }}>
          {tabList.map((t) => <Tab key={t} label={t} />)}
        </Tabs>
      </Box>

      <Box sx={{ flex: 1, p: { xs: 2, md: 3 } }}>
        <Paper elevation={0} sx={{ p: 3, borderRadius: 3, border: "1px solid #e2e8f0", minHeight: 400 }}>
          {panels[tab]}
        </Paper>
      </Box>
    </Box>
  );
}
