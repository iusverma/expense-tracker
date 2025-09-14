const express = require("express");
const db = require("./db");
const app = express();
const PORT = 3000;

app.use(express.json());
const fs = require("fs");
const path = require("path");

// Serve categories from file
app.get("/api/categories", (req, res) => {
  const filePath = path.join(__dirname, "category.txt");
  fs.readFile(filePath, "utf8", (err, data) => {
    if (err) {
      return res.status(500).json({ error: "Failed to read categories" });
    }
    // Split by line and remove empty lines
    const categories = data.split(/\r?\n/).filter(line => line.trim() !== "");
    res.json(categories);
  });
});

app.use(express.static("public")); // serve frontend files

// Add expense
app.post("/api/expenses", (req, res) => {
  const { date, amount, category, note, paid_by } = req.body;
  if (!date || !amount || !category || !paid_by) {
    return res.status(400).json({ error: "Missing fields" });
  }
  const stmt = db.prepare("INSERT INTO expenses (date, amount, category, note, paid_by) VALUES (?, ?, ?, ?, ?)");
  const info = stmt.run(date, amount, category, note, paid_by);
  res.json({ success: true, id: info.lastInsertRowid });
});

// Get all expenses
app.get("/api/expenses", (req, res) => {
  const rows = db.prepare("SELECT * FROM expenses ORDER BY date DESC").all();
  res.json(rows);
});

// Expenses for a month (YYYY-MM)
app.get("/api/expenses/month/:ym", (req, res) => {
  const ym = req.params.ym;
  const rows = db.prepare(`
    SELECT * FROM expenses
    WHERE strftime('%Y-%m', date) = ?
    ORDER BY date DESC
  `).all(ym);
  res.json(rows);
});

// Serve paid_by options from file
app.get("/api/paidby", (req, res) => {
  const filePath = path.join(__dirname, "paidby.txt");
  fs.readFile(filePath, "utf8", (err, data) => {
    if (err) return res.status(500).json({ error: "Cannot read paid_by options" });
    const paidByOptions = data.split(/\r?\n/).filter(line => line.trim() !== "");
    res.json(paidByOptions);
  });
});

/*
// Report: totals by category in a year
app.get("/api/report/year/:year", (req, res) => {
  const rows = db.prepare(`
    SELECT category, SUM(amount) AS total
    FROM expenses
    WHERE strftime('%Y', date) = ?
    GROUP BY category
  `).all(req.params.year);
  res.json(rows);
});

// Monthly totals in a year
app.get("/api/report/monthly/:year", (req, res) => {
  const rows = db.prepare(`
    SELECT strftime('%m', date) AS month, SUM(amount) AS total
    FROM expenses
    WHERE strftime('%Y', date) = ?
    GROUP BY month
    ORDER BY month
  `).all(req.params.year);
  res.json(rows);
});
*/

app.listen(PORT, () => console.log(`🚀 Server running at http://localhost:${PORT}`));