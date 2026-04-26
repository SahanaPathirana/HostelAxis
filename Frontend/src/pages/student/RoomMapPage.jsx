import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Alert, Box, Button, Chip, CircularProgress, Dialog, DialogActions,
  DialogContent, DialogContentText, DialogTitle, Paper, TextField, Tooltip, Typography,
} from "@mui/material";
import { ArrowBack, Bed as BedIcon, CheckCircle, HourglassEmpty } from "@mui/icons-material";
import { studentAPI } from "../../services/api";

// ─── SAME BLOCK CONFIG AS ADMIN ───────────────────────────────────────────────
const BLOCK_FLOORS = { B1: [1, 2, 3, 4, 5], B2: [1, 2, 3, 4, 5], B3: [1, 2, 3, 4], B4: [1, 2, 3], B5: [1] };
const ALL_BLOCKS = ["B1", "B2", "B3", "B4", "B5"];
const BLOCK_ROOM_BASE = { B1: 1, B2: 51, B3: 101, B4: 141, B5: 171 };
const slotLabel = (block, floor, i) => `R${BLOCK_ROOM_BASE[block] + (floor - 1) * 10 + i}`;

const ROOM_COLORS = { occupied: "#64748b", occupiedText: "#ffffff", free: "#e2e8f0", freeText: "#374151", bunkFrame: "#94a3b8" };

// ─── BUNK HALF ────────────────────────────────────────────────────────────────
function BunkHalf({ bed, position, myBedId, pendingBedId, onRequest, readOnly }) {
  const occupied = !!bed.studentId;
  const isMyBed = bed.id === myBedId;
  const isPending = bed.id === pendingBedId;
  const canRequest = !occupied && !isMyBed && !isPending && !pendingBedId && !readOnly && onRequest;

  const bg = isMyBed ? "#3b82f6" : isPending ? "#f59e0b" : occupied ? ROOM_COLORS.occupied : ROOM_COLORS.free;
  const textCol = (isMyBed || isPending || occupied) ? "#fff" : ROOM_COLORS.freeText;

  const tooltipMsg = isMyBed ? `Your bed (${position})`
    : isPending ? `Pending request (${position})`
    : occupied ? `Occupied (${position})`
    : pendingBedId ? `You have a pending request (${position})`
    : `${position} — click to request`;

  return (
    <Tooltip title={tooltipMsg} arrow>
      <Box
        onClick={() => canRequest && onRequest({ ...bed, bunkPosition: position })}
        sx={{
          flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
          bgcolor: bg, cursor: canRequest ? "pointer" : "default", transition: "background .12s",
          ...(position === "Top"
            ? { borderBottom: `1.5px dashed ${ROOM_COLORS.bunkFrame}`, borderRadius: "6px 6px 0 0" }
            : { borderRadius: "0 0 6px 6px" }),
          "&:hover": canRequest ? { bgcolor: "#6366f1", "& *": { color: "#fff !important" } } : {},
        }}>
        <Typography sx={{ fontSize: 9, fontWeight: 700, color: textCol }}>{position}</Typography>
        <Typography sx={{ fontSize: 8, color: textCol, opacity: 0.75 }}>
          {isMyBed ? "Yours" : isPending ? "Pending" : occupied ? "Occ." : "Free"}
        </Typography>
      </Box>
    </Tooltip>
  );
}

