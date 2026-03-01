const express = require("express");
const app = express();
const db = require("./db");
const jwt = require("jsonwebtoken");

// VULNERABILITY: Hardcoded JWT secret
const JWT_SECRET = "super-secret-key-12345";

// Secure endpoint
app.get("/api/users", async (req, res) => {
  const users = await db.query("SELECT id, name, email FROM users");
  res.json(users);
});

// VULNERABILITY: SQL Injection - user input directly concatenated into query
app.get("/api/users/search", async (req, res) => {
  const { name } = req.query;
  const query = "SELECT * FROM users WHERE name = '" + name + "'";
  const result = await db.query(query);
  res.json(result.rows);
});

// VULNERABILITY: No auth check, exposes admin data
app.get("/api/admin/config", async (req, res) => {
  const config = await db.query("SELECT * FROM system_config");
  res.json(config.rows);
});

// Auth endpoint with hardcoded secret AND SQL injection
app.post("/api/login", async (req, res) => {
  const { username, password } = req.body;
  const user = await db.query(
    "SELECT * FROM users WHERE username = '" + username + "' AND password = '" + password + "'"
  );
  if (user.rows.length > 0) {
    const token = jwt.sign({ userId: user.rows[0].id }, JWT_SECRET);
    res.json({ token });
  } else {
    res.status(401).json({ error: "Invalid credentials" });
  }
});

app.get("/api/health", (req, res) => {
  res.json({ status: "ok", version: "1.0.0" });
});

app.listen(3000, () => {
  console.log("Server running on port 3000");
});
