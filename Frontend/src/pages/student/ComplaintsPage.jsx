import { useState, useEffect, useCallback } from "react";
import {
  Box, Typography, Paper, TextField, Button, Chip, Divider,
  CircularProgress, Alert, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, MenuItem,
} from "@mui/material";
import { ReportProblem, Send, Refresh } from "@mui/icons-material";
import { studentAPI } from "../../services/api";

const COMPLAINT_TYPES = ["Cleaning", "Maintenance", "Electricity", "Water Supply", "Repair"];

const statusColor = {
  Open: "error", InProgress: "warning", StaffNotified: "info",
  DoneByStaff: "secondary", Resolved: "success", Closed: "default",
};

const statusLabel = {
  Open: "Open", InProgress: "In Progress", StaffNotified: "Staff Notified",
  DoneByStaff: "Done by Staff", Resolved: "Done", Closed: "Closed",
};

export default function ComplaintsPage() {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ title: "", description: "" });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const loadComplaints = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await studentAPI.getComplaints();
      setComplaints(data.complaints);
    } catch {
      setError("Failed to load complaints");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadComplaints(); }, [loadComplaints]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim() || !form.description.trim()) {
      setError("Type and description are required");
      return;
    }
    setSubmitting(true);
    setError("");
    setSuccess("");
    try {
      await studentAPI.submitComplaint(form);
      setSuccess("Your complaint has been submitted successfully.");
      setForm({ title: "", description: "" });
      loadComplaints();
    } catch (err) {
      setError(err.response?.data?.error || "Failed to submit complaint");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Box>
      {/* Header */}
      <Paper elevation={0} sx={{
        p: { xs: 3, md: 4 }, borderRadius: 3, mb: 3,
        background: "linear-gradient(135deg, #1e1b4b 0%, #3730a3 50%, #6d28d9 100%)",
        position: "relative", overflow: "hidden",
      }}>
        <Box sx={{ position: "absolute", top: -40, right: -40, width: 180, height: 180, borderRadius: "50%", bgcolor: "rgba(255,255,255,0.04)" }} />
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          <ReportProblem sx={{ color: "#a5b4fc", fontSize: 30 }} />
          <Box>
            <Typography variant="h5" fontWeight={800} color="white">My Complaints</Typography>
            <Typography color="rgba(255,255,255,0.65)" variant="body2" mt={0.3}>
              Submit and track your hostel complaints
            </Typography>
          </Box>
        </Box>
      </Paper>

      {/* Submit form */}
      <Paper elevation={0} sx={{ p: 3, border: "1px solid #e2e8f0", borderRadius: 3, mb: 3 }}>
        <Typography variant="subtitle1" fontWeight={700} color="#1e1b4b" mb={2}>
          Submit a New Complaint
        </Typography>
        <Divider sx={{ mb: 2.5 }} />

        {error && <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }} onClose={() => setError("")}>{error}</Alert>}
        {success && <Alert severity="success" sx={{ mb: 2, borderRadius: 2 }} onClose={() => setSuccess("")}>{success}</Alert>}

        <Box component="form" onSubmit={handleSubmit} noValidate>
          <Typography variant="caption" fontWeight={600} color="#374151" mb={0.5} display="block">
            Title (Type) *
          </Typography>
          <TextField
            fullWidth
            select
            placeholder="Select complaint type"
            value={form.title}
            onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
            sx={{ mb: 2.5 }}
          >
            <MenuItem value="">— Select type —</MenuItem>
            {COMPLAINT_TYPES.map((t) => <MenuItem key={t} value={t}>{t}</MenuItem>)}
          </TextField>

          <Typography variant="caption" fontWeight={600} color="#374151" mb={0.5} display="block">
            Description
          </Typography>
          <TextField
            fullWidth
            multiline
            rows={4}
            placeholder="Describe your complaint in detail..."
            value={form.description}
            onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
            sx={{ mb: 3 }}
          />
          <Button
            type="submit"
            variant="contained"
            disabled={submitting || !form.title.trim() || !form.description.trim()}
            startIcon={submitting ? <CircularProgress size={16} color="inherit" /> : <Send />}
            sx={{
              textTransform: "none", fontWeight: 600,
              background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
              "&:hover": { background: "linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)" },
              boxShadow: "0 4px 14px rgba(99,102,241,0.35)",
            }}
          >
            {submitting ? "Submitting..." : "Submit Complaint"}
          </Button>
        </Box>
      </Paper>

      {/* Complaints list */}
      <Paper elevation={0} sx={{ border: "1px solid #e2e8f0", borderRadius: 3 }}>
        <Box sx={{ p: 3, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Typography variant="subtitle1" fontWeight={700} color="#1e1b4b">
            Submitted Complaints ({complaints.length})
          </Typography>
          <Button size="small" startIcon={<Refresh fontSize="small" />} onClick={loadComplaints} sx={{ textTransform: "none", color: "text.secondary" }}>
            Refresh
          </Button>
        </Box>
        <Divider />
        <TableContainer>
          <Table size="small">
            <TableHead sx={{ bgcolor: "#f8fafc" }}>
              <TableRow>
                {["Title (Type)", "Description", "Status", "Submitted On"].map((h) => (
                  <TableCell key={h} sx={{ fontWeight: 700 }}>{h}</TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={4} align="center" sx={{ py: 4 }}>
                    <CircularProgress size={28} sx={{ color: "#6366f1" }} />
                  </TableCell>
                </TableRow>
              ) : complaints.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} align="center" sx={{ py: 5, color: "text.secondary" }}>
                    No complaints submitted yet
                  </TableCell>
                </TableRow>
              ) : complaints.map((c) => (
                <TableRow key={c.id} hover>
                  <TableCell sx={{ fontWeight: 600, maxWidth: 160 }}>{c.title}</TableCell>
                  <TableCell sx={{ color: "text.secondary", maxWidth: 300 }}>
                    <span style={{ display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                      {c.description}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={statusLabel[c.status] || c.status}
                      color={statusColor[c.status] || "default"}
                      size="small"
                      sx={{ fontWeight: 600 }}
                    />
                  </TableCell>
                  <TableCell sx={{ color: "text.secondary", whiteSpace: "nowrap" }}>
                    {new Date(c.createdAt).toLocaleDateString()}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </Box>
  );
}
