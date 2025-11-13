/*-----------------------------------------------------------------------------
  Drag-and-drop task board for Habits, Dailies, and To-Dos.

  - Uses @hello-pangea/dnd for drag ordering
  - Saves tasks to localStorage (qf_tasks_v1)  // backend later
  - Simple prompt-based UI for add/edit
  - Checkboxes for completion
  - Calls onFirstTaskGiven() the first time the user adds a task (ever)
-----------------------------------------------------------------------------*/

import React, { useEffect, useMemo, useState } from "react";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";

const STORAGE_KEY = "qf_tasks_v1";
const FIRST_TASK_FLAG_KEY = "qf_first_task_given_v1";

const TYPE_COLORS = {
  Habit:   { bg: "#cfe4ff", stripe: "#4b90ff" },
  Daily:   { bg: "#cfeecf", stripe: "#46a546" },
  "To-Do": { bg: "#ffd6ea", stripe: "#ff5aa5" },
};

function loadTasks() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    /*Ignores parse errors and falls back to defaults*/
  }
  /*Default starting tasks (optional; we can make this [] if we want a blank board instead of giving base quests)*/
  return [
    { id: "t1", title: "Read 10 pages", type: "Habit", dueAt: null, done: false },
    { id: "t2", title: "AM workout", type: "Daily", dueAt: null, done: false },
    { id: "t3", title: "Finish dashboard layout", type: "To-Do", dueAt: null, done: false },
  ];
}

function saveTasks(tasks) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
  } catch {
    /*ignores write errors*/
  }
}

export default function TaskBoard({ onFirstTaskGiven }) {
  const [tasks, setTasks] = useState(loadTasks);

  //Checks if the "first task" hook has already been triggered (or was ever triggered)?*/
  const [hasTriggeredFirstTask, setHasTriggeredFirstTask] = useState(() => {
    try {
      return localStorage.getItem(FIRST_TASK_FLAG_KEY) === "1";
    } catch {
      return false;
    }
  });

  useEffect(() => {
    saveTasks(tasks);
  }, [tasks]);

  const onDragEnd = (result) => {
    if (!result.destination) return;
    const next = Array.from(tasks);
    const [moved] = next.splice(result.source.index, 1);
    next.splice(result.destination.index, 0, moved);
    setTasks(next);
  };

  const addTask = () => {
    const title = prompt("Task title:");
    if (!title) return;

    const typeInput = prompt('Type? Enter "Habit", "Daily" or "To-Do":', "To-Do");
    const norm = (typeInput || "").trim();
    const valid = ["Habit", "Daily", "To-Do"].includes(norm) ? norm : "To-Do";

    const newTask = {
      id: crypto.randomUUID(),
      title,
      type: valid,
      dueAt: null,
      done: false,
    };

    setTasks((prev) => {
      const next = [...prev, newTask];

      /*Fires the hook exactly once in this profile's lifetime*/
      if (!hasTriggeredFirstTask && typeof onFirstTaskGiven === "function") {
        onFirstTaskGiven();
        setHasTriggeredFirstTask(true);
        try {
          localStorage.setItem(FIRST_TASK_FLAG_KEY, "1");
        } catch {
          /*ignores*/
        }
      }

      return next;
    });
  };

  const toggleDone = (id) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, done: !t.done } : t))
    );
  };

  const editTask = (id) => {
    const t = tasks.find((x) => x.id === id);
    if (!t) return;

    const titleInput = prompt("Edit title:", t.title);
    const title =
      titleInput != null && titleInput.trim() !== "" ? titleInput : t.title;

    const typeInput = prompt('Edit type (Habit / Daily / To-Do):', t.type);
    const validTypes = ["Habit", "Daily", "To-Do"];
    const safeType =
      typeInput && validTypes.includes(typeInput) ? typeInput : t.type;

    setTasks((prev) =>
      prev.map((x) =>
        x.id === id ? { ...x, title, type: safeType } : x
      )
    );
  };

  const removeTask = (id) => {
    if (!window.confirm("Delete this task?")) return;
    setTasks((prev) => prev.filter((t) => t.id !== id));
  };

  const counts = useMemo(() => {
    const c = { Habit: 0, Daily: 0, "To-Do": 0 };
    tasks.forEach((t) => {
      if (c[t.type] != null) c[t.type] += 1;
    });
    return c;
  }, [tasks]);

  return (
    <div>
      {/*Header Actions*/}
      <div className="taskbar">
        <div className="pill">Habits: {counts.Habit}</div>
        <div className="pill">Dailies: {counts.Daily}</div>
        <div className="pill">To-Dos: {counts["To-Do"]}</div>
        <div className="tab-spacer" />
        <button
          className="tab action"
          onClick={addTask}
          title="Add Task"
        >
          +
        </button>
      </div>

      <DragDropContext onDragEnd={onDragEnd}>
        <Droppable droppableId="task-list">
          {(provided) => (
            <div
              className="task-list"
              ref={provided.innerRef}
              {...provided.droppableProps}
            >
              {tasks.map((t, index) => {
                const colors = TYPE_COLORS[t.type] || TYPE_COLORS["To-Do"];
                return (
                  <Draggable draggableId={t.id} index={index} key={t.id}>
                    {(p, snapshot) => (
                      <div
                        ref={p.innerRef}
                        {...p.draggableProps}
                        className={`task task-row ${
                          snapshot.isDragging ? "dragging" : ""
                        }`}
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

                        <label className="check-wrap">
                          <input
                            type="checkbox"
                            checked={t.done}
                            onChange={() => toggleDone(t.id)}
                          />
                          <span className={`title ${t.done ? "done" : ""}`}>
                            {t.title}
                          </span>
                          <span className="type-tag">{t.type}</span>
                        </label>

                        <div className="task-row-actions">
                          <button
                            onClick={() => editTask(t.id)}
                            aria-label="Edit"
                          >
                            ✎
                          </button>
                          <button
                            onClick={() => removeTask(t.id)}
                            aria-label="Delete"
                          >
                            🗑
                          </button>
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
    </div>
  );
}
