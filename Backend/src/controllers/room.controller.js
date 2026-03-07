const roomService = require("../services/room.service");

async function getRooms(req, res) {
  try {
    const rooms = await roomService.listRooms();
    res.json({ rooms });
  } catch (err) {
    console.error("getRooms error:", err.message);
    res.status(500).json({ error: "Failed to fetch rooms" });
  }
}

async function addRoom(req, res) {
  try {
    const result = await roomService.createRoom(req.body);
    if (!result.success) return res.status(400).json({ error: result.error });
    res.status(201).json({ message: "Room created", room: result.room });
  } catch (err) {
    console.error("addRoom error:", err.message);
    res.status(500).json({ error: "Failed to create room" });
  }
}

async function removeRoom(req, res) {
  try {
    const { roomId } = req.params;
    const result = await roomService.deleteRoom(roomId);
    if (!result.success) return res.status(400).json({ error: result.error });
    res.json({ message: "Room deleted" });
  } catch (err) {
    console.error("removeRoom error:", err.message);
    res.status(500).json({ error: "Failed to delete room" });
  }
}

async function getAvailableBeds(req, res) {
  try {
    const beds = await roomService.listAvailableBeds();
    res.json({ beds });
  } catch (err) {
    console.error("getAvailableBeds error:", err.message);
    res.status(500).json({ error: "Failed to fetch beds" });
  }
}

async function assignBed(req, res) {
  try {
    const { bedId, studentId } = req.body;
    const result = await roomService.assignBed(bedId, studentId);
    if (!result.success) return res.status(400).json({ error: result.error });
    res.json({ message: "Bed assigned", bed: result.bed });
  } catch (err) {
    console.error("assignBed error:", err.message);
    res.status(500).json({ error: "Failed to assign bed" });
  }
}

async function unassignBed(req, res) {
  try {
    const { bedId } = req.params;
    const result = await roomService.unassignBed(bedId);
    if (!result.success) return res.status(400).json({ error: result.error });
    res.json({ message: "Bed unassigned", bed: result.bed });
  } catch (err) {
    console.error("unassignBed error:", err.message);
    res.status(500).json({ error: "Failed to unassign bed" });
  }
}

module.exports = { getRooms, addRoom, removeRoom, getAvailableBeds, assignBed, unassignBed };
