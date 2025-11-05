import React, { useEffect, useRef, useState } from "react";

export default function PomodoroTimer() {
  const [mode, setMode] = useState("focus");
  const [focusMin, setFocusMin] = useState(25);
  const [breakMin, setBreakMin] = useState(5);
  const [seconds, setSeconds] = useState(focusMin * 60);
  const [running, setRunning] = useState(false);
  const tickRef = useRef(null);

  useEffect(() => {
    if (!running) return;
    tickRef.current = setInterval(() => {
      setSeconds((s) => {
        if (s > 0) return s - 1;
        const nextMode = mode === "focus" ? "break" : "focus";
        setMode(nextMode);
        return (nextMode === "focus" ? focusMin : breakMin) * 60;
      });
    }, 1000);
    return () => clearInterval(tickRef.current);
  }, [running, mode, focusMin, breakMin]);

  useEffect(() => {
    if (!running) setSeconds((mode === "focus" ? focusMin : breakMin) * 60);
  }, [focusMin, breakMin, mode, running]);

  const mmss = new Date(seconds * 1000).toISOString().substr(14, 5);

  return (
    <div style={{ display: "grid", gap: 12 }}>
      <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
        <span className="pill">{mode === "focus" ? "Focus" : "Break"}</span>
        <div className="tab-spacer" />
        <button className="tab" onClick={() => setMode("focus")}>Focus</button>
        <button className="tab" onClick={() => setMode("break")}>Break</button>
      </div>

      <div style={{
        border: "3px solid #000",
        boxShadow: "3px 3px 0 #222",
        padding: 16,
        display: "grid",
        placeItems: "center",
        minHeight: 160
      }}>
        <div style={{ fontSize: 64, fontWeight: 900, lineHeight: 1 }}>{mmss}</div>
      </div>

      <div style={{ display: "flex", gap: 8 }}>
        <button className="tab" onClick={() => setRunning((r) => !r)}>
          {running ? "Pause" : "Start"}
        </button>
        <button className="tab" onClick={() => { setRunning(false); setSeconds((mode === "focus" ? focusMin : breakMin) * 60); }}>
          Reset
        </button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        <label>
          <div style={{ fontWeight: 700 }}>Focus (min)</div>
          <input
            type="number"
            min={1}
            max={120}
            value={focusMin}
            onChange={(e) => setFocusMin(parseInt(e.target.value || "25", 10))}
            className="input-like"
          />
        </label>
        <label>
          <div style={{ fontWeight: 700 }}>Break (min)</div>
          <input
            type="number"
            min={1}
            max={60}
            value={breakMin}
            onChange={(e) => setBreakMin(parseInt(e.target.value || "5", 10))}
            className="input-like"
          />
        </label>
      </div>
    </div>
  );
}
