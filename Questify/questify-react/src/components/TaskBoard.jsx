import React, { useEffect, useMemo, useState } from "react";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { useUser } from "../contexts/UserContext";
import { readTasks, createTask, updateTask, deleteTask } from '../utils/TaskAPI.js'
import { updateEconomy } from '../utils/EconAPI.js'
import { updateRollover } from '../utils/UserAPI.js'

// const STORAGE_KEY = "qf_tasks_v1";
// const ECON_KEY = "qf_economy_v1";

const TYPE_COLORS = {
  Habit: { bg: "#cfe4ff", stripe: "#4b90ff" },
  Daily: { bg: "#cfeecf", stripe: "#46a546" },
  "To-Do": { bg: "#ffd6ea", stripe: "#ff5aa5" },
};

const DIFF_ORDER = ["Trivial", "Easy", "Medium", "Hard", "Epic"];
const DIFFICULTY = {
  Trivial: { gold: 2, xp: 2, penalty: 1 },
  Easy: { gold: 5, xp: 5, penalty: 2 },
  Medium: { gold: 10, xp: 10, penalty: 5 },
  Hard: { gold: 20, xp: 20, penalty: 10 },
  Epic: { gold: 35, xp: 35, penalty: 18 },
};

function todayKey(d = new Date()) {
  return d.toISOString().slice(0, 10);
}

function fmtDue(dueAt) {
  if (!dueAt) return "";
  const d = new Date(dueAt);
  const today = new Date();
  const isOverdue = d.setHours(23, 59, 59, 999) < today.getTime();
  const label = new Date(dueAt).toLocaleDateString([], { month: "short", day: "numeric" });
  return (isOverdue ? "Overdue · " : "") + label;
}

// Add, Remove, or give Penalty for tasks (gold, xp, stats)
function econDelta(task, type) {
  const statKey = (task.category || "").toLowerCase();
  const diff = DIFFICULTY[task.difficulty] || DIFFICULTY.Easy;

  // Map stat abbreviations to deltas
  const STAT_MAP = {
    str: "strength_delta",
    dex: "dexterity_delta",
    int: "intelligence_delta",
    wis: "wisdom_delta",
    cha: "charisma_delta",
  };

  // Map types (add, revoke, penalty) to delta values
  const TYPE_MAP = {
    add: {
      xp: diff.xp,
      gold: diff.gold,
      statChange: 1
    },
    revoke: {
      xp: -diff.xp,
      gold: -diff.gold,
      statChange: -1
    },
    penalty: {
      xp: -diff.penalty,
      gold: -diff.penalty,
      statChange: -1
    }
  }

  // Set gold/xp deltas
  const deltas = {
    xp_delta: TYPE_MAP[type].xp,
    gold_delta: TYPE_MAP[type].gold,
    strength_delta: 0,
    dexterity_delta: 0,
    intelligence_delta: 0,
    wisdom_delta: 0,
    charisma_delta: 0,
  };

  // Set stat deltas (charm, strength, etc.)
  if (STAT_MAP[statKey]) {
    deltas[STAT_MAP[statKey]] = TYPE_MAP[type].statChange;
  }

  return deltas;
}