// ─── BED VISUAL BOX ──────────────────────────────────────────────────────────
function BedVisualBox({ bed, index, myBedId, pendingBedId, onRequest }) {
  const occupied = !!bed.studentId;
  const isBunk = bed.bedType === "Bunk";
  const isMyBed = bed.id === myBedId;
  const isPending = bed.id === pendingBedId;
  const facesRight = index % 2 === 0;

  const bg = isMyBed ? "#3b82f6" : isPending ? "#f59e0b" : occupied ? ROOM_COLORS.occupied : ROOM_COLORS.free;
  const textCol = (isMyBed || isPending || occupied) ? "#fff" : ROOM_COLORS.freeText;
  const border = isMyBed ? "2px solid #1d4ed8" : isPending ? "2px solid #d97706" : `1px solid ${occupied ? "#475569" : "#cbd5e1"}`;
  const canRequest = !occupied && !isMyBed && !isPending && !pendingBedId && onRequest;

  if (!isBunk) {
    const tooltipMsg = isMyBed ? "Your current bed"
      : isPending ? "Pending request"
      : occupied ? "Occupied"
      : pendingBedId ? "You already have a pending request"
      : "Available — click to request";
    return (
      <Tooltip title={tooltipMsg} arrow>
        <Box onClick={() => canRequest && onRequest({ ...bed, bunkPosition: null })}
          sx={{
            position: "relative", width: 52, height: 80, bgcolor: bg, borderRadius: 1.5,
            border, cursor: canRequest ? "pointer" : "default", transition: "all .15s",
            "&:hover": canRequest ? { transform: "scale(1.06)", boxShadow: "0 2px 10px rgba(99,102,241,.4)", bgcolor: "#6366f1", "& *": { color: "white" } } : {},
            display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
          }}>
          <Box sx={{ position: "absolute", [facesRight ? "right" : "left"]: 0, top: 0, bottom: 0, width: 8, bgcolor: isMyBed ? "#1d4ed8" : occupied ? "#334155" : "#94a3b8", borderRadius: facesRight ? "0 8px 8px 0" : "8px 0 0 8px" }} />
          {isMyBed ? <BedIcon sx={{ fontSize: 18, color: "#fff", zIndex: 1 }} /> : <Typography sx={{ fontSize: 10, fontWeight: 700, color: textCol, zIndex: 1 }}>{bed.bedNumber}</Typography>}
          <Typography sx={{ fontSize: 9, color: textCol, opacity: 0.8, zIndex: 1 }}>Normal</Typography>
        </Box>
      </Tooltip>
    );
  }

  // Bunk: two separate halves Top / Bottom
  return (
    <Box sx={{
      position: "relative", width: 52, height: 80, borderRadius: 1.5, overflow: "hidden",
      border, display: "flex", flexDirection: "column",
    }}>
      <Box sx={{ position: "absolute", [facesRight ? "right" : "left"]: 0, top: 0, bottom: 0, width: 6, bgcolor: ROOM_COLORS.bunkFrame, zIndex: 2 }} />
      <BunkHalf bed={bed} position="Top" myBedId={myBedId} pendingBedId={pendingBedId} onRequest={onRequest} />
      <BunkHalf bed={bed} position="Bottom" myBedId={myBedId} pendingBedId={pendingBedId} onRequest={onRequest} />
    </Box>
  );
}

