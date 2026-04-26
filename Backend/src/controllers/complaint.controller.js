const complaintService = require("../services/complaint.service");

async function submitComplaint(req, res) {
  try {
    const result = await complaintService.submitComplaint(req.user.id, req.body);
    if (!result.success) return res.status(400).json({ error: result.error });
    res.status(201).json({ message: "Complaint submitted", complaint: result.complaint });
  } catch (err) {
    console.error("submitComplaint error:", err.message);
    res.status(500).json({ error: "Failed to submit complaint" });
  }
}

async function getMyComplaints(req, res) {
  try {
    const complaints = await complaintService.listComplaintsForStudent(req.user.id);
    res.json({ complaints });
  } catch (err) {
    console.error("getMyComplaints error:", err.message);
    res.status(500).json({ error: "Failed to fetch complaints" });
  }
}

async function getAllComplaints(req, res) {
  try {
    const complaints = await complaintService.listAllComplaints();
    res.json({ complaints });
  } catch (err) {
    console.error("getAllComplaints error:", err.message);
    res.status(500).json({ error: "Failed to fetch complaints" });
  }
}

async function updateComplaintStatus(req, res) {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const result = await complaintService.updateComplaintStatus(id, status);
    if (!result.success) return res.status(400).json({ error: result.error });
    res.json({ message: "Status updated", complaint: result.complaint });
  } catch (err) {
    console.error("updateComplaintStatus error:", err.message);
    res.status(500).json({ error: "Failed to update complaint status" });
  }
}

async function assignComplaint(req, res) {
  try {
    const { id } = req.params;
    const { staffId } = req.body;
    const result = await complaintService.assignComplaintToStaff(id, staffId);
    if (!result.success) return res.status(400).json({ error: result.error });
    res.json({ message: "Complaint assigned", complaint: result.complaint, whatsappUrl: result.whatsappUrl });
  } catch (err) {
    console.error("assignComplaint error:", err.message);
    res.status(500).json({ error: "Failed to assign complaint" });
  }
}


async function getStaffComplaints(req, res) {
  try {
    const complaints = await complaintService.listAssignedComplaintsForStaff(req.user.id);
    res.json({ complaints });
  } catch (err) {
    console.error("getStaffComplaints error:", err.message);
    res.status(500).json({ error: "Failed to fetch staff complaints" });
  }
}

async function markComplaintDoneByStaff(req, res) {
  try {
    const result = await complaintService.markDoneByStaff(req.user.id, req.params.id);
    if (!result.success) return res.status(400).json({ error: result.error });
    res.json({ message: "Marked done", complaint: result.complaint });
  } catch (err) {
    console.error("markComplaintDoneByStaff error:", err.message);
    res.status(500).json({ error: "Failed to update complaint" });
  }
}

module.exports = {
  submitComplaint,
  getMyComplaints,
  getAllComplaints,
  updateComplaintStatus,
  assignComplaint,
  getStaffComplaints,
  markComplaintDoneByStaff,
};
