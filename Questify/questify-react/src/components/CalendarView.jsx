import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";

import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import listPlugin from "@fullcalendar/list";
import interactionPlugin from "@fullcalendar/interaction";
import rrulePlugin from "@fullcalendar/rrule";

/*Backend for Google Calendar*/
const BACKEND_BASE_URL = "http://localhost:4000";

const STORE_LOCAL_EVENTS = "qf_events_local_v2";
const STORE_TASKS = "qf_tasks_v1";

const clampDate = (v) => {
  const d = new Date(v);
  return isNaN(d) ? new Date() : d;
};

const toLocalInputValue = (d, allDay = false) => {
  const x = new Date(d);
  if (!allDay) {
    x.setMinutes(x.getMinutes() - x.getTimezoneOffset());
    return x.toISOString().slice(0, 16);
  }
  const y = x.getFullYear();
  const m = String(x.getMonth() + 1).padStart(2, "0");
  const day = String(x.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

const fromLocalInputValue = (s, allDay = false) => {
  if (!s) return null;
  if (allDay) return new Date(s + "T00:00:00");
  const d = new Date(s);
  d.setMinutes(d.getMinutes() + d.getTimezoneOffset());
  return d;
};

const weekdayNumToRRule = ["SU", "MO", "TU", "WE", "TH", "FR", "SA"];

function loadLocalEvents() {
  try {
    const raw = localStorage.getItem(STORE_LOCAL_EVENTS);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

function saveLocalEvents(list) {
  try {
    localStorage.setItem(STORE_LOCAL_EVENTS, JSON.stringify(list));
  } catch {}
}

function loadTasks() {
  try {
    const raw = localStorage.getItem(STORE_TASKS);
    if (!raw) return [];
    const t = JSON.parse(raw);
    return Array.isArray(t) ? t : [];
  } catch {
    return [];
  }
}

function tasksToEvents(tasks) {
  const out = [];
  for (const t of tasks) {
    if (!t?.dueAt) continue;
    const start = clampDate(t.dueAt);
    out.push({
      id: `task-${t.id}`,
      title: t.title || "Task",
      start,
      allDay: true,
      editable: false,
      extendedProps: { source: "task", category: "task" },
    });
  }
  return out;
}

function toFullCalendarEvent(e) {
  const base = {
    id: e.id,
    title: e.title || "(no title)",
    editable: true,
    allDay: !!e.allDay,
    extendedProps: {
      source: e.source || "local",
      category: e.category || "personal",
      color: e.color || "",
    },
  };

  if (e.repeat && e.repeat.freq && e.repeat.freq !== "NONE") {
    const durationMs =
      e.durationMs ??
      Math.max(30 * 60 * 1000, new Date(e.end).getTime() - new Date(e.start).getTime());

    return {
      ...base,
      rrule: {
        dtstart: clampDate(e.start),
        freq: e.repeat.freq.toLowerCase(),
        interval: Number(e.repeat.interval) || 1,
        byweekday:
          e.repeat.byWeekday && e.repeat.byWeekday.length
            ? e.repeat.byWeekday.map((n) => weekdayNumToRRule[n])
            : undefined,
      },
      duration: !base.allDay ? { milliseconds: durationMs } : undefined,
    };
  }

  return {
    ...base,
    start: clampDate(e.start),
    end: e.end ? clampDate(e.end) : clampDate(e.start),
  };
}

function applyMoveOrResize(localEvents, fcEvent, mutation) {
  const idx = localEvents.findIndex((x) => x.id === fcEvent.id);
  if (idx < 0) return localEvents;

  const cur = localEvents[idx];
  if (cur.repeat && cur.repeat.freq && cur.repeat.freq !== "NONE") {
    const moved = {
      id: `local-${crypto.randomUUID()}`,
      title: cur.title,
      source: "local",
      category: cur.category || "personal",
      color: cur.color || "",
      allDay: !!mutation.allDay,
      start: mutation.start,
      end: mutation.end,
      repeat: { freq: "NONE" },
      parentSeriesId: cur.id,
    };
    return [...localEvents, moved];
  }

  const next = [...localEvents];
  next[idx] = {
    ...cur,
    start: mutation.start,
    end: mutation.end,
    allDay: !!mutation.allDay,
  };
  return next;
}

export default function CalendarView({ date = new Date() }) {
  const [currentDate, setCurrentDate] = useState(date);
  const [view, setView] = useState("dayGridMonth");

  const [eventsFetched, setEventsFetched] = useState([]); 
  const [eventsLocal, setEventsLocal] = useState(loadLocalEvents()); 

  const [showAdd, setShowAdd] = useState(false);
  const [addForm, setAddForm] = useState({
    title: "",
    allDay: true,
    startLocal: toLocalInputValue(new Date(), true),
    endLocal: "",
    category: "personal",
    color: "",
    repeat: { freq: "NONE", interval: 1, byWeekday: [] },
  });

  const [showEdit, setShowEdit] = useState(false);
  const [editForm, setEditForm] = useState(null);

  const calRef = useRef(null);

  /*Fetches Google Calendar events from backend*/
  const loadEvents = useCallback(async () => {
    try {
      const res = await fetch(`${BACKEND_BASE_URL}/api/google/events`, {
        credentials: "include", 
      });
      if (!res.ok) {
        console.warn("Google events fetch failed with status:", res.status);
        setEventsFetched([]);
        return;
      }

      const data = await res.json();

      const mapped = (data || []).map((e) => ({
        id: `google-${e.id || crypto.randomUUID()}`,
        title: e.title || "(no title)",
        start: clampDate(e.start),
        end: e.end ? clampDate(e.end) : clampDate(e.start),
        allDay: !!e.allDay,
        editable: false,
        extendedProps: { source: "google", category: "meeting" },
      }));

      setEventsFetched(mapped);
    } catch (err) {
      console.error("Error loading Google events:", err);
      setEventsFetched([]);
    }
  }, []);

  /*initial load*/
  useEffect(() => {
    loadEvents();
  }, [loadEvents]);

  /*listens for calendar:refresh custom event (from Dashboard)*/
  useEffect(() => {
    const handler = () => loadEvents();
    window.addEventListener("calendar:refresh", handler);
    return () => window.removeEventListener("calendar:refresh", handler);
  }, [loadEvents]);

  /*composes all events: local + tasks + google*/
  const events = useMemo(() => {
    const tasks = tasksToEvents(loadTasks());
    const locals = eventsLocal.map(toFullCalendarEvent);
    const fetched = eventsFetched;
    return [...locals, ...tasks, ...fetched];
  }, [eventsLocal, eventsFetched]);

  /*persists local events*/
  useEffect(() => {
    saveLocalEvents(eventsLocal);
  }, [eventsLocal]);

  /*keeps FullCalendar view in sync with state*/
  useEffect(() => {
    const api = calRef.current?.getApi();
    if (api && api.view?.type !== view) api.changeView(view);
  }, [view]);

  useEffect(() => {
    const api = calRef.current?.getApi();
    if (api) api.gotoDate(currentDate);
  }, [currentDate]);

  const handleSelect = (selInfo) => {
    const allDay = selInfo.allDay;
    const startLocal = toLocalInputValue(selInfo.start, allDay);
    const endLocal = allDay ? "" : toLocalInputValue(selInfo.end, false);

    setAddForm({
      title: "",
      allDay,
      startLocal,
      endLocal,
      category: "personal",
      color: "",
      repeat: { freq: "NONE", interval: 1, byWeekday: [] },
    });
    setShowAdd(true);
  };

  const saveAdd = () => {
    const isAllDay = !!addForm.allDay;
    const start = fromLocalInputValue(addForm.startLocal, isAllDay) || new Date();
    let end =
      isAllDay
        ? (() => {
            const d = new Date(start);
            d.setHours(23, 59, 0, 0);
            return d;
          })()
        : fromLocalInputValue(addForm.endLocal, false) || new Date(start.getTime() + 30 * 60 * 1000);

    if (end < start) end = new Date(start.getTime() + 30 * 60 * 1000);

    const base = {
      id: `local-${crypto.randomUUID()}`,
      title: addForm.title || "(no title)",
      start,
      end,
      allDay: isAllDay,
      source: "local",
      category: addForm.category || "personal",
      color: addForm.color || "",
    };

    const repeat = addForm.repeat || { freq: "NONE" };
    let newEvent = base;
    if (repeat.freq && repeat.freq !== "NONE") {
      newEvent = {
        ...base,
        repeat: {
          freq: repeat.freq,
          interval: Number(repeat.interval) || 1,
          byWeekday: repeat.byWeekday || [],
        },
        durationMs: isAllDay ? undefined : end.getTime() - start.getTime(),
      };
    }

    setEventsLocal((prev) => [...prev, newEvent]);
    setShowAdd(false);
  };

  const handleEventClick = (clickInfo) => {
    const ev = clickInfo.event;
    const src = ev.extendedProps?.source;
    if (src !== "local") {
      alert(`${ev.title}\n${formatTimeLabel(ev)}`);
      return;
    }

    const isAllDay = ev.allDay;
    const start = ev.start ? new Date(ev.start) : new Date();
    const end = ev.end ? new Date(ev.end) : new Date(start.getTime() + 30 * 60 * 1000);

    const cur = eventsLocal.find((x) => x.id === ev.id);
    if (!cur) return;

    setEditForm({
      id: cur.id,
      title: cur.title || "",
      allDay: isAllDay,
      startLocal: toLocalInputValue(start, isAllDay),
      endLocal: isAllDay ? "" : toLocalInputValue(end, false),
      category: cur.category || "personal",
      color: cur.color || "",
      repeat: cur.repeat || { freq: "NONE", interval: 1, byWeekday: [] },
    });
    setShowEdit(true);
  };

  const saveEdit = () => {
    if (!editForm) return;
    const isAllDay = !!editForm.allDay;
    const start = fromLocalInputValue(editForm.startLocal, isAllDay) || new Date();
    const end =
      isAllDay
        ? (() => {
            const d = new Date(start);
            d.setHours(23, 59, 0, 0);
            return d;
          })()
        : fromLocalInputValue(editForm.endLocal, false) || new Date(start.getTime() + 30 * 60 * 1000);

    setEventsLocal((prev) => {
      const next = [...prev];
      const i = next.findIndex((x) => x.id === editForm.id);
      if (i >= 0) {
        next[i] = {
          ...next[i],
          title: editForm.title || "(no title)",
          start,
          end,
          allDay: isAllDay,
          category: editForm.category || "personal",
          color: editForm.color || "",
          repeat:
            editForm.repeat?.freq && editForm.repeat.freq !== "NONE"
              ? {
                  freq: editForm.repeat.freq,
                  interval: Number(editForm.repeat.interval) || 1,
                  byWeekday: editForm.repeat.byWeekday || [],
                }
              : { freq: "NONE" },
          durationMs:
            isAllDay
              ? undefined
              : next[i].repeat?.freq && next[i].repeat.freq !== "NONE"
              ? Math.max(30 * 60 * 1000, end.getTime() - start.getTime())
              : undefined,
        };
      }
      return next;
    });
    setShowEdit(false);
    setEditForm(null);
  };

  const deleteEdit = () => {
    if (!editForm) return;
    setEventsLocal((prev) => prev.filter((x) => x.id !== editForm.id));
    setShowEdit(false);
    setEditForm(null);
  };

  const handleEventDrop = (changeInfo) => {
    const ev = changeInfo.event;
    if (ev.extendedProps?.source !== "local") return;

    const mutation = {
      start: ev.start ? new Date(ev.start) : new Date(),
      end: ev.end ? new Date(ev.end) : new Date(),
      allDay: !!ev.allDay,
    };
    setEventsLocal((prev) => applyMoveOrResize(prev, ev, mutation));
  };

  const handleEventResize = (resizeInfo) => {
    const ev = resizeInfo.event;
    if (ev.extendedProps?.source !== "local") return;
    const mutation = {
      start: ev.start ? new Date(ev.start) : new Date(),
      end: ev.end ? new Date(ev.end) : new Date(),
      allDay: !!ev.allDay,
    };
    setEventsLocal((prev) => applyMoveOrResize(prev, ev, mutation));
  };

  return (
    <div style={{ display: "grid", gap: 10 }}>
      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
        <div className="pill" style={{ fontWeight: 800 }}>
          {formatHeaderLabel(view, currentDate)}
        </div>
        <div className="tab-spacer" />
        <button
          className={`tab ${view === "dayGridMonth" ? "active" : ""}`}
          onClick={() => setView("dayGridMonth")}
        >
          Month
        </button>
        <button
          className={`tab ${view === "timeGridWeek" ? "active" : ""}`}
          onClick={() => setView("timeGridWeek")}
        >
          Week
        </button>
        <button
          className={`tab ${view === "listMonth" ? "active" : ""}`}
          onClick={() => setView("listMonth")}
        >
          Agenda
        </button>
        <div className="tab-spacer" />
        <button className="tab" onClick={() => setCurrentDate(prevDate(view, currentDate))}>
          ◀
        </button>
        <button className="tab" onClick={() => setCurrentDate(new Date())}>
          Today
        </button>
        <button className="tab" onClick={() => setCurrentDate(nextDate(view, currentDate))}>
          ▶
        </button>
        <div className="tab-spacer" />
        <button
          className="tab action"
          onClick={() => {
            const now = new Date();
            setAddForm({
              title: "",
              allDay: true,
              startLocal: toLocalInputValue(now, true),
              endLocal: "",
              category: "personal",
              color: "",
              repeat: { freq: "NONE", interval: 1, byWeekday: [] },
            });
            setShowAdd(true);
          }}
        >
          + New
        </button>
      </div>

      <div className="qf-rbc-wrap">
        <FullCalendar
          ref={calRef}
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin, listPlugin, rrulePlugin]}
          initialView={view}
          initialDate={currentDate}
          datesSet={(arg) => {
            setView(arg.view.type);
            setCurrentDate(arg.start);
          }}
          headerToolbar={false}
          height="auto"
          selectable
          selectMirror
          editable
          eventResizableFromStart
          dayMaxEventRows={true}
          eventOverlap={true}
          select={handleSelect}
          eventClick={handleEventClick}
          eventDrop={handleEventDrop}
          eventResize={handleEventResize}
          events={events}
          eventContent={(arg) => {
            const ev = arg.event;
            const isFocus = ev.extendedProps?.category === "focus";
            const bg = ev.extendedProps?.color
              ? ev.extendedProps.color
              : isFocus
              ? "linear-gradient(180deg,#cde7ff 0%,#9fc9ff 100%)"
              : "linear-gradient(180deg,#f2c988 0%,#e9b76d 100%)";
            return (
              <div
                title={ev.title}
                style={{
                  border: "2px solid #2d1b0e",
                  borderRadius: 8,
                  padding: "2px 6px",
                  background: bg,
                  color: "#2d1b0e",
                  boxShadow: "2px 2px 0 rgba(45,27,14,.45)",
                  fontSize: 12,
                  lineHeight: 1.2,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                <strong>{ev.title}</strong>
              </div>
            );
          }}
        />
      </div>

      {showAdd && (
        <Modal onClose={() => setShowAdd(false)} title="New Event">
          <EventForm form={addForm} setForm={setAddForm} />
          <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 8 }}>
            <button className="tab" onClick={() => setShowAdd(false)}>
              Cancel
            </button>
            <button className="tab active" onClick={saveAdd}>
              Save
            </button>
          </div>
        </Modal>
      )}

      {showEdit && editForm && (
        <Modal
          onClose={() => {
            setShowEdit(false);
            setEditForm(null);
          }}
          title="Edit Event"
        >
          <EventForm form={editForm} setForm={setEditForm} />
          <div
            style={{
              display: "flex",
              gap: 8,
              justifyContent: "space-between",
              marginTop: 8,
            }}
          >
            <button className="tab" onClick={deleteEdit}>
              Delete
            </button>
            <div style={{ display: "flex", gap: 8 }}>
              <button
                className="tab"
                onClick={() => {
                  setShowEdit(false);
                  setEditForm(null);
                }}
              >
                Cancel
              </button>
              <button className="tab active" onClick={saveEdit}>
                Save
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

function Modal({ title, children, onClose }) {
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,.35)",
        display: "grid",
        placeItems: "center",
        zIndex: 1000,
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: 420,
          background: "#f4e6c9",
          border: "3px solid #2d1b0e",
          boxShadow: "6px 6px 0 #2d1b0e",
          borderRadius: 16,
          padding: 14,
          display: "grid",
          gap: 10,
        }}
      >
        <div style={{ fontWeight: 900, fontSize: 16 }}>{title}</div>
        {children}
      </div>
    </div>
  );
}

function EventForm({ form, setForm }) {
  const freq = form.repeat?.freq || "NONE";

  return (
    <div style={{ display: "grid", gap: 8 }}>
      <label style={{ display: "grid", gap: 4 }}>
        <span style={{ fontWeight: 700 }}>Title</span>
        <input
          className="input-like"
          value={form.title}
          onChange={(e) => setForm((x) => ({ ...x, title: e.target.value }))}
          placeholder="Event title"
        />
      </label>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <input
            type="checkbox"
            checked={!!form.allDay}
            onChange={(e) => {
              const allDay = e.target.checked;
              setForm((x) => {
                const startLocal = toLocalInputValue(
                  fromLocalInputValue(x.startLocal, !x.allDay) || new Date(),
                  allDay
                );
                return { ...x, allDay, startLocal, endLocal: allDay ? "" : x.endLocal };
              });
            }}
          />
          <span style={{ fontWeight: 700 }}>All-day</span>
        </label>
        <label style={{ display: "grid", gap: 4 }}>
          <span style={{ fontWeight: 700 }}>Category</span>
          <select
            className="input-like"
            value={form.category || "personal"}
            onChange={(e) => setForm((x) => ({ ...x, category: e.target.value }))}
          >
            <option value="personal">Personal</option>
            <option value="focus">Focus</option>
            <option value="task">Task</option>
            <option value="school">School</option>
            <option value="meeting">Meeting</option>
          </select>
        </label>
      </div>

      <label style={{ display: "grid", gap: 4 }}>
        <span style={{ fontWeight: 700 }}>{form.allDay ? "Date" : "Start"}</span>
        <input
          type={form.allDay ? "date" : "datetime-local"}
          className="input-like"
          value={form.startLocal}
          onChange={(e) => setForm((x) => ({ ...x, startLocal: e.target.value }))}
        />
      </label>

      {!form.allDay && (
        <label style={{ display: "grid", gap: 4 }}>
          <span style={{ fontWeight: 700 }}>End</span>
          <input
            type="datetime-local"
            className="input-like"
            value={form.endLocal}
            onChange={(e) => setForm((x) => ({ ...x, endLocal: e.target.value }))}
          />
        </label>
      )}

      <label style={{ display: "grid", gap: 4 }}>
        <span style={{ fontWeight: 700 }}>Accent Color (optional)</span>
        <input
          type="color"
          className="input-like"
          value={form.color || "#ffffff"}
          onChange={(e) => setForm((x) => ({ ...x, color: e.target.value }))}
        />
      </label>

      <div style={{ borderTop: "2px solid rgba(0,0,0,.15)", paddingTop: 8 }}>
        <div style={{ fontWeight: 900 }}>Repeat</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          <label style={{ display: "grid", gap: 4 }}>
            <span style={{ fontWeight: 700 }}>Frequency</span>
            <select
              className="input-like"
              value={freq}
              onChange={(e) =>
                setForm((x) => ({
                  ...x,
                  repeat: {
                    ...(x.repeat || {}),
                    freq: e.target.value,
                    byWeekday: x.repeat?.byWeekday || [],
                    interval: x.repeat?.interval || 1,
                  },
                }))
              }
            >
              <option value="NONE">None</option>
              <option value="DAILY">Daily</option>
              <option value="WEEKLY">Weekly</option>
              <option value="MONTHLY">Monthly</option>
            </select>
          </label>
          <label style={{ display: "grid", gap: 4 }}>
            <span style={{ fontWeight: 700 }}>Interval</span>
            <input
              type="number"
              min={1}
              className="input-like"
              value={form.repeat?.interval ?? 1}
              onChange={(e) =>
                setForm((x) => ({
                  ...x,
                  repeat: {
                    ...(x.repeat || {}),
                    interval: Math.max(1, parseInt(e.target.value || "1", 10)),
                  },
                }))
              }
            />
          </label>
        </div>

        {freq === "WEEKLY" && (
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 6 }}>
            {[
              { label: "Sun", val: 0 },
              { label: "Mon", val: 1 },
              { label: "Tue", val: 2 },
              { label: "Wed", val: 3 },
              { label: "Thu", val: 4 },
              { label: "Fri", val: 5 },
              { label: "Sat", val: 6 },
            ].map((w) => {
              const selected = (form.repeat?.byWeekday || []).includes(w.val);
              return (
                <label
                  key={w.val}
                  className="pill"
                  style={{
                    cursor: "pointer",
                    background: selected ? "#fff" : "#f1f1f1",
                    border: "2px solid #2d1b0e",
                  }}
                >
                  <input
                    type="checkbox"
                    checked={selected}
                    onChange={(e) => {
                      setForm((x) => {
                        const cur = new Set(x.repeat?.byWeekday || []);
                        if (e.target.checked) cur.add(w.val);
                        else cur.delete(w.val);
                        return {
                          ...x,
                          repeat: {
                            ...(x.repeat || {}),
                            byWeekday: Array.from(cur).sort(),
                          },
                        };
                      });
                    }}
                    style={{ display: "none" }}
                  />
                  <span style={{ padding: "2px 6px", fontWeight: 800 }}>{w.label}</span>
                </label>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function prevDate(view, d) {
  const x = new Date(d);
  if (view === "dayGridMonth" || view === "listMonth") x.setMonth(x.getMonth() - 1);
  else x.setDate(x.getDate() - 7);
  return x;
}
function nextDate(view, d) {
  const x = new Date(d);
  if (view === "dayGridMonth" || view === "listMonth") x.setMonth(x.getMonth() + 1);
  else x.setDate(x.getDate() + 7);
  return x;
}
function formatHeaderLabel(view, d) {
  if (view === "dayGridMonth" || view === "listMonth") {
    return d.toLocaleString(undefined, { month: "long", year: "numeric" });
  }
  const start = new Date(d);
  start.setDate(start.getDate() - ((start.getDay() + 6) % 7));
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  return `${start.toLocaleDateString()} – ${end.toLocaleDateString()}`;
}
function formatTimeLabel(e) {
  if (e.allDay) return "All-day";
  const s =
    e.start?.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) || "";
  const en =
    e.end?.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) || "";
  return `${s}–${en}`;
}
