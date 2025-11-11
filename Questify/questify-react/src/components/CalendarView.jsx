import React, { useEffect, useMemo, useState, useCallback } from "react";
import { API } from "../apiBase"; 

export default function CalendarView({ date = new Date() }) {
  const [eventsByDay, setEventsByDay] = useState({});

  const ymd = (d) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  };

  const loadEvents = useCallback(async () => {
    try {
      const res = await fetch(API("/calendar/events"), { credentials: "include" });
      if (!res.ok) return;
      const data = await res.json();
      const all = [...(data.imported || []), ...(data.local || [])];

      const bucket = {};
      for (const e of all) {
        const key = ymd(new Date(e.start));
        (bucket[key] ||= []).push(e);
      }
      Object.values(bucket).forEach((list) =>
        list.sort((a, b) => new Date(a.start) - new Date(b.start))
      );
      setEventsByDay(bucket);
    } catch {}
  }, []);

  useEffect(() => { loadEvents(); }, [loadEvents]);

  useEffect(() => {
    const handler = () => loadEvents();
    window.addEventListener("calendar:refresh", handler);
    return () => window.removeEventListener("calendar:refresh", handler);
  }, [loadEvents]);

  const model = useMemo(() => {
    const first = new Date(date.getFullYear(), date.getMonth(), 1);
    const start = new Date(first);
    start.setDate(first.getDate() - ((first.getDay() + 6) % 7));
    const days = Array.from({ length: 42 }).map((_, i) => {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      const inMonth = d.getMonth() === date.getMonth();
      return { d, inMonth, key: ymd(d) };
    });
    const monthLabel = date.toLocaleString(undefined, { month: "long", year: "numeric" });
    const weekday = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];
    return { days, monthLabel, weekday };
  }, [date]);

  return (
    <div style={{ display: "grid", gap: 10 }}>
      <div style={{ fontWeight: 800, fontSize: 18 }}>{model.monthLabel}</div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 8 }}>
        {model.weekday.map((w) => (
          <div key={w} style={{ fontWeight: 700, textAlign: "center" }}>{w}</div>
        ))}
        {model.days.map(({ d, inMonth, key }) => {
          const dayEvents = eventsByDay[key] || [];
          const shown = dayEvents.slice(0, 3);
          const more = dayEvents.length - shown.length;

          return (
            <div
              key={key}
              style={{
                border: "2px solid #000",
                background: inMonth ? "#fff" : "#f4f4f4",
                minHeight: 90,
                padding: 6,
                boxShadow: "3px 3px 0 #222",
                display: "grid",
                gridTemplateRows: "auto 1fr",
                overflow: "hidden",
              }}
            >
              <div style={{ fontWeight: 700 }}>{d.getDate()}</div>
              <div style={{ display: "grid", gap: 4, alignContent: "start", overflow: "hidden" }}>
                {shown.map((e) => (
                  <div
                    key={`${e.id}-${e.start}`}
                    title={`${new Date(e.start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • ${e.title || ""}`}
                    style={{
                      fontSize: 12,
                      lineHeight: 1.2,
                      border: "2px solid #2d1b0e",
                      background: "linear-gradient(180deg,#f2c988 0%,#e9b76d 100%)",
                      color: "#2d1b0e",
                      borderRadius: 8,
                      padding: "2px 6px",
                      whiteSpace: "nowrap",
                      textOverflow: "ellipsis",
                      overflow: "hidden",
                      boxShadow: "2px 2px 0 rgba(45,27,14,.5)",
                    }}
                  >
                    {new Date(e.start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} — {e.title}
                  </div>
                ))}
                {more > 0 && <div style={{ fontSize: 12, opacity: 0.7 }}>+{more} more</div>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
