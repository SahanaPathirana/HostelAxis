const bedRequestService = require("../services/bedRequest.service");

async function getRoomMap(req, res) {
  try {
    const rooms = await bedRequestService.getRoomMap();
    res.json({ rooms });
  } catch (err) {
    console.error("getRoomMap error:", err.message);
    res.status(500).json({ error: "Failed to fetch room map" });
  }
}

async function listBedRequests(req, res) {
  try {
    const requests = await bedRequestService.listBedRequests();
    res.json({ requests });
  } catch (err) {
    console.error("listBedRequests error:", err.message);
    res.status(500).json({ error: "Failed to fetch bed requests" });
  }
}

async function approveBedRequest(req, res) {
  try {
    const result = await bedRequestService.approveBedRequest(req.params.id);
    if (!result.success) return res.status(400).json({ error: result.error });
    res.json({ message: "Bed request approved" });
  } catch (err) {
    console.error("approveBedRequest error:", err.message);
    res.status(500).json({ error: "Failed to approve bed request" });
  }
}

async function rejectBedRequest(req, res) {
  try {
    const result = await bedRequestService.rejectBedRequest(req.params.id);
    if (!result.success) return res.status(400).json({ error: result.error });
    res.json({ message: "Bed request rejected" });
  } catch (err) {
    console.error("rejectBedRequest error:", err.message);
    res.status(500).json({ error: "Failed to reject bed request" });
  }
}

// Student submits bed request
async function submitBedRequest(req, res) {
  try {
    const { bedId, bunkPosition, reason } = req.body;
    const result = await bedRequestService.submitBedRequest(req.user.id, bedId, bunkPosition, reason);
    if (!result.success) return res.status(400).json({ error: result.error });
    res.status(201).json({ message: "Bed request submitted", request: result.request });
  } catch (err) {
    console.error("submitBedRequest error:", err.message);
    res.status(500).json({ error: "Failed to submit bed request" });
  }
}


// Student gets their own bed requests
async function getStudentBedRequests(req, res) {
  try {
    const requests = await bedRequestService.getStudentBedRequests(req.user.id);
    res.json({ requests });
  } catch (err) {
    console.error("getStudentBedRequests error:", err.message);
    res.status(500).json({ error: "Failed to fetch bed requests" });
  }
}

module.exports = { getRoomMap, listBedRequests, approveBedRequest, rejectBedRequest, submitBedRequest, getStudentBedRequests };
