const paymentService = require("../services/payment.service");

async function getPayments(req, res) {
  try {
    const payments = await paymentService.listPayments();
    res.json({ payments });
  } catch (err) {
    console.error("getPayments error:", err.message);
    res.status(500).json({ error: "Failed to fetch payments" });
  }
}

async function getPaymentRequests(req, res) {
  try {
    const requests = await paymentService.listPaymentRequests();
    res.json({ requests });
  } catch (err) {
    console.error("getPaymentRequests error:", err.message);
    res.status(500).json({ error: "Failed to fetch payment requests" });
  }
}

async function recordPayment(req, res) {
  try {
    const result = await paymentService.recordPayment(req.body);
    if (!result.success) return res.status(400).json({ error: result.error });
    res.status(201).json({ message: "Payment recorded", payment: result.payment });
  } catch (err) {
    console.error("recordPayment error:", err.message);
    res.status(500).json({ error: "Failed to record payment" });
  }
}

async function submitPaymentRequest(req, res) {
  try {
    const result = await paymentService.submitPaymentRequest(req.user.id, req.body);
    if (!result.success) return res.status(400).json({ error: result.error });
    res.status(201).json({ message: "Payment request submitted", request: result.request });
  } catch (err) {
    console.error("submitPaymentRequest error:", err.message);
    res.status(500).json({ error: "Failed to submit payment request" });
  }
}

module.exports = { getPayments, recordPayment, submitPaymentRequest, getPaymentRequests };
