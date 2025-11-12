/* -----------------------------------------------------------------------------
   CENTRAL PLAYER DASHBOARD / TestDashboard.js

   - Starter Quest:
     * QuestCard manages its own completion via "questStatus" in localStorage
     * QuestCard enqueues rewards for Guild Hall via "pendingRewards"
     * onQuestCompleted gives XP + Gold immediately on the dashboard
 -----------------------------------------------------------------------------*/

import React, { useEffect, useMemo, useState } from "react";
import "../style.css";
import TaskBoard from "./TaskBoard";
import CalendarView from "./CalendarView";
import PomodoroTimer from "./PomodoroTimer";
import QuestCard from "./QuestCard";
import IntegrationsPopup from "./IntegrationsPopup";
import QuestifyNavBar from "./QuestifyNavBar";

import {
  Chart as ChartJS,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
} from "chart.js";
import { Radar as RadarChartJS } from "react-chartjs-2";

/*Registers radar chart pieces*/
ChartJS.register(
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend
);

/*LocalStorage keys*/
const STORE = "qf_dashboard_state_v1";
const INTEGRATIONS_SEEN_KEY = "qf_integrations_seen_v1";
const QUEST_STATUS_KEY = "questStatus";

/*Starter quest rewards (should match QuestCard defaults)*/
const STARTER_QUEST_ID = "starter-quest-first-habit";
const STARTER_QUEST_XP = 10;
const STARTER_QUEST_GOLD = 5;

/*Simple deep clone fallback*/
const clone = (obj) =>
  typeof structuredClone === "function"
    ? structuredClone(obj)
    : JSON.parse(JSON.stringify(obj));

/*Baseline state if nothing is saved yet - WILL NEED TO BE REPLACED*/
const DEFAULT = {
  profile: {
    name: "Ash",
    class: "Scholar",
    rank: "Apprentice",
    streak: 1,
    level: 1,
    xp: 0,
    xpMax: 100,
    gold: 250,
    diamonds: 5,
  },
  baseStats: {
    STR: 4,
    DEX: 6,
    STAM: 5,
    INT: 7,
    WIS: 5,
    CHARM: 3,
  },
  gearSlots: ["head", "chest", "arm", "pants", "foot", "weapon1", "weapon2", "extra"],
  gear: {},
  items: [
    { id: "i1", name: "Bronze Sword", slot: "weapon1", bonus: { STR: 1 }, desc: "Reliable beginner blade." },
    { id: "i2", name: "Oak Staff", slot: "weapon2", bonus: { INT: 1 }, desc: "Channeling focus for spells." },
    { id: "i3", name: "Leather Cap", slot: "head", bonus: { STAM: 1 }, desc: "Light protection." },
    { id: "i4", name: "Scholar Robe", slot: "chest", bonus: { INT: 1, WIS: 1 }, desc: "Robes of learning." },
    { id: "i5", name: "Boots", slot: "foot", bonus: { DEX: 1 }, desc: "Move with purpose." },
    { id: "i6", name: "Charm Locket", slot: "extra", bonus: { CHARM: 1 }, desc: "A glimmer of charisma." },
  ],
  tasks: [
    { id: "t1", title: "Write 300 words", type: "task", progress: 0, exp: 40, gold: 20, diamonds: 0 },
    { id: "t2", title: "Daily Water", type: "habit", progress: 0, exp: 15, gold: 5, diamonds: 0 },
    { id: "t3", title: "PR for Sprint", type: "task", progress: 0, exp: 30, gold: 15, diamonds: 0 },
  ],
};

