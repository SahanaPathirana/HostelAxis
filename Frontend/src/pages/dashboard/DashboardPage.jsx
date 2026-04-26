import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Alert, Badge, Box, Button, Chip, Divider, IconButton,
  Menu, MenuItem, Paper, TextField, Typography,
} from "@mui/material";
import { Notifications, ReportProblem, Payments, CheckCircle, MapOutlined } from "@mui/icons-material";
import { studentAPI } from "../../services/api";

export default function DashboardPage() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [feePlans, setFeePlans] = useState([]);
  const [feePlanError, setFeePlanError] = useState("");
  const [feePlanLoading, setFeePlanLoading] = useState(true);
  const [notifications, setNotifications] = useState([]);
  const [notifAnchor, setNotifAnchor] = useState(null);
  const [message, setMessage] = useState({ text: "", type: "info" });
  const [planMsg, setPlanMsg] = useState("");
  const [paymentForm, setPaymentForm] = useState({ feePlanId: "", method: "Cash", date: "", paidAmount: "", slipUrl: "" });
  const [bedRequests, setBedRequests] = useState([]);

  const load = async () => {
    const [p, n] = await Promise.all([
      studentAPI.getProfile().catch(() => ({ data: null })),
      studentAPI.getNotifications().catch(() => ({ data: { notifications: [] } })),
    ]);
    setProfile(p.data);
    setNotifications(n.data.notifications || []);
    if (p.data?.student?.currentFeePlanId) {
      setPaymentForm((prev) => ({ ...prev, feePlanId: p.data.student.currentFeePlanId }));
    }
    setFeePlanLoading(true);
    setFeePlanError("");
    try {
      const fp = await studentAPI.getFeePlans();
      setFeePlans(fp.data.feePlans || []);
    } catch (err) {
      setFeePlanError(err?.response?.data?.error || err?.message || "Could not load fee plans");
    } finally {
      setFeePlanLoading(false);
    }
  };

  const loadBedRequests = async () => {
    try { const { data } = await studentAPI.getBedRequests(); setBedRequests(data.requests || []); } catch { }
  };

  useEffect(() => { load(); loadBedRequests(); }, []);

  const student = profile?.student;
  const verified = student?.verificationStatus === "Verified";
  const unreadCount = notifications.filter((n) => !n.read).length;
  const currentPlan = useMemo(() => feePlans.find((p) => p.id === student?.currentFeePlanId), [feePlans, student]);
  const pendingRequest = bedRequests.find((r) => r.status === "Pending");

  const setPlan = async (feePlanId) => {
    try {
      await studentAPI.setCurrentFeePlan(feePlanId);
      setPlanMsg("Fee plan updated successfully!");
      setPaymentForm((p) => ({ ...p, feePlanId }));
      load();
    } catch (err) {
      setPlanMsg(err.response?.data?.error || "Failed to update fee plan");
    }
  };

  const submitPayment = async () => {
    if (!student?.bed) return setMessage({ text: "You must be assigned to a bed before making a payment.", type: "error" });
    if (!student?.currentFeePlanId) return setMessage({ text: "You must select a fee plan before making a payment.", type: "error" });
    if (!paymentForm.feePlanId) return setMessage({ text: "Please select a fee plan first", type: "error" });
    if (!paymentForm.date) return setMessage({ text: "Please enter a payment date", type: "error" });
    if (!paymentForm.paidAmount || Number(paymentForm.paidAmount) <= 0)
      return setMessage({ text: "Please enter the amount you paid", type: "error" });
    try {
      await studentAPI.submitPaymentRequest(paymentForm);
      setMessage({ text: "Payment request submitted! Admin has been notified.", type: "success" });
      setPaymentForm((p) => ({ ...p, paidAmount: "", slipUrl: "" }));
    } catch (err) {
      setMessage({ text: err.response?.data?.error || "Failed to submit payment request", type: "error" });
    }
  };

  const markNotifRead = async (n) => {
    if (!n.read) { try { await studentAPI.markNotificationRead(n.id); load(); } catch { } }
    setNotifAnchor(null);
  };

  return (
    <Box>
      {/* Header */}
      <Paper elevation={0} sx={{ p: 3, border: "1px solid #e2e8f0", mb: 2, borderRadius: 3 }}>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Box>
            <Typography variant="h6" fontWeight={700}>Student Dashboard</Typography>
            <Typography color="text.secondary" variant="body2">Your hostel account overview</Typography>
          </Box>
          {verified && (
            <>
              <IconButton onClick={(e) => setNotifAnchor(e.currentTarget)}>
                <Badge badgeContent={unreadCount} color="error"><Notifications /></Badge>
              </IconButton>
              <Menu anchorEl={notifAnchor} open={!!notifAnchor} onClose={() => setNotifAnchor(null)}
                PaperProps={{ sx: { width: 320, maxHeight: 400 } }}>
                <Box sx={{ px: 2, py: 1 }}><Typography fontWeight={700} variant="subtitle2">Notifications</Typography></Box>
                <Divider />
                {notifications.length === 0 && <MenuItem disabled><Typography variant="body2" color="text.secondary">No notifications</Typography></MenuItem>}
                {notifications.map((n) => (
                  <MenuItem key={n.id} onClick={() => markNotifRead(n)}
                    sx={{ whiteSpace: "normal", bgcolor: n.read ? "transparent" : "rgba(99,102,241,0.06)", py: 1.5 }}>
                    <Box>
                      <Typography variant="body2" fontWeight={n.read ? 400 : 700}>{n.title}</Typography>
                      <Typography variant="caption" color="text.secondary">{n.message}</Typography>
                    </Box>
                  </MenuItem>
                ))}
              </Menu>
            </>
          )}
        </Box>
      </Paper>

      {/* Profile & Status */}
      <Paper elevation={0} sx={{ p: 3, border: "1px solid #e2e8f0", mb: 2, borderRadius: 3 }}>
        <Chip label={`Verification Status: ${student?.verificationStatus || "Pending"}`} color={verified ? "success" : "warning"} sx={{ mb: 2 }} />
        <Divider sx={{ mb: 2 }} />
        {!verified ? (
          <Typography color="text.secondary">Your account is pending admin verification. Only your verification status is visible until then.</Typography>
        ) : (
          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" }, gap: 2 }}>
            <TextField label="Full Name" value={profile?.fullName || ""} InputProps={{ readOnly: true }} />
            <TextField label="University ID" value={student?.universityId || ""} InputProps={{ readOnly: true }} />
            <TextField label="University" value={student?.universityName || ""} InputProps={{ readOnly: true }} />
            <TextField label="Phone" value={profile?.phone || ""} InputProps={{ readOnly: true }} />
            <TextField label="Room" value={student?.bed?.room?.roomNumber || "Not assigned"} InputProps={{ readOnly: true }} />
            <TextField label="Bed" value={student?.bed?.bedNumber || "Not assigned"} InputProps={{ readOnly: true }} />
          </Box>
        )}
      </Paper>

      {verified && (
        <>
          {/* Fee Plan Selection */}
          <Paper elevation={0} sx={{ p: 3, border: "1px solid #e2e8f0", mb: 2, borderRadius: 3 }}>
            <Typography fontWeight={700} mb={0.5}>Select Your Fee Plan</Typography>
            <Typography variant="body2" color="text.secondary" mb={2}>
              Choose the hostel fee plan that applies to you. Your current plan:{" "}
              <strong>{currentPlan ? `${currentPlan.name} — LKR ${currentPlan.amount} / ${currentPlan.months} month(s)` : "None selected"}</strong>
            </Typography>
            {feePlanError && (
              <Alert severity="error" sx={{ mb: 2 }} action={<Button color="inherit" size="small" onClick={load}>Retry</Button>}>
                Could not load fee plans: {feePlanError}
              </Alert>
            )}
            {planMsg && <Alert severity={planMsg.includes("success") ? "success" : "info"} sx={{ mb: 2 }} onClose={() => setPlanMsg("")}>{planMsg}</Alert>}
            {feePlanLoading ? (
              <Typography variant="body2" color="text.secondary">Loading fee plans…</Typography>
            ) : feePlans.length === 0 && !feePlanError ? (
              <Typography color="text.secondary" variant="body2">No fee plans available yet. Contact admin.</Typography>
            ) : (
              <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1.5 }}>
                {feePlans.map((plan) => {
                  const isSelected = plan.id === student?.currentFeePlanId;
                  return (
                    <Box key={plan.id} onClick={() => setPlan(plan.id)} sx={{
                      border: isSelected ? "2px solid #6366f1" : "1px solid #e2e8f0",
                      borderRadius: 2, p: 2, cursor: "pointer", minWidth: 180,
                      bgcolor: isSelected ? "rgba(99,102,241,0.06)" : "white", transition: "all 0.2s",
                      "&:hover": { borderColor: "#6366f1", bgcolor: "rgba(99,102,241,0.04)" },
                    }}>
                      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <Typography fontWeight={700} variant="body2">{plan.name}</Typography>
                        {isSelected && <CheckCircle sx={{ color: "#6366f1", fontSize: 18 }} />}
                      </Box>
                      <Typography variant="h6" fontWeight={800} color="primary">LKR {plan.amount}</Typography>
                      <Typography variant="caption" color="text.secondary">{plan.months} month(s)</Typography>
                      {plan.description && <Typography variant="caption" display="block" color="text.secondary">{plan.description}</Typography>}
                    </Box>
                  );
                })}
              </Box>
            )}
          </Paper>

          {/* Payment Request */}
          <Paper elevation={0} sx={{ p: 3, border: "1px solid #e2e8f0", mb: 2, borderRadius: 3 }}>
            <Typography fontWeight={700} mb={0.5}>Submit Payment Request</Typography>
            <Typography variant="body2" color="text.secondary" mb={2}>
              After making your payment, fill in the details below. Admin will review and confirm.
            </Typography>

            {(!student?.bed || !student?.currentFeePlanId) && (
              <Alert severity="warning" sx={{ mb: 2 }}>
                {!student?.bed
                  ? "⚠️ You must be assigned to a bed by admin before you can submit a payment."
                  : "⚠️ Please select a fee plan above before submitting a payment."}
              </Alert>
            )}

            {message.text && (
              <Alert severity={message.type} sx={{ mb: 2, borderRadius: 2 }} onClose={() => setMessage({ text: "", type: "info" })}>
                {message.text}
              </Alert>
            )}

            <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" }, gap: 2, mb: 2 }}>
              <TextField select label="Fee Plan" value={paymentForm.feePlanId}
                onChange={(e) => setPaymentForm((p) => ({ ...p, feePlanId: e.target.value }))}
                helperText={currentPlan ? `Current: ${currentPlan.name}` : "Select a fee plan above first"}>
                {feePlans.length === 0 && <MenuItem disabled value="">No fee plans available</MenuItem>}
                {feePlans.map((plan) => <MenuItem key={plan.id} value={plan.id}>{plan.name} — LKR {plan.amount}</MenuItem>)}
              </TextField>

              <TextField select label="Payment Method" value={paymentForm.method}
                onChange={(e) => setPaymentForm((p) => ({ ...p, method: e.target.value }))}>
                <MenuItem value="Cash">Cash</MenuItem>
                <MenuItem value="OnlineTransfer">Online Transfer</MenuItem>
              </TextField>

              <TextField
                type="date" label="Payment Date" InputLabelProps={{ shrink: true }}
                inputProps={{ min: new Date().toISOString().split("T")[0] }}
                value={paymentForm.date}
                onChange={(e) => setPaymentForm((p) => ({ ...p, date: e.target.value }))}
                helperText="Only today or future dates allowed"
              />

              <TextField label="Amount Paid (LKR)" type="number" value={paymentForm.paidAmount}
                onChange={(e) => setPaymentForm((p) => ({ ...p, paidAmount: e.target.value }))} />

              {paymentForm.method === "OnlineTransfer" && (
                <TextField label="Slip URL (link to receipt image/pdf)" value={paymentForm.slipUrl}
                  onChange={(e) => setPaymentForm((p) => ({ ...p, slipUrl: e.target.value }))}
                  sx={{ gridColumn: "1 / -1" }} />
              )}
            </Box>
            <Button
              variant="contained" startIcon={<Payments />} onClick={submitPayment}
              disabled={!student?.bed || !student?.currentFeePlanId}>
              Submit Payment Request
            </Button>
          </Paper>

          {/* Quick Actions */}
          <Paper elevation={0} sx={{ p: 3, border: "1px solid #e2e8f0", mb: 2, borderRadius: 3 }}>
            <Typography fontWeight={700} mb={2}>Quick Actions</Typography>
            <Box sx={{ display: "flex", gap: 1.5, flexWrap: "wrap" }}>
              <Button variant="outlined" startIcon={<ReportProblem />} onClick={() => navigate("/complaints")}>
                Submit a Complaint
              </Button>
              <Button variant="outlined" startIcon={<MapOutlined />} onClick={() => navigate("/room-map")}
                sx={{ borderColor: "#6366f1", color: "#6366f1", "&:hover": { bgcolor: "rgba(99,102,241,0.06)" } }}>
                View Room &amp; Bed Map
              </Button>
            </Box>
          </Paper>

          {/* Bed Request Status */}
          {bedRequests.length > 0 && (
            <Paper elevation={0} sx={{ p: 3, border: "1px solid #e2e8f0", borderRadius: 3 }}>
              <Typography fontWeight={700} mb={1.5}>My Bed &amp; Transfer Requests</Typography>
              {bedRequests.slice(0, 5).map((r) => (
                <Box key={r.id} sx={{ display: "flex", alignItems: "center", gap: 2, py: 1, borderBottom: "1px solid #f8fafc" }}>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="body2" fontWeight={600}>
                      {r.bed?.room?.roomNumber} / {r.bed?.bedNumber} (Block {r.bed?.room?.hostelBlock})
                    </Typography>
                    <Typography variant="caption" color="text.secondary">{new Date(r.createdAt).toLocaleDateString()}</Typography>
                    {r.status === "Pending" && <Chip label="Awaiting admin approval" size="small" color="warning" sx={{ ml: 1 }} />}
                  </Box>
                  <Chip label={r.status} size="small" color={r.status === "Approved" ? "success" : r.status === "Rejected" ? "error" : "warning"} />
                </Box>
              ))}
              <Button size="small" sx={{ mt: 1, textTransform: "none" }} onClick={() => navigate("/room-map")}>
                View map &amp; full history →
              </Button>
            </Paper>
          )}
        </>
      )}
    </Box>
  );
}
