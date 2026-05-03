const express = require("express");
const fs = require("fs");
const app = express();
app.disable("etag"); // avoid 304 + empty body quirks on repeated GET during dev
const PORT = 3000;

// Allow Vite (or other local dev origins) to call this API from the browser
app.use((req, res, next) => {
  const origin = req.headers.origin;
  const allow =
    origin && /^http:\/\/(localhost|127\.0\.0\.1):\d+$/.test(origin)
      ? origin
      : "*";
  res.setHeader("Access-Control-Allow-Origin", allow);
  res.setHeader("Vary", "Origin");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.sendStatus(204);
  next();
});

const data = JSON.parse(fs.readFileSync("./sampleData.json"));

app.get("/users", (req, res) => {
  res.set("Cache-Control", "no-store");
  console.log("Called API...\n", req.query);
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;

  const qRaw = req.query.q ?? req.query.search ?? "";
  const term = String(qRaw).trim().toLowerCase();

  const list =
    term.length === 0
      ? [...data]
      : data.filter((row) =>
          Object.entries(row).some(([_, v]) => {
            if (v == null || typeof v === "object") return false;
            return String(v).toLowerCase().includes(term);
          })
        );

  const start = (page - 1) * limit;
  const end = start + limit;
  const results = list.slice(start, end);

  res.json({
    page,
    limit,
    total: list.length,
    totalPages: Math.max(1, Math.ceil(list.length / limit)),
    next: end < list.length ? `/users?page=${page + 1}&limit=${limit}` : null,
    prev: page > 1 ? `/users?page=${page - 1}&limit=${limit}` : null,
    data: results,
  });
});

app.listen(PORT, () => console.log(`API running on ${PORT}`));
