import React, { useEffect, useRef, useState } from "react";
import { API } from "../apiBase";
import { useUser } from "../contexts/UserContext";
import { updateEconomy } from '../utils/EconAPI.js';

const STORE = "qf_pomodoro_v1";
// const DASHBOARD_STORE = "qf_dashboard_state_v1";

// Default settings for timer
const DEFAULTS = {
  mode: "focus", // "focus" | "short" | "long"
  running: false,
  focusMin: 25,
  shortMin: 5,
  longMin: 15,
  roundsUntilLong: 4,
  secondsLeft: 25 * 60,
  completedFocusRounds: 0,
};

// Keeps timer value n in range (min, max), else gives fallback
function clampNumber(n, min, max, fallback) {
  const x = Number(n);
  if (!Number.isFinite(x)) return fallback;
  return Math.min(max, Math.max(min, x));
}

// Validates timer settings
function migrateAndNormalize(raw) {
  // Set base timer with default values
  const base = { ...DEFAULTS, ...(raw || {}) };

  // Handle old versions using breakMin instead of shortMin
  if (raw && raw.breakMin != null && (raw.shortMin == null)) {
    base.shortMin = Number(raw.breakMin);
  }

  // Validate that given timer values fall into specific ranges
  base.focusMin = clampNumber(base.focusMin, 1, 180, DEFAULTS.focusMin);
  base.shortMin = clampNumber(base.shortMin, 1, 60, DEFAULTS.shortMin);
  base.longMin = clampNumber(base.longMin, 1, 90, DEFAULTS.longMin);
  base.roundsUntilLong = clampNumber(base.roundsUntilLong, 1, 10, DEFAULTS.roundsUntilLong);
  base.completedFocusRounds = clampNumber(base.completedFocusRounds, 0, 9999, 0);

  // Calculate seconds from mode of timer (focus, long break, etc)
  const secondsFromMode =
    (base.mode === "focus" ? 
      base.focusMin : 
      base.mode === "short" ? 
      base.shortMin : base.longMin) * 60;

  // Validate seconds left on timer
  base.secondsLeft = Number.isFinite(base.secondsLeft) ? base.secondsLeft : secondsFromMode;

  if (!Number.isFinite(base.secondsLeft) || base.secondsLeft < 0) {
    base.secondsLeft = secondsFromMode;
  }

  return base;
}

function loadStore() {
  try {
    const raw = localStorage.getItem(STORE);
    if (!raw) return { ...DEFAULTS };
    const parsed = JSON.parse(raw);
    return migrateAndNormalize(parsed);
  } catch {
    return { ...DEFAULTS };
  }
}
function saveStore(s) {
  try {
    localStorage.setItem(STORE, JSON.stringify(s));
  } catch {}
}

// function loadDashboard() {
//   try {
//     const raw = localStorage.getItem(DASHBOARD_STORE);
//     if (raw) return JSON.parse(raw);
//   } catch {}
//   return null;
// }
// function saveDashboard(next) {
//   try {
//     localStorage.setItem(DASHBOARD_STORE, JSON.stringify(next));
//   } catch {}
// }

// ---------- Sounds / Notifications ----------
function beep() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = "sine";
    o.frequency.value = 880;
    o.connect(g);
    g.connect(ctx.destination);
    g.gain.setValueAtTime(0.001, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.2, ctx.currentTime + 0.02);
    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);
    o.start();
    o.stop(ctx.currentTime + 0.25);
  } catch {}
}
function notify(title, body) {
  if (typeof Notification !== "undefined" && Notification.permission === "granted") {
    try {
      new Notification(title, { body });
    } catch {}
  }
}

// Format timer in MM:SS notation
function formatMMSS(totalSeconds) {
  const s = Math.max(0, Math.floor(Number.isFinite(totalSeconds) ? totalSeconds : 0));
  const mPart = String(Math.floor(s / 60)).padStart(2, "0");
  const sPart = String(s % 60).padStart(2, "0");
  return `${mPart}:${sPart}`;
}

