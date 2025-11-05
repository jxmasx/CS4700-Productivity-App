import React, { useMemo } from "react";

export default function CalendarView({ date = new Date() }) {
  const model = useMemo(() => {
    const first = new Date(date.getFullYear(), date.getMonth(), 1);
    const start = new Date(first);
    start.setDate(first.getDate() - ((first.getDay() + 6) % 7));
    const days = Array.from({ length: 42 }).map((_, i) => {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      const inMonth = d.getMonth() === date.getMonth();
      return { d, inMonth, key: d.toISOString().slice(0, 10) };
    });
    const monthLabel = date.toLocaleString(undefined, { month: "long", year: "numeric" });
    const weekday = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];
    return { days, monthLabel, weekday };
  }, [date]);

  return (
    <div style={{ display: "grid", gap: 10 }}>
      <div style={{ fontWeight: 800, fontSize: 18 }}>{model.monthLabel}</div>
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(7, 1fr)",
        gap: 8
      }}>
        {model.weekday.map(w => (
          <div key={w} style={{ fontWeight: 700, textAlign: "center" }}>{w}</div>
        ))}
        {model.days.map(({ d, inMonth, key }) => (
          <div key={key} style={{
            border: "2px solid #000",
            background: inMonth ? "#fff" : "#f4f4f4",
            minHeight: 90,
            padding: 6,
            boxShadow: "3px 3px 0 #222",
            display: "grid",
            gridTemplateRows: "auto 1fr"
          }}>
            <div style={{ fontWeight: 700 }}>{d.getDate()}</div>
            <div />
          </div>
        ))}
      </div>
    </div>
  );
}
