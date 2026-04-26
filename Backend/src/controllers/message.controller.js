const messageService = require("../services/message.service");

// Admin: get all conversations
async function getConversations(req, res) {
  try {
    const conversations = await messageService.listConversations(req.user.id);
    res.json({ conversations });
  } catch (err) {
    console.error("getConversations error:", err.message);
    res.status(500).json({ error: "Failed to fetch conversations" });
  }
}

// Admin: get thread with a specific user
async function getThread(req, res) {
  try {
    const messages = await messageService.getThread(req.user.id, req.params.userId);
    await messageService.markThreadRead(req.params.userId, req.user.id);
    res.json({ messages });
  } catch (err) {
    console.error("getThread error:", err.message);
    res.status(500).json({ error: "Failed to fetch thread" });
  }
}

// Admin: send message to a user
async function adminSendMessage(req, res) {
  try {
    const { toUserId, message } = req.body;
    const result = await messageService.sendMessage(req.user.id, toUserId, message);
    if (!result.success) return res.status(400).json({ error: result.error });
    res.status(201).json({ message: "Message sent", data: result.message });
  } catch (err) {
    console.error("adminSendMessage error:", err.message);
    res.status(500).json({ error: "Failed to send message" });
  }
}

// Student: get thread with admin
async function studentGetThread(req, res) {
  try {
    const messages = await messageService.getStudentThread(req.user.id);
    res.json({ messages });
  } catch (err) {
    console.error("studentGetThread error:", err.message);
    res.status(500).json({ error: "Failed to fetch messages" });
  }
}

// Student: send message to admin
async function studentSendMessage(req, res) {
  try {
    const { message } = req.body;
    const result = await messageService.studentSendMessage(req.user.id, message);
    if (!result.success) return res.status(400).json({ error: result.error });
    res.status(201).json({ message: "Message sent", data: result.message });
  } catch (err) {
    console.error("studentSendMessage error:", err.message);
    res.status(500).json({ error: "Failed to send message" });
  }
}

module.exports = { getConversations, getThread, adminSendMessage, studentGetThread, studentSendMessage };