// ─── ROOM CELL ────────────────────────────────────────────────────────────────
function RoomCell({ room, myBedId, pendingBedId, onRequest, slotNum }) {
  const [open, setOpen] = useState(false);
  const occupied = (room.beds || []).filter((b) => b.studentId).length;
  const total = room.beds?.length || 0;
  const hasMyBed = (room.beds || []).some((b) => b.id === myBedId);

  return (
    <Box sx={{ border: hasMyBed ? "2px solid #3b82f6" : "1px solid #dde3ef", borderRadius: 2, overflow: "hidden", minWidth: 90 }}>
      <Box onClick={() => setOpen((p) => !p)} sx={{ px: 1.5, py: 1, cursor: "pointer", bgcolor: hasMyBed ? "rgba(59,130,246,0.06)" : "white", display: "flex", justifyContent: "space-between", alignItems: "center", "&:hover": { bgcolor: "#f8fafc" } }}>
        <Box>
          <Typography variant="caption" fontWeight={800} color={hasMyBed ? "#1d4ed8" : "#1e3a8a"}>{room.roomNumber}</Typography>
          {slotNum && <Typography variant="caption" display="block" color="text.disabled" sx={{ fontSize: 9 }}>Slot {slotNum}</Typography>}
          <Typography variant="caption" display="block" color="text.secondary" sx={{ fontSize: 10 }}>{room.type}</Typography>
        </Box>
        <Chip label={`${occupied}/${total}`} size="small" color={occupied === total ? "error" : occupied > 0 ? "warning" : "success"} sx={{ height: 18, fontSize: 10, fontWeight: 700 }} />
      </Box>
      {open && (
        <Box sx={{ p: 1, bgcolor: "#fafbff", borderTop: "1px solid #e8edf5", display: "flex", flexWrap: "wrap", gap: 0.75, justifyContent: "center" }}>
          {(room.beds || []).map((bed, i) => (
            <BedVisualBox key={bed.id} bed={bed} index={i} myBedId={myBedId} pendingBedId={pendingBedId} onRequest={onRequest} />
          ))}
          {room.beds?.length === 0 && <Typography variant="caption" color="text.secondary">No beds</Typography>}
          <Box sx={{ width: "100%", display: "flex", gap: 1, mt: 0.5, justifyContent: "center", flexWrap: "wrap" }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.4 }}><Box sx={{ width: 10, height: 10, borderRadius: 0.5, bgcolor: "#3b82f6" }} /><Typography sx={{ fontSize: 9 }}>Your Bed</Typography></Box>
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.4 }}><Box sx={{ width: 10, height: 10, borderRadius: 0.5, bgcolor: "#f59e0b" }} /><Typography sx={{ fontSize: 9 }}>Pending</Typography></Box>
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.4 }}><Box sx={{ width: 10, height: 10, borderRadius: 0.5, bgcolor: ROOM_COLORS.occupied }} /><Typography sx={{ fontSize: 9 }}>Occupied</Typography></Box>
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.4 }}><Box sx={{ width: 10, height: 10, borderRadius: 0.5, bgcolor: ROOM_COLORS.free, border: "1px solid #cbd5e1" }} /><Typography sx={{ fontSize: 9 }}>Available</Typography></Box>
          </Box>
        </Box>
      )}
    </Box>
  );
}

// ─── EMPTY SLOT ───────────────────────────────────────────────────────────────
function EmptySlot({ slotNum }) {
  return (
    <Box sx={{ border: "1px dashed #cbd5e1", borderRadius: 2, minWidth: 90, opacity: 0.45 }}>
      <Box sx={{ px: 1.5, py: 1, display: "flex", flexDirection: "column", alignItems: "center" }}>
        <Typography variant="caption" fontWeight={700} color="text.disabled">{slotNum}</Typography>
        <Typography sx={{ fontSize: 9, color: "text.disabled" }}>Empty</Typography>
      </Box>
    </Box>
  );
}

