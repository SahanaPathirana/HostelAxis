const roomService = require("../services/room.service");

async function getRooms(req, res) {
  try { res.json({ rooms: await roomService.listRooms() }); }
  catch (err) { console.error("getRooms error:", err.message); res.status(500).json({ error: "Failed to fetch rooms" }); }
}

async function addRoom(req, res) {
  try {
    const result = await roomService.createRoom(req.body);
    if (!result.success) return res.status(400).json({ error: result.error });
    res.status(201).json({ message: "Room created", room: result.room });
  } catch (err) { console.error("addRoom error:", err.message); res.status(500).json({ error: "Failed to create room" }); }
}

async function updateRoom(req, res) {
  try {
    const result = await roomService.updateRoom(req.params.roomId, req.body);
    if (!result.success) return res.status(400).json({ error: result.error });
    res.json({ message: "Room updated" });
  } catch (err) { console.error("updateRoom error:", err.message); res.status(500).json({ error: "Failed to update room" }); }
}

async function removeRoom(req, res) {
  try {
    const result = await roomService.deleteRoom(req.params.roomId);
    if (!result.success) return res.status(400).json({ error: result.error });
    res.json({ message: "Room deleted" });
  } catch (err) { console.error("removeRoom error:", err.message); res.status(500).json({ error: "Failed to delete room" }); }
}

async function getAvailableBeds(req, res) {
  try { res.json({ beds: await roomService.listAvailableBeds() }); }
  catch (err) { console.error("getAvailableBeds error:", err.message); res.status(500).json({ error: "Failed to fetch beds" }); }
}

async function assignBed(req, res) {
  try {
    const { bedId, studentId, note } = req.body;
    const result = await roomService.assignBed(bedId, studentId, note);
    if (!result.success) return res.status(400).json({ error: result.error });
    res.json({ message: "Bed assigned", bed: result.bed });
  } catch (err) { console.error("assignBed error:", err.message); res.status(500).json({ error: "Failed to assign bed" }); }
}

async function unassignBed(req, res) {
  try {
    const result = await roomService.unassignBed(req.params.bedId);
    if (!result.success) return res.status(400).json({ error: result.error });
    res.json({ message: "Bed unassigned" });
  } catch (err) { console.error("unassignBed error:", err.message); res.status(500).json({ error: "Failed to unassign bed" }); }
}

async function getAllocationHistory(req, res) {
  try { res.json({ history: await roomService.listAllocationHistory() }); }
  catch (err) { console.error("getAllocationHistory error:", err.message); res.status(500).json({ error: "Failed to fetch allocation history" }); }
}

module.exports = { getRooms, addRoom, updateRoom, removeRoom, getAvailableBeds, assignBed, unassignBed, getAllocationHistory };