export default function Dashboard() {
  const base = process.env.PUBLIC_URL || "";

  /*Shows which tab on the right-hand side is active*/
  const [taskTab, setTaskTab] = useState("list");

  /*Integrations popup: opens by default if never seen before*/
  const [showIntegrations, setShowIntegrations] = useState(() => {
    const seen = localStorage.getItem(INTEGRATIONS_SEEN_KEY);
    return !seen;
  });

  /*Main dashboard state (profile, stats, gear, tasks, etc.)*/
  const [state, setState] = useState(() => {
    const saved = localStorage.getItem(STORE);
    return saved ? JSON.parse(saved) : clone(DEFAULT);
  });

  /*Controls whether the starter quest popup is visible*/
  const [showStarterQuestPopup, setShowStarterQuestPopup] = useState(false);

  /*Persist dashboard state whenever it changes*/
  useEffect(() => {
    localStorage.setItem(STORE, JSON.stringify(state));
  }, [state]);

  const handleCloseIntegrations = () => {
    localStorage.setItem(INTEGRATIONS_SEEN_KEY, "1");
    setShowIntegrations(false);
  };

  /*Placeholder for when Canvas/Calendar is connected*/
  const handleIntegrationsConnected = (info) => {
    /* info = { canvas, calendar, canvasAssignments, calendarEvents}
       Future idea: auto-create tasks from assignments and events here.*/
    console.log("Integrations connected:", info);
  };

  /* ---------------------- GEAR / INVENTORY LOGIC ------------------------- */
  const equipItem = (itemId, slot) => {
    setState((prev) => ({
      ...prev,
      gear: { ...prev.gear, [slot]: itemId },
    }));
  };

  const unequipSlot = (slot) => {
    setState((prev) => {
      const next = { ...prev, gear: { ...prev.gear } };
      delete next.gear[slot];
      return next;
    });
  };

  const slotLabels = {
    head: "Head Gear",
    chest: "Chest Gear",
    arm: "Arm Gear",
    pants: "Pants Gear",
    foot: "Foot Gear",
    weapon1: "Weapon #1",
    weapon2: "Weapon #2 / Magic",
    extra: "Xtra Item",
  };

  const gearBonuses = useMemo(() => {
    const bonus = { STR: 0, DEX: 0, STAM: 0, INT: 0, WIS: 0, CHARM: 0 };
    Object.values(state.gear).forEach((id) => {
      const item = state.items.find((i) => i.id === id);
      if (!item || !item.bonus) return;
      for (const k in item.bonus) {
        bonus[k] += item.bonus[k];
      }
    });
    return bonus;
  }, [state.gear, state.items]);

  const totalStats = useMemo(() => {
    const res = { ...state.baseStats };
    for (const k in gearBonuses) {
      res[k] = (res[k] || 0) + gearBonuses[k];
    }
    return res;
  }, [state.baseStats, gearBonuses]);

  function openEquip(slot) {
    const choices = state.items.filter((i) => i.slot === slot);
    if (!choices.length) {
      alert("No item for this slot yet. Win rewards to find gear!");
      return;
    }
    const names = choices.map((i) => i.name).join("\n");
    const pick = prompt(
      `Equip to ${slotLabels[slot]}:\n${names}\nType the exact name.`
    );
    const item = choices.find(
      (i) => i.name.toLowerCase() === String(pick || "").toLowerCase()
    );
    if (item) equipItem(item.id, slot);
  }

  function renderSlot(slot) {
    const equipped = state.gear[slot];
    const isEquipped = !!equipped;

    return (
      <button
        key={slot}
        className="slot"
        data-slot={slot}
        data-equipped={isEquipped}
        onClick={() => openEquip(slot)}
        onContextMenu={(e) => {
          e.preventDefault();
          if (state.gear[slot]) unequipSlot(slot);
        }}
        title={
          isEquipped
            ? `${slotLabels[slot]} ✓ (left-click to change, right-click to unequip)`
            : `${slotLabels[slot]} (left-click to equip)`
        }
      >
        {isEquipped ? `${slotLabels[slot]} ✓` : slotLabels[slot]}
      </button>
    );
  }

  const slotsOrder = [
    "head",
    "chest",
    "arm",
    "weapon1",
    "weapon2",
    "extra",
    "pants",
    "foot",
    null,
  ];

  /* --------------------------- RADAR CHART ------------------------------- */

  const radarData = useMemo(() => {
    const STR = totalStats.STR ?? 0;
    const DEX = totalStats.DEX ?? 0;
    const INT = totalStats.INT ?? 0;
    const WIS = totalStats.WIS ?? 0;
    const CHARM = totalStats.CHARM ?? 0;

    return {
      labels: ["Strength", "Dexterity", "Intelligence", "Wisdom", "Charisma"],
      datasets: [
        {
          label: "Character Stats",
          data: [STR, DEX, INT, WIS, CHARM],
          backgroundColor: "rgba(34, 197, 94, 0.2)",
          borderColor: "rgba(34, 197, 94, 1)",
          borderWidth: 2,
          pointBackgroundColor: "rgba(34, 197, 94, 1)",
          pointBorderColor: "#fff",
          pointHoverBackgroundColor: "#fff",
          pointHoverBorderColor: "rgba(34, 197, 94, 1)",
        },
      ],
    };
  }, [totalStats]);

  const radarOptions = {
    responsive: true,
    maintainAspectRatio: true,
    scales: {
      r: {
        angleLines: { display: true, color: "rgba(0,0,0,0.1)" },
        ticks: { stepSize: 5 },
      },
    },
    plugins: {
      legend: { display: false },
    },
  };

  /* ---------------------- QUEST POPUP HANDLERS --------------------------- */

  /*Called by TaskBoard when the *first* task is given/created.*/
  const handleFirstTaskGiven = () => {
    /*Does not show popup if quest is already completed.*/
    try {
      const raw = localStorage.getItem(QUEST_STATUS_KEY);
      if (raw) {
        const map = JSON.parse(raw);
        if (map && map[STARTER_QUEST_ID]?.completed) {
          return;
        }
      }
    } catch {
      /*If parsing fails, just fall through and show popup.*/
    }

    setShowStarterQuestPopup(true);
  };

  const handleStarterQuestCompleted = () => {
    /*Grants EXP + Gold immediately on the Dashboard*/
    setState((prev) => {
      const prevProfile = prev.profile || {};
      let xp = (prevProfile.xp || 0) + STARTER_QUEST_XP;
      let gold = (prevProfile.gold || 0) + STARTER_QUEST_GOLD;
      let level = prevProfile.level || 1;
      const xpMax = prevProfile.xpMax || 100;

      if (xp >= xpMax) {
        xp = xp - xpMax;
        level = level + 1;
      }

      return {
        ...prev,
        profile: {
          ...prevProfile,
          xp,
          gold,
          level,
          xpMax,
        },
      };
    });

    /*Closes the popup when quest is done*/
    setShowStarterQuestPopup(false);
  };

  /* --------------------------- RENDER ------------------------------------ */
  return (
    <div className="wrap">
      <div className="wood">
        {/*Decorative title band across the top*/}
        <div className="title-band"></div>

        {/*Global navigation – links Dashboard, Adventurer, Guild Hall, Intro, etc.*/}
          <QuestifyNavBar />

        <div className="dashboard-root">
          <div className="app-container wb-layout">
            {/*Left Column: Avatar + Profile*/}
            <section className="panel avatar-panel">
              <h2>{state.profile.name}</h2>
              <div className="avatar-box">
                <img
                  src={`${base}/sprites/npc_registar.png`}
                  alt="Avatar"
                  className="avatar-img"
                  onError={(e) => (e.currentTarget.style.display = "none")}
                />
              </div>
              <div className="info-stack">
                <div style={{ marginTop: 15 }}></div>
                <div>
                  <strong>Class:</strong> {state.profile.class}
                </div>
                <div>
                  <strong>Level:</strong> {state.profile.level}
                </div>
                <div>
                  <strong>Guild Rank:</strong> {state.profile.rank}
                </div>
                <div>
                  <strong>Guild Streak:</strong> {state.profile.streak}
                </div>
                <div>
                  <strong>EXP:</strong> {state.profile.xp} / {state.profile.xpMax}
                </div>
                <div>
                  <strong>Gold:</strong> {state.profile.gold}
                </div>
              </div>
            </section>

            {/*Left Column: Radar Chart*/}
            <section className="panel radar-panel">
              <h2>Character Stats</h2>
              <div className="radar-wrap">
                <RadarChartJS data={radarData} options={radarOptions} />
              </div>
            </section>

            {/*Left Column: Inventory / Gear Slots*/}
            <section className="panel inventory">
              <h2>Inventory</h2>
              <div className="inventory-grid wb-three">
                {slotsOrder.map((slot, i) =>
                  slot ? (
                    renderSlot(slot)
                  ) : (
                    <div className="slot" key={`empty-${i}`} />
                  )
                )}
              </div>
            </section>

            {/*Right Column: Tasks / Calendar / Pomodoro*/}
            <section className="panel tasks tasks-tall wb-tasks">
              <div className="tabbar header-buttons">
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
              </div>

              {taskTab === "list" && (
                <>
                  {/*Task board (will notify us when the first task is created/given)*/}
                  <TaskBoard onFirstTaskGiven={handleFirstTaskGiven} />
                </>
              )}

              {taskTab === "calendar" && <CalendarView />}
              {taskTab === "pomodoro" && <PomodoroTimer />}
            </section>
          </div>
        </div>
      </div>

      {/*Integrations popup:
          - Only shows when on Task List tab
          - Only shows when user hasn't dismissed it yet*/}
      {taskTab === "list" && showIntegrations && (
        <IntegrationsPopup
          isOpen={showIntegrations}
          onClose={handleCloseIntegrations}
          onConnected={handleIntegrationsConnected}
        />
      )}

      {showStarterQuestPopup && (
  <div className="quest-modal-backdrop">
    <div className="quest-modal">
      <QuestCard
        visible={true}
        questId={STARTER_QUEST_ID}
        label="Starter Quest: Complete your first habit"
        rewardXp={STARTER_QUEST_XP}
        rewardGold={STARTER_QUEST_GOLD}
        onQuestCompleted={handleStarterQuestCompleted}
      />
      <button
        className="quest-modal-close"
        type="button"
        onClick={() => setShowStarterQuestPopup(false)}
      >
        Close
      </button>
    </div>
  </div>
)}

     </div>
  );
}