// ─── BLOCK MAP ────────────────────────────────────────────────────────────────
function BlockMapView({ rooms, myBedId, pendingBedId, onRequest }) {
  const [selectedBlock, setSelectedBlock] = useState(null);

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
      const blockRooms = Object.values(grouped[b] || {}).flat();
      const total = blockRooms.reduce((a, r) => a + (r.beds?.length || 0), 0);
      const occupied = blockRooms.reduce((a, r) => a + (r.beds || []).filter((bd) => bd.studentId).length, 0);
      s[b] = { rooms: blockRooms.length, total, occupied, free: total - occupied };
    });
    return s;
  }, [grouped]);

  return (
    <Box>
      <Box sx={{ display: "flex", gap: 2, mb: 3, flexWrap: "nowrap", overflowX: "auto", pb: 1 }}>
        {ALL_BLOCKS.map((block) => {
          const stat = blockStats[block] || {};
          const isActive = selectedBlock === block;
          return (
            <Box key={block} onClick={() => setSelectedBlock(isActive ? null : block)}
              sx={{
                flexShrink: 0, width: 155, cursor: "pointer",
                border: isActive ? "2px solid #6366f1" : "1px solid #e2e8f0",
                borderRadius: 3, p: 2, bgcolor: isActive ? "rgba(99,102,241,0.07)" : "white", transition: "all .2s",
                "&:hover": { borderColor: "#6366f1", bgcolor: "rgba(99,102,241,0.04)", transform: "translateY(-2px)", boxShadow: "0 4px 14px rgba(99,102,241,.15)" },
              }}>
              <Typography variant="h6" fontWeight={800} color={isActive ? "#6366f1" : "#1e3a8a"}>🏢 {block}</Typography>
              <Typography variant="caption" color="text.secondary" display="block">
                {BLOCK_FLOORS[block]?.length} floor(s) · {stat.rooms} room(s)
              </Typography>
              <Box sx={{ display: "flex", gap: 0.5, mt: 0.5, flexWrap: "wrap" }}>
                <Chip label={`${stat.free ?? 0} free`} size="small" color={(stat.free ?? 0) > 0 ? "success" : "error"} sx={{ height: 18, fontSize: 10 }} />
                <Chip label={`${stat.occupied ?? 0} occ.`} size="small" color="default" sx={{ height: 18, fontSize: 10 }} />
              </Box>
            </Box>
          );
        })}
      </Box>

      {selectedBlock && (
        <Box>
          <Typography variant="subtitle1" fontWeight={800} color="#1e3a8a" mb={2}>Block {selectedBlock}</Typography>
          {(BLOCK_FLOORS[selectedBlock] || []).map((fl) => {
            const flKey = String(fl);
            const flRooms = (grouped[selectedBlock]?.[flKey] || []).sort((a, b) => a.roomNumber.localeCompare(b.roomNumber));
            const flBeds = flRooms.reduce((a, r) => a + (r.beds?.length || 0), 0);
            const flOcc = flRooms.reduce((a, r) => a + (r.beds || []).filter((bd) => bd.studentId).length, 0);
            const slots = Array.from({ length: 10 }, (_, i) => ({ label: slotLabel(selectedBlock, fl, i), room: flRooms[i] || null }));
            return (
              <Box key={fl} sx={{ mb: 3 }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 1.5, pb: 0.5, borderBottom: "2px solid #e2e8f0" }}>
                  <Box sx={{ px: 1.5, py: 0.25, bgcolor: "#1e3a8a", borderRadius: 1 }}>
                    <Typography color="white" fontWeight={700} fontSize={13}>F{fl}</Typography>
                  </Box>
                  <Typography variant="caption" color="text.secondary">
                    {flBeds - flOcc} bed(s) available / {flBeds} total · Slots {slotLabel(selectedBlock, fl, 0)} – {slotLabel(selectedBlock, fl, 9)}
                  </Typography>
                </Box>
                <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1.5 }}>
                  {slots.map(({ label, room }) =>
                    room
                      ? <RoomCell key={room.id} room={room} myBedId={myBedId} pendingBedId={pendingBedId} onRequest={onRequest} slotNum={label} />
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

// ─── MAIN PAGE ────────────────────────────────────────────────────────────────
export default function RoomMapPage() {
  const navigate = useNavigate();
  const [rooms, setRooms] = useState([]);
  const [profile, setProfile] = useState(null);
  const [bedRequests, setBedRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  // requestDialog holds the bed object (+ bunkPosition) that was clicked
  const [requestDialog, setRequestDialog] = useState(null);
  const [transferReason, setTransferReason] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const [r, p, br] = await Promise.all([
        studentAPI.getRoomMap(),
        studentAPI.getProfile(),
        studentAPI.getBedRequests(),
      ]);
      setRooms(r.data.rooms || []);
      setProfile(p.data);
      setBedRequests(br.data.requests || []);
    } catch (e) {
      setError(e?.response?.data?.error || "Failed to load room map");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const student = profile?.student;
  const myBedId = student?.bed?.id;
  const pendingRequest = bedRequests.find((r) => r.status === "Pending");
  const pendingBedId = pendingRequest?.bed?.id;
  // Is this a transfer request (student already has a bed)?
  const isTransfer = !!myBedId;

  const handleBedRequest = (bed) => {
    if (pendingRequest) { setError("You already have a pending request. Wait for admin to respond."); return; }
    setRequestDialog(bed);
    setTransferReason("");
  };

  const submitRequest = async () => {
    if (!requestDialog) return;
    // Transfer requires a reason
    if (isTransfer && !transferReason.trim()) {
      setError("Please provide a reason for the transfer request."); return;
    }
    setSubmitting(true); setError("");
    try {
      await studentAPI.submitBedRequest({
        bedId: requestDialog.id,
        bunkPosition: requestDialog.bunkPosition || null,
        reason: isTransfer ? transferReason.trim() : null,
      });
      const posLabel = requestDialog.bunkPosition ? ` (${requestDialog.bunkPosition})` : "";
      setSuccess(`Request submitted for ${requestDialog.room?.roomNumber} / ${requestDialog.bedNumber}${posLabel}. Admin will review it.`);
      setRequestDialog(null);
      setTransferReason("");
      load();
    } catch (e) {
      setError(e?.response?.data?.error || "Failed to submit request");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Box>
      {/* Header */}
      <Paper elevation={0} sx={{
        p: { xs: 3, md: 4 }, borderRadius: 3, mb: 3,
        background: "linear-gradient(135deg, #0f172a 0%, #1e3a8a 60%, #312e81 100%)", position: "relative", overflow: "hidden",
      }}>
        <Box sx={{ position: "absolute", top: -40, right: -40, width: 180, height: 180, borderRadius: "50%", bgcolor: "rgba(255,255,255,0.04)" }} />
        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          <Button startIcon={<ArrowBack />} onClick={() => navigate(-1)} sx={{ color: "rgba(255,255,255,0.8)", textTransform: "none" }}>Back</Button>
          <Box>
            <Typography variant="h5" fontWeight={800} color="white">Room &amp; Bed Availability</Typography>
            <Typography color="rgba(255,255,255,0.65)" variant="body2" mt={0.3}>
              {isTransfer ? "Click a free bed half to request a transfer" : "Click an available bed to request it"}
            </Typography>
          </Box>
        </Box>
      </Paper>

      {/* Status cards */}
      <Box sx={{ display: "flex", gap: 2, mb: 3, flexWrap: "wrap" }}>
        <Paper elevation={0} sx={{ p: 2, border: "1px solid #e2e8f0", borderRadius: 2, flex: "1 1 200px" }}>
          <Typography variant="caption" color="text.secondary">My Current Bed</Typography>
          <Typography fontWeight={700}>{student?.bed ? `${student.bed.room?.roomNumber} / ${student.bed.bedNumber}` : "Not assigned"}</Typography>
        </Paper>
        {pendingRequest && (
          <Paper elevation={0} sx={{ p: 2, border: "1px solid #fbbf24", borderRadius: 2, bgcolor: "#fffbeb", flex: "1 1 200px" }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
              <HourglassEmpty sx={{ fontSize: 16, color: "#d97706" }} />
              <Typography variant="caption" color="#d97706" fontWeight={600}>Pending Request</Typography>
            </Box>
            <Typography fontWeight={700} fontSize={14}>{pendingRequest.bed?.room?.roomNumber} / {pendingRequest.bed?.bedNumber}</Typography>
            {pendingRequest.bunkPosition && <Chip label={`Position: ${pendingRequest.bunkPosition}`} size="small" color="info" sx={{ mt: 0.5 }} />}
            <Chip label="Waiting for admin" size="small" color="warning" sx={{ mt: 0.5, ml: 0.5 }} />
          </Paper>
        )}
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError("")}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess("")}>{success}</Alert>}

      {isTransfer && (
        <Alert severity="info" sx={{ mb: 2 }}>
          🔄 You already have bed <strong>{student.bed.room?.roomNumber} / {student.bed.bedNumber}</strong>. Clicking a free bed will submit a <strong>transfer request</strong> — you will need to provide a reason.
        </Alert>
      )}

      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}><CircularProgress sx={{ color: "#6366f1" }} /></Box>
      ) : (
        <Paper elevation={0} sx={{ p: 3, border: "1px solid #e2e8f0", borderRadius: 3 }}>
          <BlockMapView rooms={rooms} myBedId={myBedId} pendingBedId={pendingBedId} onRequest={handleBedRequest} />
        </Paper>
      )}

      {/* Request History */}
      {bedRequests.length > 0 && (
        <Paper elevation={0} sx={{ p: 3, border: "1px solid #e2e8f0", borderRadius: 3, mt: 3 }}>
          <Typography fontWeight={700} mb={2}>My Request History</Typography>
          {bedRequests.map((r) => (
            <Box key={r.id} sx={{ display: "flex", alignItems: "center", gap: 2, py: 1, borderBottom: "1px solid #f1f5f9" }}>
              <BedIcon sx={{ color: "#6366f1", fontSize: 20 }} />
              <Box sx={{ flex: 1 }}>
                <Typography variant="body2" fontWeight={600}>
                  {r.bed?.room?.roomNumber} / {r.bed?.bedNumber}
                  {r.bunkPosition ? ` (${r.bunkPosition})` : ""} — Block {r.bed?.room?.hostelBlock}
                </Typography>
                {r.reason && <Typography variant="caption" color="text.secondary">Reason: {r.reason}</Typography>}
                <Typography variant="caption" color="text.disabled" display="block">{new Date(r.createdAt).toLocaleDateString()}</Typography>
              </Box>
              <Chip label={r.status} size="small"
                color={r.status === "Approved" ? "success" : r.status === "Rejected" ? "error" : "warning"}
                icon={r.status === "Approved" ? <CheckCircle sx={{ fontSize: 14 }} /> : undefined} />
            </Box>
          ))}
        </Paper>
      )}

      {/* Request / Transfer Confirmation Dialog */}
      <Dialog open={!!requestDialog} onClose={() => { setRequestDialog(null); setTransferReason(""); }} maxWidth="xs" fullWidth>
        <DialogTitle>{isTransfer ? "🔄 Transfer Request" : "🛏 Bed Request"}</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 2 }}>
            {isTransfer
              ? <>You are requesting to <strong>transfer</strong> from <strong>{student?.bed?.room?.roomNumber} / {student?.bed?.bedNumber}</strong> to <strong>{requestDialog?.room?.roomNumber} / {requestDialog?.bedNumber}{requestDialog?.bunkPosition ? ` (${requestDialog.bunkPosition})` : ""}</strong>.</>
              : <>You are requesting bed <strong>{requestDialog?.room?.roomNumber} / {requestDialog?.bedNumber}{requestDialog?.bunkPosition ? ` (${requestDialog.bunkPosition})` : ""}</strong> (Block {requestDialog?.room?.hostelBlock}, F{requestDialog?.room?.floor}). Admin will confirm.</>}
          </DialogContentText>
          {isTransfer && (
            <TextField
              fullWidth required autoFocus
              label="Reason for Transfer *"
              placeholder="e.g. Room maintenance issue, prefer different floor..."
              value={transferReason}
              onChange={(e) => setTransferReason(e.target.value)}
              multiline rows={3}
              error={transferReason.trim() === ""}
              helperText={transferReason.trim() === "" ? "A reason is required for transfer requests" : ""}
            />
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => { setRequestDialog(null); setTransferReason(""); }}>Cancel</Button>
          <Button variant="contained" onClick={submitRequest}
            disabled={submitting || (isTransfer && !transferReason.trim())}>
            {submitting ? "Submitting…" : isTransfer ? "Submit Transfer" : "Submit Request"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
