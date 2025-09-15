const express = require("express");
const db = require("./db");
const app = express();
const PORT = 3000;

app.use(express.json());
const fs = require("fs");
const path = require("path");

// Serve categories from file
app.get("/api/categories", (req, res) => {
  const filePath = path.join(__dirname, "config/category.txt");
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
  const { date, amount, category, note, paid_by, recurring, threefs, custom } = req.body;
  if (!date || !amount || !category || !paid_by || !recurring || !threefs) {
    return res.status(400).json({ error: "Missing fields" });
  }
  const stmt = db.prepare(
    "INSERT INTO expenses " +
    "(date, amount, category, note, paid_by, recurring, threefs, custom) " +
    "VALUES (?, ?, ?, ?, ?, ?, ?, ?)"
  );
  const info = stmt.run(date, amount, category, note,
    paid_by, recurring, threefs, custom);
  res.json({ success: true, id: info.lastInsertRowid });
});

// Get all expenses
app.get("/api/expenses", (req, res) => {
  const rows = db.prepare("SELECT * FROM expenses ORDER BY date DESC").all();
  res.json(rows);
});

// Expenses for a month (YYYY-MM)
app.get("/api/expenses/month/:year/:month", (req, res) => {
  const { year, month } = req.params;
  const ym = `${year}-${String(month).padStart(2, "0")}`;

  const rows = db.prepare(`
    SELECT * FROM expenses
    WHERE strftime('%Y-%m', date) = ?
    ORDER BY date DESC
  `).all(ym);

  res.json(rows);
});

// Total expenses for a month
app.get("/api/expenses/month/:year/:month/total", (req, res) => {
  const { year, month } = req.params;
  const ym = `${year}-${String(month).padStart(2, "0")}`;

  const row = db.prepare(`
    SELECT SUM(amount) as total
    FROM expenses
    WHERE strftime('%Y-%m', date) = ?
  `).get(ym);

  res.json({ total: row.total || 0 });
});

// Serve paid_by options from file
app.get("/api/paidby", (req, res) => {
  const filePath = path.join(__dirname, "config/paidby.txt");
  fs.readFile(filePath, "utf8", (err, data) => {
    if (err) return res.status(500).json({ error: "Cannot read paid_by options" });
    const paidByOptions = data.split(/\r?\n/).filter(line => line.trim() !== "");
    res.json(paidByOptions);
  });
});

app.get("/api/report/year/:year", async (req, res) => {
  const { year } = req.params;
  try {
    const rows = await db.all(
      `SELECT category, SUM(amount) as total
       FROM expenses
       WHERE strftime('%Y', date) = ?
       GROUP BY category`,
      [year]
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to load yearly report" });
  }
});

app.listen(PORT, () => console.log(`🚀 Server running at http://localhost:${PORT}`));