export default function TaskBoard() {
  const { user, refreshUser } = useUser();

  const [tasks, setTasks] = useState([]);
  const rolloverInProgress = React.useRef(false);

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

  // Get tasks from backend and apply them to tasks state
  useEffect(() => {
    async function fetchTasks() {
      if (user && user.id) {
        try {
          const data = await readTasks(user.id);
          setTasks(data);
        } catch (error) {
          console.error('Error in fetchTasks:', error);
        }
      }
    }
    fetchTasks();
  }, [user]);

  // Rollover from backennd
  useEffect(() => {
    const doRolloverIfNeeded = async () => {
      if (!user || !user.id || !tasks.length) return;
      if (rolloverInProgress.current) return;

      const today = todayKey();
      const lastRollover = user.last_rollover;

      if (lastRollover === today) return;

      rolloverInProgress.current = true;

      try {
        let penalties = [];
        tasks.forEach(t => {
          if (t.type === "Daily" && !t.done) {
            penalties.push(econDelta(t, "penalty"));
          }
        });

        // Apply all penalties
        if (penalties.length > 0) {
          const totalDeltas = penalties.reduce((acc, p) => ({
            xp_delta: acc.xp_delta + p.xp_delta,
            gold_delta: acc.gold_delta + p.gold_delta,
            strength_delta: acc.strength_delta + p.strength_delta,
            dexterity_delta: acc.dexterity_delta + p.dexterity_delta,
            intelligence_delta: acc.intelligence_delta + p.intelligence_delta,
            wisdom_delta: acc.wisdom_delta + p.wisdom_delta,
            charisma_delta: acc.charisma_delta + p.charisma_delta,
          }), { xp_delta: 0, gold_delta: 0, strength_delta: 0, dexterity_delta: 0, intelligence_delta: 0, wisdom_delta: 0, charisma_delta: 0 });

          await updateEconomy(user.id, totalDeltas);
        }

        // Reset Daily tasks
        const nextTasks = tasks.map(t => (t.type === "Daily" ? { ...t, done: false } : t));
        for (const t of nextTasks) {
          if (t.type === "Daily") {
            await updateTask(user.id, t.id, t);
          }
        }
        setTasks(nextTasks);

        // Update last_rollover in database
        await updateRollover(user.id);

        // Refresh user data to get updated last_rollover
        await refreshUser();

        window.dispatchEvent(new Event("calendar:refresh"));
      } finally {
        rolloverInProgress.current = false;
      }
    };

    doRolloverIfNeeded();
  }, [user?.id, tasks.length]);

  // Adds event listener to when pomodoro timer completes, updates tasks
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

  // When finished dragging a task to new position
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

  // Add new task to taskboard
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
    createTask(user.id, t)
    setTasks(prev => [...prev, t]);
    setShowAdd(false);
    window.dispatchEvent(new Event("calendar:refresh"));
  };

  // Used when focusing a specific task in the pomodoro timer
  const focusInPomodoro = (task) => {
    if (!task) return;
    window.dispatchEvent(new CustomEvent("pomodoro:setTask", { detail: { id: task.id, title: task.title } }));
  };

  // Toggle task done (checkbox)
  const toggleDone = async (id) => {
    const task = tasks.find(t => t.id === id);
    if (!task || !user || !user.id) return;

    // Add or Remove gold, xp, stats from user economy when task complete/undo complete
    const nowDone = !task.done;
    const deltas = nowDone ? econDelta(task, "add") : econDelta(task, "revoke");

    // Update backend economy
    await updateEconomy(user.id, deltas);

    // Update task
    const newData = { ...task, done: nowDone };
    await updateTask(user.id, id, newData);

    // Update local state
    setTasks((prev) => prev.map((t) => (t.id === id ? newData : t)));

    // Refresh user data to update stats in Dashboard
    await refreshUser();
  };

  // Button pressed to edit a task
  const openEdit = (id) => {
    const t = tasks.find((x) => x.id === id);
    if (!t) return;
    setEditForm({
      ...t,
      dueAtLocal: t.dueAt ? t.dueAt.slice(0, 10) : "",
    });
    setShowEdit(true);
  };

  // Save edited task
  const saveEdit = () => {
    if (!editForm) return;
    setTasks(prev => prev.map(t => {
      if (t.id !== editForm.id) return t;
      const due = editForm.dueAtLocal ? new Date(editForm.dueAtLocal + "T00:00:00") : null;
      const newData = {
        ...t,
        title: editForm.title || "(no title)",
        type: ["Habit", "Daily", "To-Do"].includes(editForm.type) ? editForm.type : t.type,
        category: ["STR", "DEX", "CHA", "WIS", "INT"].includes(editForm.category) ? editForm.category : t.category,
        difficulty: DIFF_ORDER.includes(editForm.difficulty) ? editForm.difficulty : t.difficulty,
        pomsEstimate: Math.max(0, parseInt(editForm.pomsEstimate || 0, 10)),
        dueAt: due ? due.toISOString() : null,
      }
      updateTask(user.id, editForm.id, newData)
      return newData;
    }));
    setShowEdit(false);
    setEditForm(null);
    window.dispatchEvent(new Event("calendar:refresh"));
  };

  // Remove task from taskboard
  const removeTask = (id) => {
    if (!window.confirm("Delete this task?")) return;
    setTasks(prev => prev.filter(t => t.id !== id));
    deleteTask(user.id, id)
  };

  // Updates the Habit, Daily, To-Do counts on Dashboard
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
