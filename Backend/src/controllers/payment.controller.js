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

module.exports = { getPayments, recordPayment };
