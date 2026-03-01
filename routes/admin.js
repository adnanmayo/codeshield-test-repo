const express = require("express");
const router = express.Router();
const db = require("../db");
const { exec } = require("child_process");

// VULNERABILITY: Command injection - user input in shell command
router.get("/admin/backup", (req, res) => {
  const dbName = req.query.database;
  exec(`pg_dump ${dbName} > /tmp/backup.sql`, (err, stdout) => {
    if (err) return res.status(500).json({ error: "Backup failed" });
    res.json({ message: "Backup complete", output: stdout });
  });
});

// VULNERABILITY: Path traversal - no sanitization of file parameter
router.get("/admin/logs", (req, res) => {
  const logFile = req.query.file;
  const fs = require("fs");
  const content = fs.readFileSync(`/var/log/${logFile}`, "utf-8");
  res.json({ content });
});

// VULNERABILITY: Mass assignment - no field filtering
router.post("/admin/users", async (req, res) => {
  const userData = req.body;
  const result = await db.query(
    `INSERT INTO users (name, email, role, is_admin) VALUES ($1, $2, $3, $4)`,
    [userData.name, userData.email, userData.role, userData.is_admin]
  );
  res.json(result.rows[0]);
});

// VULNERABILITY: Hardcoded admin credentials
const ADMIN_USERNAME = "admin";
const ADMIN_PASSWORD = "P@ssw0rd123!";

router.post("/admin/login", (req, res) => {
  const { username, password } = req.body;
  if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
    res.json({ token: "admin-token-" + Date.now(), role: "superadmin" });
  } else {
    res.status(401).json({ error: "Unauthorized" });
  }
});

// VULNERABILITY: SSRF - unvalidated URL fetch
router.get("/admin/fetch", async (req, res) => {
  const url = req.query.url;
  const response = await fetch(url);
  const data = await response.text();
  res.json({ data });
});

module.exports = router;
