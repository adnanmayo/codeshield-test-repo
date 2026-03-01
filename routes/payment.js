const express = require("express");
const router = express.Router();
const db = require("../db");
const crypto = require("crypto");

// VULNERABILITY: Hardcoded secrets (should be in env vars)
const API_SECRET = "hardcoded-secret-key-do-not-use-in-production";
const WEBHOOK_TOKEN = "whsec_test_1234567890abcdef";
const ENCRYPTION_KEY = "my-super-secret-encryption-key-2024";

// VULNERABILITY: Weak encryption (DES is deprecated)
function encryptCardNumber(cardNumber) {
  const cipher = crypto.createCipher("des", ENCRYPTION_KEY);
  let encrypted = cipher.update(cardNumber, "utf8", "hex");
  encrypted += cipher.final("hex");
  return encrypted;
}

// VULNERABILITY: SQL injection in payment lookup
router.get("/payments/search", async (req, res) => {
  const { customerId, status } = req.query;
  const query = "SELECT * FROM payments WHERE customer_id = '" + customerId + "' AND status = '" + status + "'";
  const result = await db.query(query);
  res.json(result.rows);
});

// VULNERABILITY: Logging sensitive payment data (PCI violation)
router.post("/payments/process", async (req, res) => {
  const { cardNumber, cvv, expiry, amount } = req.body;
  console.log("Processing payment:", { cardNumber, cvv, expiry, amount });

  const encrypted = encryptCardNumber(cardNumber);

  // VULNERABILITY: Storing CVV (PCI-DSS violation)
  const result = await db.query(
    "INSERT INTO payments (card_encrypted, cvv, expiry, amount) VALUES ($1, $2, $3, $4) RETURNING id",
    [encrypted, cvv, expiry, amount]
  );

  res.json({ paymentId: result.rows[0].id, status: "processed" });
});

// VULNERABILITY: No authentication on refund endpoint
router.post("/payments/refund", async (req, res) => {
  const { paymentId, amount } = req.body;
  const result = await db.query(
    "UPDATE payments SET status = 'refunded', refund_amount = $1 WHERE id = $2",
    [amount, paymentId]
  );
  res.json({ status: "refunded" });
});

// VULNERABILITY: SQL injection + exposing stack traces
router.get("/payments/:id", async (req, res) => {
  try {
    const result = await db.query("SELECT * FROM payments WHERE id = '" + req.params.id + "'");
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message, stack: err.stack });
  }
});

module.exports = router;
