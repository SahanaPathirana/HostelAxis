import { useState, useEffect, useCallback } from "react";
import {
  Box, Tabs, Tab, Typography, Paper, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Chip, Button, TextField,
  Dialog, DialogTitle, DialogContent, DialogActions, MenuItem,
  FormControl, InputLabel, Select, Alert, CircularProgress,
  IconButton, Tooltip, Card, CardContent, Grid, Divider,
} from "@mui/material";
import {
  Add, Delete, CheckCircle, Cancel, PersonSearch, MeetingRoom,
  KingBed, AttachMoney, Receipt, ReportProblem, Refresh,
  HourglassEmpty, VerifiedUser, SwapHoriz,
} from "@mui/icons-material";
import { adminAPI } from "../../services/api";

/* ─── helpers ─── */
const statusColor = {
  Verified: "success", Pending: "warning", Rejected: "error",
  Open: "error", InProgress: "warning", Resolved: "success", Closed: "default",
};

function SectionHeader({ title, onRefresh, loading }) {
  return (
    <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 2.5 }}>
      <Typography variant="h6" fontWeight={700} color="#1e1b4b">{title}</Typography>
      <Tooltip title="Refresh">
        <span>
          <IconButton size="small" onClick={onRefresh} disabled={loading}>
            {loading ? <CircularProgress size={18} /> : <Refresh fontSize="small" />}
          </IconButton>
        </span>
      </Tooltip>
    </Box>
  );
}

