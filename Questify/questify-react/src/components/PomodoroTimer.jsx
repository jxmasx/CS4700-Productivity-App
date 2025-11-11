import React, { useEffect, useRef, useState } from "react";

const STORE = "qf_pomodoro_v1";
const DASHBOARD_STORE = "qf_dashboard_state_v1";

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

function clampNumber(n, min, max, fallback) {
  const x = Number(n);
  if (!Number.isFinite(x)) return fallback;
  return Math.min(max, Math.max(min, x));
}

function migrateAndNormalize(raw) {
  const base = { ...DEFAULTS, ...(raw || {}) };

  if (raw && raw.breakMin != null && (raw.shortMin == null)) {
    base.shortMin = Number(raw.breakMin);
  }

  base.focusMin = clampNumber(base.focusMin, 1, 180, DEFAULTS.focusMin);
  base.shortMin = clampNumber(base.shortMin, 1, 60, DEFAULTS.shortMin);
  base.longMin = clampNumber(base.longMin, 1, 90, DEFAULTS.longMin);
  base.roundsUntilLong = clampNumber(base.roundsUntilLong, 1, 10, DEFAULTS.roundsUntilLong);
  base.completedFocusRounds = clampNumber(base.completedFocusRounds, 0, 9999, 0);

  const secondsFromMode =
    (base.mode === "focus"
      ? base.focusMin
      : base.mode === "short"
      ? base.shortMin
      : base.longMin) * 60;

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

function loadDashboard() {
  try {
    const raw = localStorage.getItem(DASHBOARD_STORE);
    if (raw) return JSON.parse(raw);
  } catch {}
  return null;
}
function saveDashboard(next) {
  try {
    localStorage.setItem(DASHBOARD_STORE, JSON.stringify(next));
  } catch {}
}

// ---------- XP / Gold ----------
function addEconomy({ xp = 0, gold = 0 }) {
  const db = loadDashboard();
  if (!db || !db.profile) return;
  let { profile } = db;
  let xpMax = profile.xpMax || 100;
  let curXP = (profile.xp || 0) + xp;
  let level = profile.level || 1;
  let goldBal = (profile.gold || 0) + gold;
  while (curXP >= xpMax) {
    curXP -= xpMax;
    level += 1;
    xpMax = Math.floor(xpMax * 1.15 + 25);
  }
  if (curXP < 0) curXP = 0;
  if (goldBal < 0) goldBal = 0;
  const next = { ...db, profile: { ...profile, xp: curXP, xpMax, level, gold: goldBal } };
  saveDashboard(next);
  window.dispatchEvent(new CustomEvent("economy:changed", { detail: { xp, gold } }));
}

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

function formatMMSS(totalSeconds) {
  const s = Math.max(0, Math.floor(Number.isFinite(totalSeconds) ? totalSeconds : 0));
  const mPart = String(Math.floor(s / 60)).padStart(2, "0");
  const sPart = String(s % 60).padStart(2, "0");
  return `${mPart}:${sPart}`;
}

export default function PomodoroTimer() {
  const [s, setS] = useState(loadStore);
  const tickRef = useRef(null);
  const titleBaseRef = useRef(document.title);

  useEffect(() => {
    saveStore(s);
  }, [s]);

  useEffect(() => {
    if (typeof Notification !== "undefined" && Notification.permission === "default") {
      Notification.requestPermission().catch(() => {});
    }
  }, []);

  useEffect(() => {
    setS((prev) => migrateAndNormalize(prev));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
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
          addEconomy({ xp: rewardXP, gold: rewardGold });
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
  }, [s.running]);

  useEffect(() => {
    const base = titleBaseRef.current;
    const mmss = formatMMSS(s.secondsLeft);
    const icon = s.mode === "focus" ? "🔴" : s.mode === "short" ? "🟢" : "🔵";
    document.title = `${icon} ${mmss} • ${base}`;
    return () => {
      document.title = base;
    };
  }, [s.mode, s.secondsLeft]);

  const startPause = () => setS((x) => ({ ...x, running: !x.running }));
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