export default function PomodoroTimer() {
  const { user, refreshUser } = useUser();
  const [s, setS] = useState(loadStore);
  const tickRef = useRef(null);
  const titleBaseRef = useRef(document.title);

  useEffect(() => {
    saveStore(s);
  }, [s]);

  // Request browser permission to send an alert when timer is done
  useEffect(() => {
    if (typeof Notification !== "undefined" && Notification.permission === "default") {
      Notification.requestPermission().catch(() => {});
    }
  }, []);

  // Set validated timer settings from state
  useEffect(() => {
    setS((prev) => migrateAndNormalize(prev));
  }, []);

  // Main timer engine
  useEffect(() => {
    // Run only if timer is running
    if (!s.running) return;
    if (tickRef.current) clearInterval(tickRef.current);
    tickRef.current = setInterval(() => {
      setS((prev) => {
        const left = Number(prev.secondsLeft);
        if (Number.isFinite(left) && left > 0) {
          return { ...prev, secondsLeft: left - 1 };
        }

        const isFocus = prev.mode === "focus";
        let next = { ...prev };

        if (isFocus) {
          const rewardXP = prev.focusMin * 2;
          const rewardGold = Math.floor(prev.focusMin / 5);
          
          updateEconomy(user?.id, { xp_delta: rewardXP, gold_delta: rewardGold }).then(() => {
            refreshUser();
          });
          
          notify("Focus complete 🎉", `+${rewardXP} XP, +${rewardGold} Gold`);
          beep();

          const newCount = prev.completedFocusRounds + 1;
          const longDue = newCount % prev.roundsUntilLong === 0;
          next.mode = longDue ? "long" : "short";
          next.secondsLeft = (longDue ? prev.longMin : prev.shortMin) * 60;
          next.completedFocusRounds = newCount;
        } else {
          next.mode = "focus";
          next.secondsLeft = prev.focusMin * 60;
          notify("Break over", "Time to focus!");
          beep();
        }

        if (!Number.isFinite(next.secondsLeft) || next.secondsLeft < 0) {
          next.secondsLeft =
            (next.mode === "focus"
              ? prev.focusMin
              : next.mode === "short"
              ? prev.shortMin
              : prev.longMin) * 60;
        }

        window.dispatchEvent(new CustomEvent("pomodoro:mode", { detail: next }));
        return next;
      });
    }, 1000);
    return () => clearInterval(tickRef.current);
  }, [s.running]); // Run code when timer running state changes

  // Set browser tab info (icon with current timer time)
  useEffect(() => {
    const base = titleBaseRef.current;
    const mmss = formatMMSS(s.secondsLeft);
    const icon = s.mode === "focus" ? "🔴" : s.mode === "short" ? "🟢" : "🔵";
    document.title = `${icon} ${mmss} • ${base}`;
    return () => {
      document.title = base;
    };
  }, [s.mode, s.secondsLeft]);

  // Pause the timer
  const startPause = () => setS((x) => ({ ...x, running: !x.running }));

  // Reset the timer
  const reset = () =>
    setS((x) => {
      const secs =
        (x.mode === "focus"
          ? x.focusMin
          : x.mode === "short"
          ? x.shortMin
          : x.longMin) * 60;
      return { ...x, running: false, secondsLeft: secs };
    });

  // Return timer info of selected mode
  const toMode = (mode) =>
    setS((x) => {
      const mins =
        mode === "focus" ? x.focusMin : mode === "short" ? x.shortMin : x.longMin;
      const secs = Number(mins) * 60;
      return {
        ...x,
        mode,
        running: false,
        secondsLeft: Number.isFinite(secs) ? secs : DEFAULTS.secondsLeft,
      };
    });

  // Get MM:SS formatted time as variable
  const mmss = formatMMSS(s.secondsLeft);
  const roundLabel =
    s.mode === "focus" ? `#${s.completedFocusRounds + 1}` : `#${s.completedFocusRounds}`;

  return (
    <div className="pomo-wrap">
      <div className={`pomo-card mode-${s.mode}`}>
        <div className="pomo-tabs">
          <button
            type="button"
            className={`pomo-tab ${s.mode === "focus" ? "active" : ""}`}
            onClick={() => toMode("focus")}
          >
            Pomodoro
          </button>
          <button
            type="button"
            className={`pomo-tab ${s.mode === "short" ? "active" : ""}`}
            onClick={() => toMode("short")}
          >
            Short Break
          </button>
          <button
            type="button"
            className={`pomo-tab ${s.mode === "long" ? "active" : ""}`}
            onClick={() => toMode("long")}
          >
            Long Break
          </button>
        </div>

        <div className="pomo-timer">{mmss}</div>

        <div className="pomo-actions">
          <button type="button" className="pomo-btn-primary" onClick={startPause}>
            {s.running ? "PAUSE" : "START"}
          </button>
          <button type="button" className="pomo-btn-ghost" onClick={reset}>
            Reset
          </button>
        </div>

        <div className="pomo-subtext">
          <div className="pomo-round">{roundLabel}</div>
          <div className="pomo-status">
            {s.mode === "focus"
              ? "Time to focus!"
              : s.mode === "short"
              ? "Take a short break."
              : "Enjoy a long break."}
          </div>
        </div>
      </div>
    </div>
  );
}
