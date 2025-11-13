import React, { useEffect, useMemo, useState } from "react";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";

const STORAGE_KEY = "qf_tasks_v1";
const ECON_KEY = "qf_economy_v1";

const TYPE_COLORS = {
  Habit:   { bg: "#cfe4ff", stripe: "#4b90ff" },
  Daily:   { bg: "#cfeecf", stripe: "#46a546" },
  "To-Do": { bg: "#ffd6ea", stripe: "#ff5aa5" },
};

const DIFF_ORDER = ["Trivial", "Easy", "Medium", "Hard", "Epic"];
const DIFFICULTY = {
  Trivial: { gold: 2,  xp: 2,  penalty: 1 },
  Easy:    { gold: 5,  xp: 5,  penalty: 2 },
  Medium:  { gold: 10, xp: 10, penalty: 5 },
  Hard:    { gold: 20, xp: 20, penalty: 10 },
  Epic:    { gold: 35, xp: 35, penalty: 18 },
};

function todayKey(d = new Date()) {
  return d.toISOString().slice(0, 10);
}

function loadEconomy() {
  try {
    const raw = localStorage.getItem(ECON_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return { gold: 0, xp: 0, stats: { str: 0, cha: 0, dex: 0, wis: 0, int: 0}, lastRollover: todayKey() };
}
function saveEconomy(e) {
  try { localStorage.setItem(ECON_KEY, JSON.stringify(e)); } catch {}
}

function loadTasks() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return [
    { id: "t1", title: "Read 10 pages", type: "Habit", dueAt: null, done: false, pomsDone: 0, pomsEstimate: 1, category: "CHA", difficulty: "Easy" },
    { id: "t2", title: "AM workout", type: "Daily", dueAt: null, done: false, pomsDone: 0, pomsEstimate: 1, category: "STR", difficulty: "Medium" },
    { id: "t3", title: "Finish dashboard layout", type: "To-Do", dueAt: null, done: false, pomsDone: 0, pomsEstimate: 3, category: "DEX", difficulty: "Hard" },
  ];
}
function saveTasks(tasks) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks)); } catch {}
}

function fmtDue(dueAt) {
  if (!dueAt) return "";
  const d = new Date(dueAt);
  const today = new Date();
  const isOverdue = d.setHours(23,59,59,999) < today.getTime();
  const label = new Date(dueAt).toLocaleDateString([], { month: "short", day: "numeric" });
  return (isOverdue ? "Overdue · " : "") + label;
}

function applyReward(econ, task) {
  const diff = DIFFICULTY[task.difficulty] || DIFFICULTY.Easy;
  const statKey = (task.category || "").toLowerCase();
  const next = {
    ...econ,
    gold: Math.max(0, econ.gold + diff.gold),
    xp: Math.max(0, econ.xp + diff.xp),
    stats: { ...econ.stats },
  };
  if (["str", "dex", "cha", "wis", "int"].includes(statKey)) {
    next.stats[statKey] = Math.max(0, (next.stats[statKey] || 0) + 1);
  }
  return next;
}
function revokeReward(econ, task) {
  const diff = DIFFICULTY[task.difficulty] || DIFFICULTY.Easy;
  const statKey = (task.category || "").toLowerCase();
  const next = {
    ...econ,
    gold: Math.max(0, econ.gold - diff.gold),
    xp: Math.max(0, econ.xp - diff.xp),
    stats: { ...econ.stats },
  };
  if (["str", "dex", "cha", "wis", "int"].includes(statKey)) {
    next.stats[statKey] = Math.max(0, (next.stats[statKey] || 0) - 1);
  }
  return next;
}
function applyMissPenalty(econ, task) {
  const diff = DIFFICULTY[task.difficulty] || DIFFICULTY.Easy;
  const statKey = (task.category || "").toLowerCase();
  const next = {
    ...econ,
    gold: Math.max(0, econ.gold - diff.penalty),
    xp: Math.max(0, econ.xp - diff.penalty),
    stats: { ...econ.stats },
  };
  if (["str", "dex", "cha", "wis", "int"].includes(statKey)) {
    next.stats[statKey] = Math.max(0, (next.stats[statKey] || 0) - 1);
  }
  return next;
}

