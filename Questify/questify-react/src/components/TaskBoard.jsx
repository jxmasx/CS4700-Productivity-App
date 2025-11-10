import React, { useEffect, useMemo, useState } from "react";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { useUser } from "../contexts/UserContext";

const STORAGE_KEY = "qf_tasks_v1";

const TYPE_COLORS = {
  Habit: { bg: "#cfe4ff", stripe: "#4b90ff" },
  Daily: { bg: "#cfeecf", stripe: "#46a546" },
  "To-Do": { bg: "#ffd6ea", stripe: "#ff5aa5" },
};

async function readTasks(user_id) {
    try {
      const response = await fetch(`https://questify.duckdns.org/api/users/${user_id}/quests`);
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error reading quests:', error);
      return [];
    }
  }

async function createTask(user_id, taskData) {
  try {
    const response = await fetch(`https://questify.duckdns.org/api/users/${user_id}/quests`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(taskData)
    });
    return await response.json();
  } catch (error) {
    console.error('Error creating quest:', error);
    return null;
  }
}

async function updateTask(user_id, quest_id, taskData) {
  try {
    const response = await fetch(`https://questify.duckdns.org/api/users/${user_id}/quests/${quest_id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(taskData)
    });
    return await response.json();
  } catch (error) {
    console.error('Error updating quest:', error);
    return null;
  }
}

async function deleteTask(user_id, quest_id) {
  try {
    await fetch(`https://questify.duckdns.org/api/users/${user_id}/quests/${quest_id}`, {
      method: 'DELETE'
    });
    return true;
  } catch (error) {
    console.error('Error deleting quest:', error);
    return false;
  }
}

// async function loadTasks() {
//   try {
//     const raw = localStorage.getItem(STORAGE_KEY);
//     const raw = await readQuests(user.id)

//     if (raw) return JSON.parse(raw);
//   } catch { }
//   return [
//     { id: "t1", title: "Read 10 pages", type: "Habit", dueAt: null, done: false },
//     { id: "t2", title: "AM workout", type: "Daily", dueAt: null, done: false },
//     { id: "t3", title: "Finish dashboard layout", type: "To-Do", dueAt: null, done: false },
//   ];
// }

const DEFAULT_TASKS = [
  { title: "Read 10 pages", type: "Habit", due_at: null, is_active: 1 },
  { title: "AM workout", type: "Daily", due_at: null, is_active: 1 },
  { title: "Finish dashboard layout", type: "To-Do", due_at: null, is_active: 1 },
];

export default function TaskBoard() {
  const { user } = useUser();
  const [tasks, setTasks] = useState([]);

  // Load tasks from database on mount, or create default tasks if none exist
  useEffect(() => {
    async function fetchTasks() {
      if (user && user.id) {
        try {
          const data = await readTasks(user.id);
          if (data.length === 0) {
            const createdTasks = [];
            for (const defaultTask of DEFAULT_TASKS) {
              const newTask = await createTask(user.id, defaultTask);
              if (newTask) {
                createdTasks.push(newTask);
              }
            }
            
            if (createdTasks.length > 0) {
              setTasks(createdTasks);
            }
          } else {
            setTasks(data);
          }
        } catch (error) {
          console.error('Error in fetchTasks:', error);
        }
      }
    }
    fetchTasks();
  }, [user]);

  const onDragEnd = (result) => {
    if (!result.destination) return;
    const next = Array.from(tasks);
    const [moved] = next.splice(result.source.index, 1);
    next.splice(result.destination.index, 0, moved);
    setTasks(next);
  };

  const addTask = async () => {
    if (!user || !user.id) return;
    
    const title = prompt("Task title:");
    if (!title) return;
    const type = prompt('Type? Enter "Habit", "Daily" or "To-Do":', "To-Do");
    const norm = (type || "").trim();
    const valid = ["Habit", "Daily", "To-Do"].includes(norm) ? norm : "To-Do";
    
    const newTask = await createTask(user.id, {
      title,
      type: valid,
      due_at: null,
      is_active: 1
    });
    
    if (newTask) {
      setTasks((prev) => Array.isArray(prev) ? [...prev, newTask] : [newTask]);
    }
  };

  const toggleDone = async (id) => {
    if (!user || !user.id) return;
    
    const task = Array.isArray(tasks) ? tasks.find((t) => t.id === id) : null;
    if (!task) return;
    
    const updated = await updateTask(user.id, id, {
      title: task.title,
      type: task.type,
      due_at: task.due_at,
      is_active: task.is_active === 1 ? 0 : 1
    });
    
    if (updated) {
      setTasks((prev) => Array.isArray(prev) ? prev.map((t) => (t.id === id ? updated : t)) : [updated]);
    }
  };

  const editTask = async (id) => {
    if (!user || !user.id) return;
    
    const t = Array.isArray(tasks) ? tasks.find((x) => x.id === id) : null;
    if (!t) return;
    const title = prompt("Edit title:", t.title) ?? t.title;
    const type = prompt('Edit type (Habit / Daily / To-Do):', t.type) ?? t.type;
    const valid = ["Habit", "Daily", "To-Do"].includes(type) ? type : t.type;
    
    const updated = await updateTask(user.id, id, {
      title,
      type: valid,
      due_at: t.due_at,
      is_active: t.is_active
    });
    
    if (updated) {
      setTasks((prev) => Array.isArray(prev) ? prev.map((x) => (x.id === id ? updated : x)) : [updated]);
    }
  };

  const removeTask = async (id) => {
    if (!user || !user.id) return;
    
    if (!window.confirm("Delete this task?")) return;
    
    const success = await deleteTask(user.id, id);
    if (success) {
      setTasks((prev) => Array.isArray(prev) ? prev.filter((t) => t.id !== id) : []);
    }
  };


  const counts = useMemo(() => {
    const c = { Habit: 0, Daily: 0, "To-Do": 0 };
    if (Array.isArray(tasks)) {
      tasks.forEach((t) => (c[t.type] += 1));
    }
    return c;
  }, [tasks]);

  return (
    <div>
      {/* header actions */}
      <div className="taskbar">
        <div className="pill">Habits: {counts.Habit}</div>
        <div className="pill">Dailies: {counts.Daily}</div>
        <div className="pill">To-Dos: {counts["To-Do"]}</div>
        <div className="tab-spacer" />
        <button className="tab action" onClick={addTask} title="Add Task">+</button>
      </div>

      <DragDropContext onDragEnd={onDragEnd}>
        <Droppable droppableId="task-list">
          {(provided) => (
            <div className="task-list" ref={provided.innerRef} {...provided.droppableProps}>
              {Array.isArray(tasks) && tasks.map((t, index) => {
                const colors = TYPE_COLORS[t.type] || TYPE_COLORS["To-Do"];
                return (
                  <Draggable draggableId={String(t.id)} index={index} key={t.id}>
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

                        <label className="check-wrap">
                          <input
                            type="checkbox"
                            checked={t.is_active === 0}
                            onChange={() => toggleDone(t.id)}
                          />
                          <span className={`title ${t.is_active === 0 ? "done" : ""}`}>{t.title}</span>
                          <span className="type-tag">{t.type}</span>
                        </label>

                        <div className="task-row-actions">
                          <button onClick={() => editTask(t.id)} aria-label="Edit">✎</button>
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
    </div>
  );
}
