import { useEffect, useMemo, useState } from "react";

function save(key, val) { localStorage.setItem(key, val); }
function load(key, def = "") { return localStorage.getItem(key) || def; }
function fmtDate(iso) {
  if (!iso) return "No due date";
  const d = new Date(iso);
  return Number.isNaN(+d) ? iso : d.toLocaleString();
}

export default function CanvasTodos() {
  const [baseUrl, setBaseUrl] = useState(() => load("canvas_base"));
  const [token, setToken] = useState(() => load("canvas_pat"));
  const [todos, setTodos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => { save("canvas_base", baseUrl); }, [baseUrl]);
  useEffect(() => { save("canvas_pat", token); }, [token]);

  const proxyUrl = useMemo(() => {
    const base = encodeURIComponent(baseUrl || "");
    const t = encodeURIComponent(token || "");
    // ask for per_page=100 and let the proxy paginate through all pages
    return `http://localhost:5174/canvas/todo?base=${base}&token=${t}&per_page=100&max_pages=10`;
  }, [baseUrl, token]);

  async function fetchTodos() {
    setLoading(true);
    setError("");
    setTodos([]);

    try {
      if (!baseUrl || !/^https?:\/\//i.test(baseUrl)) throw new Error("Enter a valid Canvas base URL");
      if (!token) throw new Error("Enter your Canvas Personal Access Token");

      const res = await fetch(proxyUrl);
      const text = await res.text();
      const body = JSON.parse(text);

      if (!res.ok) throw new Error(`HTTP ${res.status}: ${text}`);
      if (!Array.isArray(body)) throw new Error("Unexpected response (expected an array)");

      setTodos(body);
    } catch (e) {
      setError(e.message || "Fetch failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ maxWidth: 760, margin: "24px auto", padding: 16 }}>
      <h2>Canvas To-Dos (all pages) — with Assignment Titles</h2>

      <label style={{ display: "block", marginBottom: 8 }}>
        Canvas base URL
        <input
          type="text"
          placeholder="https://canvas.yourschool.edu"
          value={baseUrl}
          onChange={(e) => setBaseUrl(e.target.value.trim())}
          style={{ width: "100%", padding: 8, marginTop: 4 }}
        />
      </label>

      <label style={{ display: "block", marginBottom: 8 }}>
        Personal Access Token (testing only)
        <input
          type="password"
          placeholder="paste your PAT here"
          value={token}
          onChange={(e) => setToken(e.target.value.trim())}
          style={{ width: "100%", padding: 8, marginTop: 4 }}
        />
      </label>

      <button onClick={fetchTodos} disabled={loading} style={{ padding: "8px 12px" }}>
        {loading ? "Loading…" : "Fetch My To-Dos"}
      </button>

      {error && (
        <div style={{ marginTop: 12, padding: 8, background: "#ffeaea", color: "#a20000", borderRadius: 4 }}>
          {error}
        </div>
      )}

      <ul style={{ listStyle: "none", padding: 0, marginTop: 16 }}>
        {todos.map((t, idx) => {
          const assignmentTitle = t.assignment?.name;         // <-- explicit assignment title
          const todoTitle = t.title;                           // Canvas to-do title
          const course = t.context_name ?? "—";
          const due = fmtDate(t.assignment?.due_at);

          return (
            <li key={t.html_url ?? idx} style={{ border: "1px solid #ddd", borderRadius: 6, padding: 12, marginBottom: 10 }}>
              <div style={{ fontWeight: 700 }}>
                {todoTitle || assignmentTitle || "Untitled To-Do"}
              </div>
              {assignmentTitle && assignmentTitle !== todoTitle && (
                <div style={{ fontSize: 14, color: "#333" }}>
                  <em>Assignment:</em> {assignmentTitle}
                </div>
              )}
              <div style={{ fontSize: 14, color: "#444" }}>Course: {course}</div>
              <div style={{ fontSize: 14, color: "#444" }}>Due: {due}</div>
              <div style={{ marginTop: 6 }}>
                <a href={t.html_url} target="_blank" rel="noreferrer">Open in Canvas</a>
              </div>
            </li>
          );
        })}
      </ul>

      {!loading && !error && todos.length === 0 && (
        <div style={{ color: "#666" }}>No to-dos found.</div>
      )}
    </div>
  );
}