export default function TaskBoard() {
  const [tasks, setTasks] = useState(loadTasks);
  const [economy, setEconomy] = useState(loadEconomy);

  const [showAdd, setShowAdd] = useState(false);
  const [addForm, setAddForm] = useState({
    title: "",
    type: "To-Do",
    category: "STR",
    difficulty: "Easy",
    pomsEstimate: 1,
    dueAtLocal: "",
  });

  const [showEdit, setShowEdit] = useState(false);
  const [editForm, setEditForm] = useState(null);

  useEffect(() => { saveTasks(tasks); }, [tasks]);
  useEffect(() => { saveEconomy(economy); }, [economy]);

  useEffect(() => {
    const doRolloverIfNeeded = () => {
      const today = todayKey();
      if (economy.lastRollover === today) return;

      let econ = { ...economy };
      let nextTasks = tasks;

      tasks.forEach(t => {
        if (t.type === "Daily" && !t.done) {
          econ = applyMissPenalty(econ, t);
        }
      });
      nextTasks = nextTasks.map(t => (t.type === "Daily" ? { ...t, done: false } : t));

      econ.lastRollover = today;
      setEconomy(econ);
      setTasks(nextTasks);
      window.dispatchEvent(new Event("calendar:refresh"));
    };

    doRolloverIfNeeded();
    const iv = setInterval(doRolloverIfNeeded, 60 * 1000);
    return () => clearInterval(iv);
  }, [economy.lastRollover, tasks]); 

  useEffect(() => {
    const onPomComplete = (e) => {
      const doneId = e?.detail?.id;
      if (!doneId) return;
      setTasks(prev => prev.map(t =>
        t.id === doneId ? { ...t, pomsDone: (t.pomsDone || 0) + 1 } : t
      ));
    };
    window.addEventListener("pomodoro:complete", onPomComplete);
    return () => window.removeEventListener("pomodoro:complete", onPomComplete);
  }, []);

  const onDragEnd = (result) => {
    if (!result.destination) return;
    const next = Array.from(tasks);
    const [moved] = next.splice(result.source.index, 1);
    next.splice(result.destination.index, 0, moved);
    setTasks(next);
  };

  const openAdd = () => {
    setAddForm({
      title: "",
      type: "To-Do",
      category: "STR",
      difficulty: "Easy",
      pomsEstimate: 1,
      dueAtLocal: "",
    });
    setShowAdd(true);
  };

  const saveAdd = () => {
    const due = addForm.dueAtLocal ? new Date(addForm.dueAtLocal + "T00:00:00") : null;
    const t = {
      id: crypto.randomUUID(),
      title: addForm.title || "(no title)",
      type: ["Habit", "Daily", "To-Do"].includes(addForm.type) ? addForm.type : "To-Do",
      category: ["STR", "DEX", "CHA", "WIS", "INT"].includes(addForm.category) ? addForm.category : "STR",
      difficulty: DIFF_ORDER.includes(addForm.difficulty) ? addForm.difficulty : "Easy",
      dueAt: due ? due.toISOString() : null,
      done: false,
      pomsDone: 0,
      pomsEstimate: Math.max(0, parseInt(addForm.pomsEstimate || 0, 10)),
    };
    setTasks(prev => [...prev, t]);
    setShowAdd(false);
    window.dispatchEvent(new Event("calendar:refresh"));
  };

  const focusInPomodoro = (task) => {
    if (!task) return;
    window.dispatchEvent(new CustomEvent("pomodoro:setTask", { detail: { id: task.id, title: task.title } }));
  };

  const toggleDone = (id) => {
    setTasks((prev) => {
      let econ = { ...economy };
      const next = prev.map((t) => {
        if (t.id !== id) return t;
        const nowDone = !t.done;
        if (nowDone) econ = applyReward(econ, t);
        else econ = revokeReward(econ, t);
        return { ...t, done: nowDone };
      });
      setEconomy(econ);
      return next;
    });
  };

  const openEdit = (id) => {
    const t = tasks.find((x) => x.id === id);
    if (!t) return;
    setEditForm({
      ...t,
      dueAtLocal: t.dueAt ? t.dueAt.slice(0,10) : "",
    });
    setShowEdit(true);
  };

  const saveEdit = () => {
    if (!editForm) return;
    setTasks(prev => prev.map(t => {
      if (t.id !== editForm.id) return t;
      const due = editForm.dueAtLocal ? new Date(editForm.dueAtLocal + "T00:00:00") : null;
      return {
        ...t,
        title: editForm.title || "(no title)",
        type: ["Habit", "Daily", "To-Do"].includes(editForm.type) ? editForm.type : t.type,
        category: ["STR", "DEX", "CHA", "WIS", "INT"].includes(editForm.category) ? editForm.category : t.category,
        difficulty: DIFF_ORDER.includes(editForm.difficulty) ? editForm.difficulty : t.difficulty,
        pomsEstimate: Math.max(0, parseInt(editForm.pomsEstimate || 0, 10)),
        dueAt: due ? due.toISOString() : null,
      };
    }));
    setShowEdit(false);
    setEditForm(null);
    window.dispatchEvent(new Event("calendar:refresh"));
  };

  const removeTask = (id) => {
    if (!window.confirm("Delete this task?")) return;
    setTasks(prev => prev.filter(t => t.id !== id));
  };

  const counts = useMemo(() => {
    const c = { Habit: 0, Daily: 0, "To-Do": 0 };
    tasks.forEach((t) => (c[t.type] += 1));
    return c;
  }, [tasks]);

  return (
    <div>
      <div className="taskbar">
        <div className="pill">Habits: {counts.Habit}</div>
        <div className="pill">Dailies: {counts.Daily}</div>
        <div className="pill">To-Dos: {counts["To-Do"]}</div>
        <div className="tab-spacer" />
        <button className="tab action" onClick={openAdd} title="Add Task">+ New</button>
      </div>

      <DragDropContext onDragEnd={onDragEnd}>
        <Droppable droppableId="task-list">
          {(provided) => (
            <div className="task-list" ref={provided.innerRef} {...provided.droppableProps}>
              {tasks.map((t, index) => {
                const colors = TYPE_COLORS[t.type] || TYPE_COLORS["To-Do"];
                const pomLabel = `${t.pomsDone ?? 0}/${t.pomsEstimate ?? 0}`;
                const dueLabel = fmtDue(t.dueAt);
                return (
                  <Draggable draggableId={t.id} index={index} key={t.id}>
                    {(p, snapshot) => (
                      <div
                        ref={p.innerRef}
                        {...p.draggableProps}
                        className={`task task-row ${snapshot.isDragging ? "dragging" : ""}`}
                        style={{
                          ...p.draggableProps.style,
                          background: colors.bg,
                          borderColor: "#000",
                        }}
                      >
                        <div
                          className="drag-handle"
                          {...p.dragHandleProps}
                          title="Drag to reorder"
                          style={{ background: colors.stripe }}
                        >
                          ≡
                        </div>

                        <label className="check-wrap" style={{ flex: 1 }}>
                          <input type="checkbox" checked={t.done} onChange={() => toggleDone(t.id)} />
                          <span className={`title ${t.done ? "done" : ""}`}>{t.title}</span>
                          <span className="type-tag">{t.type}</span>
                          {!!dueLabel && (
                            <span className="pill" style={{ marginLeft: 6, fontWeight: 800 }}>
                              📅 {dueLabel}
                            </span>
                          )}
                        </label>

                        <div className="task-row-actions" style={{ display: "flex", gap: 6 }}>
                          <button onClick={() => openEdit(t.id)} aria-label="Edit">✎</button>
                          <button onClick={() => removeTask(t.id)} aria-label="Delete">🗑</button>
                        </div>
                      </div>
                    )}
                  </Draggable>
                );
              })}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>

      {showAdd && (
        <Modal onClose={() => setShowAdd(false)} title="New Task">
          <TaskForm form={addForm} setForm={setAddForm} />
          <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 8 }}>
            <button className="tab" onClick={() => setShowAdd(false)}>Cancel</button>
            <button className="tab active" onClick={saveAdd}>Save</button>
          </div>
        </Modal>
      )}

      {showEdit && editForm && (
        <Modal onClose={() => { setShowEdit(false); setEditForm(null); }} title="Edit Task">
          <TaskForm form={editForm} setForm={setEditForm} />
          <div style={{ display: "flex", gap: 8, justifyContent: "space-between", marginTop: 8 }}>
            <button className="tab" onClick={() => { setShowEdit(false); setEditForm(null); }}>Close</button>
            <div style={{ display: "flex", gap: 8 }}>
              <button className="tab" onClick={() => focusInPomodoro(editForm)}>Focus in Pomodoro</button>
              <button className="tab active" onClick={saveEdit}>Save</button>
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
        position: "fixed", inset: 0, background: "rgba(0,0,0,.35)",
        display: "grid", placeItems: "center", zIndex: 1000,
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

function TaskForm({ form, setForm }) {
  return (
    <div style={{ display: "grid", gap: 8 }}>
      <label style={{ display: "grid", gap: 4 }}>
        <span style={{ fontWeight: 700 }}>Title</span>
        <input
          className="input-like"
          value={form.title}
          onChange={(e) => setForm((x) => ({ ...x, title: e.target.value }))}
          placeholder="Task title"
        />
      </label>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        <label style={{ display: "grid", gap: 4 }}>
          <span style={{ fontWeight: 700 }}>Type</span>
          <select
            className="input-like"
            value={form.type}
            onChange={(e) => setForm((x) => ({ ...x, type: e.target.value }))}
          >
            <option value="Habit">Habit</option>
            <option value="Daily">Daily</option>
            <option value="To-Do">To-Do</option>
          </select>
        </label>

        <label style={{ display: "grid", gap: 4 }}>
          <span style={{ fontWeight: 700 }}>Category</span>
          <select
            className="input-like"
            value={form.category}
            onChange={(e) => setForm((x) => ({ ...x, category: e.target.value }))}
          >
            <option value="STR">Strength</option>
            <option value="DEX">Dexterity</option>
            <option value="CHA">Charisma</option>
            <option value="WIS">Wisdom</option>
            <option value="INT">Intelligence</option>
          </select>
        </label>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        <label style={{ display: "grid", gap: 4 }}>
          <span style={{ fontWeight: 700 }}>Difficulty</span>
          <select
            className="input-like"
            value={form.difficulty}
            onChange={(e) => setForm((x) => ({ ...x, difficulty: e.target.value }))}
          >
            {DIFF_ORDER.map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
        </label>

        <label style={{ display: "grid", gap: 4 }}>
          <span style={{ fontWeight: 700 }}>Pomodoro Estimate</span>
          <input
            className="input-like"
            type="number"
            min={0}
            value={form.pomsEstimate}
            onChange={(e) => setForm((x) => ({ ...x, pomsEstimate: Math.max(0, parseInt(e.target.value || "0", 10)) }))}
          />
        </label>
      </div>

      <label style={{ display: "grid", gap: 4 }}>
        <span style={{ fontWeight: 700 }}>Due Date (optional)</span>
        <input
          type="date"
          className="input-like"
          value={form.dueAtLocal || ""}
          onChange={(e) => setForm((x) => ({ ...x, dueAtLocal: e.target.value }))}
        />
      </label>

      <div className="pill" style={{ fontSize: 12 }}>
        Reward preview: 💰 {DIFFICULTY[form.difficulty]?.gold ?? 0} · ⭐ {DIFFICULTY[form.difficulty]?.xp ?? 0}
      </div>
    </div>
  );
}
