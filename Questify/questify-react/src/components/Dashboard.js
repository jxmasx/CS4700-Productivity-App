import React, { useMemo, useState } from "react";
import TaskBoard from "./TaskBoard";
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from "recharts";
import "../style.css";
import CalendarView from "./CalendarView";
import PomodoroTimer from "./PomodoroTimer";

export default function Dashboard() {
  const base = process.env.PUBLIC_URL || "";
  const [taskTab, setTaskTab] = useState("list"); 

  const character = {
    name: "Ash",
    class: "Scholar",
    guildRank: "Apprentice",
    exp: 420,
    stats: { HP: 24, MP: 12, STR: 6, DEX: 8, STAM: 9, INT: 11, WIS: 7, CHARM: 5 },
  };

  const radar = useMemo(() => {
    const entries = Object.entries(character.stats);
    const maxVal = Math.max(10, ...entries.map(([, v]) => v));
    return {
      data: entries.map(([k, v]) => ({ subject: k, value: v })),
      max: maxVal,
    };
  }, [character.stats]);

  return (
    <div className="wrap">
      <div className="wood">
        <div className="title-band">
        </div>

        <div className="dashboard-root">
          <div className="app-container wb-layout">
            {/* Left column: Avatar + info */}
            <section className="panel avatar-panel">
              <h2>{character.name}</h2>
              <div className="avatar-box">
                <img
                  src={`${base}/public/sprites/npc_registar.png`}
                  alt="Avatar"
                  className="avatar-img"
                  onError={(e) => (e.currentTarget.style.display = "none")}
                />
              </div>
              <div className="info-stack">
                <div><strong>Class:</strong> {character.class}</div>
                <div><strong>Guild Rank:</strong> {character.guildRank}</div>
                <div style={{ marginTop: 20 }}><strong>EXP:</strong> {character.exp}</div>
              </div>
            </section>

            {/* Left column: Radar */}
            <section className="panel radar-panel">
              <h2>Character Stats</h2>
              <div className="radar-wrap">
                <ResponsiveContainer>
                  <RadarChart data={radar.data}>
                    <PolarGrid />
                    <PolarAngleAxis dataKey="subject" />
                    <PolarRadiusAxis angle={30} domain={[0, radar.max]} />
                    <Tooltip />
                    <Legend />
                    <Radar
                      name={character.name}
                      dataKey="value"
                      stroke="#1c75d8"
                      fill="#5dcaff"
                      fillOpacity={0.35}
                    />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </section>

            {/* Left column: Inventory */}
            <section className="panel inventory">
              <h2>Inventory</h2>
              <div className="inventory-grid wb-three">
                {Array.from({ length: 9 }).map((_, i) => (
                  <div className="slot" key={i} />
                ))}
              </div>
            </section>

            {/* Right column: Tasks */}
            <section className="panel tasks tasks-tall wb-tasks">
              <div className="tabbar parchment-tabs">
                <button
                  className={`tab ${taskTab === "list" ? "active" : ""}`}
                  onClick={() => setTaskTab("list")}
                >
                  Task List
                </button>
                <button
                  className={`tab ${taskTab === "calendar" ? "active" : ""}`}
                  onClick={() => setTaskTab("calendar")}
                >
                  Calendar
                </button>
                <button
                  className={`tab ${taskTab === "pomodoro" ? "active" : ""}`}
                  onClick={() => setTaskTab("pomodoro")}
                >
                  Pomodoro
                </button>
                <div className="tab-spacer" />
              </div>

              {taskTab === "list" && (
                <div className="task-list">
                  <TaskBoard />
                </div>
              )}
              {taskTab === "calendar" && (
                <div className="task-list">
                  <CalendarView />
                </div>
              )}
              {taskTab === "pomodoro" && (
                <div className="task-list">
                  <PomodoroTimer />
                </div>
              )}
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
