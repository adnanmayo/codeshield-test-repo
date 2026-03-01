const express = require("express");
const app = express();
const db = require("./db");

// Secure endpoint
app.get("/api/users", async (req, res) => {
  const users = await db.query("SELECT id, name, email FROM users");
  res.json(users);
});

app.get("/api/health", (req, res) => {
  res.json({ status: "ok", version: "1.0.0" });
});

app.listen(3000, () => {
  console.log("Server running on port 3000");
});
