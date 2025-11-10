// run with: node proxy.js
// deps: npm i express cors
import express from "express";
import cors from "cors";

const app = express();
app.use(cors());

function nextLink(header) {
  // Parse: <https://.../todo?page=2&per_page=100>; rel="next", <...>; rel="last"
  if (!header) return null;
  const parts = header.split(",");
  for (const p of parts) {
    const [urlPart, relPart] = p.split(";");
    if (relPart && /rel="?next"?/.test(relPart)) {
      const m = urlPart.match(/<([^>]+)>/);
      if (m) return m[1];
    }
  }
  return null;
}

// GET /canvas/todo?base=...&token=...&per_page=100&max_pages=10
app.get("/canvas/todo", async (req, res) => {
  try {
    const base = (req.query.base || "").toString().replace(/\/+$/, "");
    const token = (req.query.token || "").toString().trim();
    const perPage = Math.min(parseInt(req.query.per_page || "100", 10), 100) || 100;
    const maxPages = Math.min(parseInt(req.query.max_pages || "10", 10), 50) || 10;

    if (!base || !/^https?:\/\//i.test(base)) {
      return res.status(400).json({ error: "Missing or invalid ?base URL" });
    }
    if (!token) {
      return res.status(400).json({ error: "Missing ?token" });
    }

    let url = `${base}/api/v1/users/self/todo?per_page=${perPage}`;
    let all = [];
    let pageCount = 0;

    while (url && pageCount < maxPages && all.length < 1000) {
      const r = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
      const text = await r.text();

      if (!r.ok) {
        // bubble up the first error
        return res
          .status(r.status)
          .set("Content-Type", r.headers.get("content-type") || "application/json")
          .send(text);
      }

      const batch = JSON.parse(text);
      if (Array.isArray(batch)) all = all.concat(batch);

      const linkH = r.headers.get("link");
      url = nextLink(linkH);
      pageCount += 1;
    }

    res.status(200).json(all);
  } catch (err) {
    res.status(500).json({ error: err.message || "Proxy error" });
  }
});

const PORT = 5174;
app.listen(PORT, () => {
  console.log(`Proxy running at http://localhost:${PORT}`);
});