/* ═══════════════════════════════════════
   TAB 1 – Student Verification (US2.3)
═══════════════════════════════════════ */
function StudentVerificationPanel() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actingId, setActingId] = useState(null);
  const [filter, setFilter] = useState("All");
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await adminAPI.getStudents();
      setStudents(data.students);
    } catch { setError("Failed to load students"); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleVerify = async (id, status) => {
    setActingId(id);
    try {
      await adminAPI.verifyStudent(id, status);
      setStudents((prev) => prev.map((s) => s.id === id ? { ...s, verificationStatus: status } : s));
    } catch { setError("Failed to update status"); }
    finally { setActingId(null); }
  };

  const filtered = filter === "All" ? students : students.filter((s) => s.verificationStatus === filter);

  return (
    <Box>
      <SectionHeader title="Student Verification" onRefresh={load} loading={loading} />
      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError("")}>{error}</Alert>}

      {/* Stats */}
      <Box sx={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 2, mb: 3 }}>
        {["All", "Pending", "Verified", "Rejected"].map((s) => (
          <Card
            key={s}
            elevation={0}
            onClick={() => setFilter(s)}
            sx={{
              border: filter === s ? "2px solid #6366f1" : "1px solid #e2e8f0",
              borderRadius: 2, cursor: "pointer",
              bgcolor: filter === s ? "#ede9fe" : "white",
              transition: "all 0.15s",
            }}
          >
            <CardContent sx={{ py: 1.5, "&:last-child": { pb: 1.5 } }}>
              <Typography variant="h5" fontWeight={800} color="#1e1b4b">
                {s === "All" ? students.length : students.filter((x) => x.verificationStatus === s).length}
              </Typography>
              <Typography variant="caption" color="text.secondary" fontWeight={600}>{s}</Typography>
            </CardContent>
          </Card>
        ))}
      </Box>

      <TableContainer component={Paper} elevation={0} sx={{ border: "1px solid #e2e8f0", borderRadius: 2 }}>
        <Table size="small">
          <TableHead sx={{ bgcolor: "#f8fafc" }}>
            <TableRow>
              {["Student", "Email", "University ID", "University", "Status", "Actions"].map((h) => (
                <TableCell key={h} sx={{ fontWeight: 700, color: "#374151" }}>{h}</TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={6} align="center" sx={{ py: 4 }}><CircularProgress size={28} /></TableCell></TableRow>
            ) : filtered.length === 0 ? (
              <TableRow><TableCell colSpan={6} align="center" sx={{ py: 4, color: "text.secondary" }}>No students found</TableCell></TableRow>
            ) : filtered.map((s) => (
              <TableRow key={s.id} hover>
                <TableCell sx={{ fontWeight: 600 }}>{s.user.fullName}</TableCell>
                <TableCell sx={{ color: "text.secondary" }}>{s.user.email}</TableCell>
                <TableCell>{s.universityId}</TableCell>
                <TableCell>{s.universityName}</TableCell>
                <TableCell>
                  <Chip label={s.verificationStatus} color={statusColor[s.verificationStatus]} size="small" sx={{ fontWeight: 600 }} />
                </TableCell>
                <TableCell>
                  <Box sx={{ display: "flex", gap: 1 }}>
                    {s.verificationStatus !== "Verified" && (
                      <Button size="small" variant="contained" color="success" startIcon={actingId === s.id ? <CircularProgress size={12} color="inherit" /> : <CheckCircle fontSize="small" />}
                        onClick={() => handleVerify(s.id, "Verified")} disabled={actingId === s.id} sx={{ textTransform: "none", fontSize: "0.75rem" }}>
                        Verify
                      </Button>
                    )}
                    {s.verificationStatus !== "Rejected" && (
                      <Button size="small" variant="outlined" color="error" startIcon={<Cancel fontSize="small" />}
                        onClick={() => handleVerify(s.id, "Rejected")} disabled={actingId === s.id} sx={{ textTransform: "none", fontSize: "0.75rem" }}>
                        Reject
                      </Button>
                    )}
                    {s.verificationStatus !== "Pending" && (
                      <Button size="small" variant="outlined" startIcon={<HourglassEmpty fontSize="small" />}
                        onClick={() => handleVerify(s.id, "Pending")} disabled={actingId === s.id} sx={{ textTransform: "none", fontSize: "0.75rem", borderColor: "#e2e8f0" }}>
                        Reset
                      </Button>
                    )}
                  </Box>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}

/* ═══════════════════════════════════════
   TAB 2 – Room Management (US3.1 & US3.4)
═══════════════════════════════════════ */
function RoomsPanel() {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({ roomNumber: "", type: "Single", capacity: 1, floor: "", hostelBlock: "" });

  const load = useCallback(async () => {
    setLoading(true);
    try { const { data } = await adminAPI.getRooms(); setRooms(data.rooms); }
    catch { setError("Failed to load rooms"); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleAdd = async () => {
    setSaving(true); setError("");
    try {
      await adminAPI.addRoom({ ...form, capacity: parseInt(form.capacity) || 1, floor: form.floor ? parseInt(form.floor) : undefined });
      setDialogOpen(false);
      setForm({ roomNumber: "", type: "Single", capacity: 1, floor: "", hostelBlock: "" });
      load();
    } catch (err) {
      setError(err.response?.data?.error || "Failed to add room");
    } finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this room? All its beds must be unoccupied.")) return;
    try { await adminAPI.deleteRoom(id); load(); }
    catch (err) { setError(err.response?.data?.error || "Failed to delete room"); }
  };

  return (
    <Box>
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 2.5 }}>
        <Typography variant="h6" fontWeight={700} color="#1e1b4b">Room Management</Typography>
        <Box sx={{ display: "flex", gap: 1 }}>
          <Tooltip title="Refresh"><IconButton size="small" onClick={load} disabled={loading}>{loading ? <CircularProgress size={18} /> : <Refresh fontSize="small" />}</IconButton></Tooltip>
          <Button variant="contained" size="small" startIcon={<Add />} onClick={() => setDialogOpen(true)}
            sx={{ textTransform: "none", background: "linear-gradient(135deg,#6366f1,#8b5cf6)" }}>
            Add Room
          </Button>
        </Box>
      </Box>
      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError("")}>{error}</Alert>}

      <TableContainer component={Paper} elevation={0} sx={{ border: "1px solid #e2e8f0", borderRadius: 2 }}>
        <Table size="small">
          <TableHead sx={{ bgcolor: "#f8fafc" }}>
            <TableRow>
              {["Room No.", "Type", "Capacity", "Floor", "Block", "Occupied", "Actions"].map((h) => (
                <TableCell key={h} sx={{ fontWeight: 700 }}>{h}</TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={7} align="center" sx={{ py: 4 }}><CircularProgress size={28} /></TableCell></TableRow>
            ) : rooms.length === 0 ? (
              <TableRow><TableCell colSpan={7} align="center" sx={{ py: 4, color: "text.secondary" }}>No rooms added yet</TableCell></TableRow>
            ) : rooms.map((r) => {
              const occupied = r.beds.filter((b) => b.studentId).length;
              return (
                <TableRow key={r.id} hover>
                  <TableCell sx={{ fontWeight: 700 }}>{r.roomNumber}</TableCell>
                  <TableCell><Chip label={r.type} size="small" variant="outlined" /></TableCell>
                  <TableCell>{r.capacity}</TableCell>
                  <TableCell>{r.floor ?? "—"}</TableCell>
                  <TableCell>{r.hostelBlock ?? "—"}</TableCell>
                  <TableCell>
                    <Chip label={`${occupied} / ${r.beds.length}`} size="small"
                      color={occupied === r.beds.length ? "error" : occupied > 0 ? "warning" : "success"} />
                  </TableCell>
                  <TableCell>
                    <IconButton size="small" color="error" onClick={() => handleDelete(r.id)}>
                      <Delete fontSize="small" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Add Room Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>Add New Room</DialogTitle>
        <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2, pt: "16px !important" }}>
          <TextField label="Room Number" value={form.roomNumber} onChange={(e) => setForm((p) => ({ ...p, roomNumber: e.target.value }))} fullWidth required />
          <FormControl fullWidth>
            <InputLabel>Type</InputLabel>
            <Select label="Type" value={form.type} onChange={(e) => setForm((p) => ({ ...p, type: e.target.value }))}>
              {["Single", "Double", "Triple", "Quad"].map((t) => <MenuItem key={t} value={t}>{t}</MenuItem>)}
            </Select>
          </FormControl>
          <TextField label="Capacity (beds)" type="number" value={form.capacity}
            onChange={(e) => setForm((p) => ({ ...p, capacity: e.target.value }))} fullWidth required inputProps={{ min: 1, max: 10 }} />
          <TextField label="Floor (optional)" type="number" value={form.floor}
            onChange={(e) => setForm((p) => ({ ...p, floor: e.target.value }))} fullWidth />
          <TextField label="Hostel Block (optional)" value={form.hostelBlock}
            onChange={(e) => setForm((p) => ({ ...p, hostelBlock: e.target.value }))} fullWidth />
          {error && <Alert severity="error">{error}</Alert>}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleAdd} disabled={saving || !form.roomNumber}
            sx={{ background: "linear-gradient(135deg,#6366f1,#8b5cf6)", textTransform: "none" }}>
            {saving ? <CircularProgress size={18} color="inherit" /> : "Create Room"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

/* ═══════════════════════════════════════
   TAB 3 – Bed Assignment (US4.1)
═══════════════════════════════════════ */
function BedAssignmentPanel() {
  const [rooms, setRooms] = useState([]);
  const [students, setStudents] = useState([]);
  const [availableBeds, setAvailableBeds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ studentId: "", bedId: "" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [r, s, b] = await Promise.all([adminAPI.getRooms(), adminAPI.getStudents(), adminAPI.getAvailableBeds()]);
      setRooms(r.data.rooms);
      setStudents(s.data.students);
      setAvailableBeds(b.data.beds);
    } catch { setError("Failed to load data"); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const unassignedVerified = students.filter((s) => s.verificationStatus === "Verified" && !s.bed);

  const handleAssign = async () => {
    if (!form.studentId || !form.bedId) { setError("Please select both a student and a bed"); return; }
    setSaving(true); setError(""); setSuccess("");
    try {
      await adminAPI.assignBed(form.bedId, form.studentId);
      setSuccess("Bed assigned successfully!");
      setForm({ studentId: "", bedId: "" });
      load();
    } catch (err) {
      setError(err.response?.data?.error || "Failed to assign bed");
    } finally { setSaving(false); }
  };

  const handleUnassign = async (bedId) => {
    try { await adminAPI.unassignBed(bedId); load(); }
    catch (err) { setError(err.response?.data?.error || "Failed to unassign"); }
  };

  return (
    <Box>
      <SectionHeader title="Bed Assignment" onRefresh={load} loading={loading} />
      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError("")}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess("")}>{success}</Alert>}

      {/* Assignment form */}
      <Paper elevation={0} sx={{ p: 3, border: "1px solid #e2e8f0", borderRadius: 2, mb: 3 }}>
        <Typography variant="subtitle2" fontWeight={700} color="#1e1b4b" mb={2}>Assign a Bed</Typography>
        <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr auto", gap: 2, alignItems: "flex-start" }}>
          <FormControl fullWidth size="small">
            <InputLabel>Verified Student</InputLabel>
            <Select label="Verified Student" value={form.studentId} onChange={(e) => setForm((p) => ({ ...p, studentId: e.target.value }))}>
              {unassignedVerified.length === 0
                ? <MenuItem disabled value="">No unassigned verified students</MenuItem>
                : unassignedVerified.map((s) => (
                  <MenuItem key={s.id} value={s.id}>{s.user.fullName} — {s.universityId}</MenuItem>
                ))}
            </Select>
          </FormControl>
          <FormControl fullWidth size="small">
            <InputLabel>Available Bed</InputLabel>
            <Select label="Available Bed" value={form.bedId} onChange={(e) => setForm((p) => ({ ...p, bedId: e.target.value }))}>
              {availableBeds.length === 0
                ? <MenuItem disabled value="">No available beds</MenuItem>
                : availableBeds.map((b) => (
                  <MenuItem key={b.id} value={b.id}>Room {b.room.roomNumber} — {b.bedNumber}</MenuItem>
                ))}
            </Select>
          </FormControl>
          <Button variant="contained" startIcon={saving ? <CircularProgress size={16} color="inherit" /> : <SwapHoriz />}
            onClick={handleAssign} disabled={saving || !form.studentId || !form.bedId}
            sx={{ textTransform: "none", height: 40, background: "linear-gradient(135deg,#6366f1,#8b5cf6)", whiteSpace: "nowrap" }}>
            Assign
          </Button>
        </Box>
      </Paper>

      {/* Current assignments */}
      <Typography variant="subtitle2" fontWeight={700} color="#1e1b4b" mb={1.5}>Current Assignments</Typography>
      <TableContainer component={Paper} elevation={0} sx={{ border: "1px solid #e2e8f0", borderRadius: 2 }}>
        <Table size="small">
          <TableHead sx={{ bgcolor: "#f8fafc" }}>
            <TableRow>
              {["Student", "Room", "Bed", "Assigned On", "Actions"].map((h) => (
                <TableCell key={h} sx={{ fontWeight: 700 }}>{h}</TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={5} align="center" sx={{ py: 4 }}><CircularProgress size={28} /></TableCell></TableRow>
            ) : rooms.flatMap((r) => r.beds.filter((b) => b.studentId)).length === 0 ? (
              <TableRow><TableCell colSpan={5} align="center" sx={{ py: 4, color: "text.secondary" }}>No beds assigned yet</TableCell></TableRow>
            ) : rooms.flatMap((r) =>
              r.beds.filter((b) => b.studentId).map((b) => (
                <TableRow key={b.id} hover>
                  <TableCell sx={{ fontWeight: 600 }}>{b.student?.user?.fullName}</TableCell>
                  <TableCell>{r.roomNumber}</TableCell>
                  <TableCell>{b.bedNumber}</TableCell>
                  <TableCell sx={{ color: "text.secondary" }}>{b.assignedAt ? new Date(b.assignedAt).toLocaleDateString() : "—"}</TableCell>
                  <TableCell>
                    <Button size="small" color="error" variant="outlined" onClick={() => handleUnassign(b.id)} sx={{ textTransform: "none", fontSize: "0.75rem" }}>
                      Unassign
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}

/* ═══════════════════════════════════════
   TAB 4 – Fee Plans (US5.1)
═══════════════════════════════════════ */
function FeePlansPanel() {
  const [feePlans, setFeePlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({ name: "", amount: "", period: "Monthly", description: "" });

  const load = useCallback(async () => {
    setLoading(true);
    try { const { data } = await adminAPI.getFeePlans(); setFeePlans(data.feePlans); }
    catch { setError("Failed to load fee plans"); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleCreate = async () => {
    setSaving(true); setError("");
    try {
      await adminAPI.createFeePlan(form);
      setForm({ name: "", amount: "", period: "Monthly", description: "" });
      load();
    } catch (err) {
      setError(err.response?.data?.error || "Failed to create fee plan");
    } finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this fee plan?")) return;
    try { await adminAPI.deleteFeePlan(id); load(); }
    catch (err) { setError(err.response?.data?.error || "Failed to delete"); }
  };

  return (
    <Box>
      <SectionHeader title="Fee Plans" onRefresh={load} loading={loading} />
      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError("")}>{error}</Alert>}

      {/* Create form */}
      <Paper elevation={0} sx={{ p: 3, border: "1px solid #e2e8f0", borderRadius: 2, mb: 3 }}>
        <Typography variant="subtitle2" fontWeight={700} color="#1e1b4b" mb={2}>Create Fee Plan</Typography>
        <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 2, mb: 2 }}>
          <TextField label="Plan Name" size="small" value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} required />
          <TextField label="Amount (LKR)" size="small" type="number" value={form.amount} onChange={(e) => setForm((p) => ({ ...p, amount: e.target.value }))} inputProps={{ min: 0 }} required />
          <FormControl size="small">
            <InputLabel>Period</InputLabel>
            <Select label="Period" value={form.period} onChange={(e) => setForm((p) => ({ ...p, period: e.target.value }))}>
              {["Monthly", "Semester", "Annual"].map((p) => <MenuItem key={p} value={p}>{p}</MenuItem>)}
            </Select>
          </FormControl>
        </Box>
        <TextField label="Description (optional)" size="small" value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} fullWidth sx={{ mb: 2 }} />
        <Button variant="contained" startIcon={saving ? <CircularProgress size={16} color="inherit" /> : <Add />}
          onClick={handleCreate} disabled={saving || !form.name || !form.amount}
          sx={{ textTransform: "none", background: "linear-gradient(135deg,#6366f1,#8b5cf6)" }}>
          Create Plan
        </Button>
      </Paper>

      {/* List */}
      <Box sx={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 2 }}>
        {loading ? <CircularProgress /> : feePlans.length === 0
          ? <Typography color="text.secondary">No fee plans yet</Typography>
          : feePlans.map((p) => (
            <Card key={p.id} elevation={0} sx={{ border: "1px solid #e2e8f0", borderRadius: 2 }}>
              <CardContent>
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <Box>
                    <Typography variant="subtitle2" fontWeight={700}>{p.name}</Typography>
                    <Typography variant="h5" fontWeight={800} color="#6366f1">LKR {p.amount.toLocaleString()}</Typography>
                    <Chip label={p.period} size="small" sx={{ mt: 0.5 }} />
                    {p.description && <Typography variant="caption" color="text.secondary" display="block" mt={0.5}>{p.description}</Typography>}
                  </Box>
                  <IconButton size="small" color="error" onClick={() => handleDelete(p.id)}><Delete fontSize="small" /></IconButton>
                </Box>
              </CardContent>
            </Card>
          ))}
      </Box>
    </Box>
  );
}

/* ═══════════════════════════════════════
   TAB 5 – Payments (US5.4)
═══════════════════════════════════════ */
function PaymentsPanel() {
  const [payments, setPayments] = useState([]);
  const [students, setStudents] = useState([]);
  const [feePlans, setFeePlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [form, setForm] = useState({ studentId: "", feePlanId: "", amount: "", notes: "" });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [p, s, f] = await Promise.all([adminAPI.getPayments(), adminAPI.getStudents(), adminAPI.getFeePlans()]);
      setPayments(p.data.payments);
      setStudents(s.data.students.filter((x) => x.verificationStatus === "Verified"));
      setFeePlans(f.data.feePlans);
    } catch { setError("Failed to load data"); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleRecord = async () => {
    setSaving(true); setError(""); setSuccess("");
    try {
      await adminAPI.recordPayment(form);
      setSuccess("Payment recorded!");
      setForm({ studentId: "", feePlanId: "", amount: "", notes: "" });
      load();
    } catch (err) {
      setError(err.response?.data?.error || "Failed to record payment");
    } finally { setSaving(false); }
  };

  return (
    <Box>
      <SectionHeader title="Payments" onRefresh={load} loading={loading} />
      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError("")}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess("")}>{success}</Alert>}

      {/* Record form */}
      <Paper elevation={0} sx={{ p: 3, border: "1px solid #e2e8f0", borderRadius: 2, mb: 3 }}>
        <Typography variant="subtitle2" fontWeight={700} color="#1e1b4b" mb={2}>Record Payment</Typography>
        <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 2, mb: 2 }}>
          <FormControl size="small">
            <InputLabel>Student</InputLabel>
            <Select label="Student" value={form.studentId} onChange={(e) => setForm((p) => ({ ...p, studentId: e.target.value }))}>
              {students.map((s) => <MenuItem key={s.id} value={s.id}>{s.user.fullName}</MenuItem>)}
            </Select>
          </FormControl>
          <FormControl size="small">
            <InputLabel>Fee Plan</InputLabel>
            <Select label="Fee Plan" value={form.feePlanId} onChange={(e) => setForm((p) => ({ ...p, feePlanId: e.target.value }))}>
              {feePlans.map((f) => <MenuItem key={f.id} value={f.id}>{f.name} — LKR {f.amount}</MenuItem>)}
            </Select>
          </FormControl>
          <TextField label="Amount (LKR)" size="small" type="number" value={form.amount} onChange={(e) => setForm((p) => ({ ...p, amount: e.target.value }))} inputProps={{ min: 0 }} />
        </Box>
        <TextField label="Notes (optional)" size="small" value={form.notes} onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))} fullWidth sx={{ mb: 2 }} />
        <Button variant="contained" startIcon={saving ? <CircularProgress size={16} color="inherit" /> : <Receipt />}
          onClick={handleRecord} disabled={saving || !form.studentId || !form.feePlanId || !form.amount}
          sx={{ textTransform: "none", background: "linear-gradient(135deg,#6366f1,#8b5cf6)" }}>
          Record Payment
        </Button>
      </Paper>

      {/* History */}
      <TableContainer component={Paper} elevation={0} sx={{ border: "1px solid #e2e8f0", borderRadius: 2 }}>
        <Table size="small">
          <TableHead sx={{ bgcolor: "#f8fafc" }}>
            <TableRow>
              {["Student", "Fee Plan", "Amount", "Date", "Notes"].map((h) => (
                <TableCell key={h} sx={{ fontWeight: 700 }}>{h}</TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={5} align="center" sx={{ py: 4 }}><CircularProgress size={28} /></TableCell></TableRow>
            ) : payments.length === 0 ? (
              <TableRow><TableCell colSpan={5} align="center" sx={{ py: 4, color: "text.secondary" }}>No payments recorded</TableCell></TableRow>
            ) : payments.map((p) => (
              <TableRow key={p.id} hover>
                <TableCell sx={{ fontWeight: 600 }}>{p.student?.user?.fullName}</TableCell>
                <TableCell>{p.feePlan?.name}</TableCell>
                <TableCell sx={{ color: "#10b981", fontWeight: 700 }}>LKR {p.amount.toLocaleString()}</TableCell>
                <TableCell sx={{ color: "text.secondary" }}>{new Date(p.paidAt).toLocaleDateString()}</TableCell>
                <TableCell sx={{ color: "text.secondary" }}>{p.notes || "—"}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}

/* ═══════════════════════════════════════
   TAB 6 – Complaints (US6.1)
═══════════════════════════════════════ */
function ComplaintsPanel() {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try { const { data } = await adminAPI.getAllComplaints(); setComplaints(data.complaints); }
    catch { setError("Failed to load complaints"); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleStatus = async (id, status) => {
    try {
      await adminAPI.updateComplaintStatus(id, status);
      setComplaints((prev) => prev.map((c) => c.id === id ? { ...c, status } : c));
    } catch { setError("Failed to update status"); }
  };

  return (
    <Box>
      <SectionHeader title="Complaints" onRefresh={load} loading={loading} />
      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError("")}>{error}</Alert>}

      <TableContainer component={Paper} elevation={0} sx={{ border: "1px solid #e2e8f0", borderRadius: 2 }}>
        <Table size="small">
          <TableHead sx={{ bgcolor: "#f8fafc" }}>
            <TableRow>
              {["Student", "Title", "Description", "Status", "Date", "Update Status"].map((h) => (
                <TableCell key={h} sx={{ fontWeight: 700 }}>{h}</TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={6} align="center" sx={{ py: 4 }}><CircularProgress size={28} /></TableCell></TableRow>
            ) : complaints.length === 0 ? (
              <TableRow><TableCell colSpan={6} align="center" sx={{ py: 4, color: "text.secondary" }}>No complaints submitted</TableCell></TableRow>
            ) : complaints.map((c) => (
              <TableRow key={c.id} hover>
                <TableCell sx={{ fontWeight: 600, whiteSpace: "nowrap" }}>{c.student?.user?.fullName}</TableCell>
                <TableCell sx={{ maxWidth: 160 }}>{c.title}</TableCell>
                <TableCell sx={{ maxWidth: 220, color: "text.secondary" }}>
                  <Tooltip title={c.description}>
                    <span style={{ display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                      {c.description}
                    </span>
                  </Tooltip>
                </TableCell>
                <TableCell>
                  <Chip label={c.status} color={statusColor[c.status]} size="small" sx={{ fontWeight: 600 }} />
                </TableCell>
                <TableCell sx={{ color: "text.secondary", whiteSpace: "nowrap" }}>
                  {new Date(c.createdAt).toLocaleDateString()}
                </TableCell>
                <TableCell>
                  <FormControl size="small" sx={{ minWidth: 130 }}>
                    <Select value={c.status} onChange={(e) => handleStatus(c.id, e.target.value)}>
                      {["Open", "InProgress", "Resolved", "Closed"].map((s) => (
                        <MenuItem key={s} value={s}>{s}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}

/* ═══════════════════════════════════════
   MAIN ADMIN DASHBOARD
═══════════════════════════════════════ */
const TABS = [
  { label: "Verification", icon: <PersonSearch fontSize="small" /> },
  { label: "Rooms", icon: <MeetingRoom fontSize="small" /> },
  { label: "Bed Assignment", icon: <KingBed fontSize="small" /> },
  { label: "Fee Plans", icon: <AttachMoney fontSize="small" /> },
  { label: "Payments", icon: <Receipt fontSize="small" /> },
  { label: "Complaints", icon: <ReportProblem fontSize="small" /> },
];

export default function AdminDashboardPage() {
  const [tab, setTab] = useState(0);

  return (
    <Box>
      {/* Header */}
      <Paper elevation={0} sx={{
        p: { xs: 3, md: 4 }, borderRadius: 3, mb: 3,
        background: "linear-gradient(135deg, #1e1b4b 0%, #3730a3 50%, #6d28d9 100%)",
        position: "relative", overflow: "hidden",
      }}>
        <Box sx={{ position: "absolute", top: -40, right: -40, width: 200, height: 200, borderRadius: "50%", bgcolor: "rgba(255,255,255,0.04)" }} />
        <Typography variant="h5" fontWeight={800} color="white">Admin Control Panel</Typography>
        <Typography color="rgba(255,255,255,0.65)" variant="body2" mt={0.5}>
          Manage students, rooms, beds, fee plans, payments and complaints
        </Typography>
      </Paper>

      {/* Tabs */}
      <Paper elevation={0} sx={{ border: "1px solid #e2e8f0", borderRadius: 3, overflow: "hidden" }}>
        <Box sx={{ borderBottom: "1px solid #e2e8f0", bgcolor: "#f8fafc" }}>
          <Tabs
            value={tab}
            onChange={(_, v) => setTab(v)}
            variant="scrollable"
            scrollButtons="auto"
            sx={{ "& .MuiTab-root": { textTransform: "none", fontWeight: 600, minHeight: 52 } }}
          >
            {TABS.map((t) => (
              <Tab key={t.label} label={t.label} icon={t.icon} iconPosition="start" />
            ))}
          </Tabs>
        </Box>
        <Box sx={{ p: { xs: 2.5, md: 3.5 } }}>
          {tab === 0 && <StudentVerificationPanel />}
          {tab === 1 && <RoomsPanel />}
          {tab === 2 && <BedAssignmentPanel />}
          {tab === 3 && <FeePlansPanel />}
          {tab === 4 && <PaymentsPanel />}
          {tab === 5 && <ComplaintsPanel />}
        </Box>
      </Paper>
    </Box>
  );
}
