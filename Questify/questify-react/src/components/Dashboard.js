import React, { useEffect, useMemo, useState } from "react";
import { useUser } from "../contexts/UserContext";
import TaskBoard from "./TaskBoard";
import "../style.css";
import CalendarView from "./CalendarView";
import PomodoroTimer from "./PomodoroTimer";
import QuestifyNavBar from "./QuestifyNavBar";
import QuestList from "./QuestList";
import IntegrationsPopupModal from "./IntegrationsPopupModal";

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

//Activate specific components in ChartJS
ChartJS.register(RadialLinearScale, PointElement, LineElement, Filler, Tooltip, Legend);

//Create a clone of a JSON object to prevent overwriting
const clone = (obj) =>
  typeof structuredClone === "function" ? structuredClone(obj) : JSON.parse(JSON.stringify(obj));

//Default data that is shown if no user is loaded yet
const DEFAULT = {
  profile: {
    name: "",
    class: "",
    rank: "",
    streak: 0,
    level: 0,
    xp: 0,
    xpMax: 100,
    gold: 0,
    diamonds: 0,
  },
  baseStats: {
    STR: 0,
    DEX: 0,
    STAM: 0,
    INT: 0,
    WIS: 0,
    CHARM: 0,
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
};

export default function Dashboard() {
  /*Gets the user data from UserContext*/
  const { user, isAuthenticated, loading, refreshUser } = useUser();

  /*Base to grab assets from public folder*/
  const base = process.env.PUBLIC_URL || "";

  /*State for task tab (TaskList, Calendar, Pomodoro, Inventory)*/
  const [taskTab, setTaskTab] = useState("list");

  /*Whether to show the Integrations popup*/
  const [showIntegrations, setShowIntegrations] = useState(false);

  /*Sets the current user info state*/
  const [state, setState] = useState(DEFAULT);

  /*Set user info as a JSON object usable by the dashboard*/
  const USER_INFO = {
    profile: {
      name: user?.display_name ?? "",
      class: user?.user_class ?? "",
      rank: user?.guild_rank ?? "",
      streak: user?.guild_streak ?? 0,
      level: user?.level ?? 0,
      xp: user?.xp ?? 0,
      xpMax: user?.xp_max ?? 100,
      gold: user?.gold ?? 0,
      diamonds: user?.diamonds ?? 0,
    },
    baseStats: {
      STR: user?.strength ?? 0,
      DEX: user?.dexterity ?? 0,
      STAM: user?.stamina ?? 0,
      INT: user?.intelligence ?? 0,
      WIS: user?.wisdom ?? 0,
      CHARM: user?.charisma ?? 0,
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
  };

  /*Sets the user info on mount or on dependency change*/
  useEffect(() => {
    setState(clone(USER_INFO));
  }, [user, isAuthenticated, loading]);

  /*Refreshes user data on mount*/
  useEffect(() => {
    if (user?.id) {
      refreshUser();
    }
    /*eslint-disable-next-line react-hooks/exhaustive-deps*/
  }, []);

  /*When integrations successfully connect:*/
  const handleIntegrationsConnected = (info) => {
    console.log("Integrations connected:", info);
    window.dispatchEvent(new CustomEvent("calendar:refresh"));
    setShowIntegrations(false);
  };

  const equipItem = (itemId, slot) => {
    setState((prev) => ({ ...prev, gear: { ...prev.gear, [slot]: itemId } }));
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

  /*Stat bonuses from equipped gear*/
  const gearBonuses = useMemo(() => {
    const bonus = { STR: 0, DEX: 0, STAM: 0, INT: 0, WIS: 0, CHARM: 0 };
    Object.values(state.gear).forEach((id) => {
      const item = state.items.find((i) => i.id === id);
      if (!item || !item.bonus) return;
      for (const k in item.bonus) bonus[k] += item.bonus[k];
    });
    return bonus;
  }, [state.gear, state.items]);

  /*Total of stats plus bonus stats from equipped gear*/
  const totalStats = useMemo(() => {
    const res = { ...state.baseStats };
    for (const k in gearBonuses) res[k] = (res[k] || 0) + gearBonuses[k];
    return res;
  }, [state.baseStats, gearBonuses]);

  function openEquip(slot) {
    const choices = state.items.filter((i) => i.slot === slot);
    if (!choices.length) {
      alert("No item for this slot yet. Win rewards to find gear!");
      return;
    }
    const names = choices.map((i) => i.name).join("\n");
    const pick = prompt(`Equip to ${slotLabels[slot]}:\n${names}\nType the exact name.`);
    const item = choices.find((i) => i.name.toLowerCase() === String(pick || "").toLowerCase());
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
    plugins: { legend: { display: false } },
  };

  return (
    <div className="wrap">
      <div className="wood">
        <QuestifyNavBar />

        <div className="title-band"></div>

        <div className="dashboard-root container-1200">
          <div className="app-container wb-layout">
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
              </div>
            </section>

            <section className="panel radar-panel">
              <h2>Character Stats</h2>
              <div className="radar-wrap">
                <RadarChartJS data={radarData} options={radarOptions} />
              </div>
            </section>

            <section className="panel tasks tasks-tall wb-tasks">
              <div className="tabbar header-buttons">
                <button
                  className={`tab ${taskTab === "list" ? "active" : ""}`}
                  onClick={() => setTaskTab("list")}
                >
                  Task List
                </button>
                <button
                  className={`tab ${taskTab === "quests" ? "active" : ""}`}
                  onClick={() => setTaskTab("quests")}
                >
                  Quests
                </button>
                <button
                  className={`tab ${taskTab === "calendar" ? "active" : ""}`}
                  onClick={() => {
                    setTaskTab("calendar");
                    setShowIntegrations(true);
                  }}
                >
                  Calendar
                </button>
                <button
                  className={`tab ${taskTab === "pomodoro" ? "active" : ""}`}
                  onClick={() => setTaskTab("pomodoro")}
                >
                  Pomodoro
                </button>
                <button
                  className={`tab ${taskTab === "inventory" ? "active" : ""}`}
                  onClick={() => setTaskTab("inventory")}
                >
                  Inventory
                </button>
              </div>

              {taskTab === "list" && <TaskBoard />}

              {taskTab === "quests" && <QuestList />}

                  
              {taskTab === "calendar" && (
                <>
                  <CalendarView />
                  {/* <IntegrationsPopupModal
                    isOpen={showIntegrations}
                    onClose={() => setShowIntegrations(false)}
                    onConnected={handleIntegrationsConnected}
                  /> */}
                </>
              )}
        
              {taskTab === "pomodoro" && <PomodoroTimer />}

              {taskTab === "inventory" && (
                <div className="inventory-tab">
                  <div className="inventory-grid wb-three">
                    {slotsOrder.map((slot, i) =>
                      slot ? renderSlot(slot) : <div className="slot" key={`empty-${i}`} />
                    )}
                  </div>
                </div>
              )}
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
