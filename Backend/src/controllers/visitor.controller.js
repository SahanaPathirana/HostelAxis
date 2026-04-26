const visitorService = require("../services/visitor.service");

async function getVisitors(req, res) {
  try {
    const visitors = await visitorService.listVisitors();
    res.json({ visitors });
  } catch (err) {
    console.error("getVisitors error:", err.message);
    res.status(500).json({ error: "Failed to fetch visitors" });
  }
}

async function addVisitor(req, res) {
  try {
    const result = await visitorService.createVisitor(req.body);
    if (!result.success) return res.status(400).json({ error: result.error });
    res.status(201).json({ message: "Visitor log added", visitor: result.visitor });
  } catch (err) {
    console.error("addVisitor error:", err.message);
    res.status(500).json({ error: "Failed to add visitor" });
  }
}

async function updateVisitor(req, res) {
  try {
    const result = await visitorService.updateVisitor(req.params.id, req.body);
    if (!result.success) return res.status(400).json({ error: result.error });
    res.json({ message: "Visitor updated", visitor: result.visitor });
  } catch (err) {
    console.error("updateVisitor error:", err.message);
    res.status(500).json({ error: "Failed to update visitor" });
  }
}

module.exports = { getVisitors, addVisitor, updateVisitor };

