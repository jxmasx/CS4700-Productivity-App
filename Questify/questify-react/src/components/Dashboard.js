import React, { useMemo } from "react";
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

export default function Dashboard() {
  const base = process.env.PUBLIC_URL || "";

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
    <div className="dashboard-root">
      <div className="app-container wb-layout">
        {/* Left column: Name / Avatar */}
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
        </section>

        {/* Left column: Character Info */}
        <section className="panel character-info only-text">
          <h2>Character Info</h2>
          <div className="info-stack">
            <div><strong>Class:</strong> {character.class}</div>
            <div><strong>Guild Rank:</strong> {character.guildRank}</div>
            <div style={{ marginTop: 10 }}><strong>EXP:</strong> {character.exp}</div>
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
          <h2>Tasks</h2>
          <TaskBoard />
        </section>
      </div>
    </div>
  );
}
