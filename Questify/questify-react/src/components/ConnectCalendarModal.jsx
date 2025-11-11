import React, { useEffect, useState } from "react";
import { API } from "../apiBase";

function openCenteredPopup(url, title) {
  const w = 500, h = 650;
  const y = window.top.outerHeight / 2 + window.top.screenY - (h / 2);
  const x = window.top.outerWidth / 2 + window.top.screenX - (w / 2);
  return window.open(url, title, `width=${w},height=${h},left=${x},top=${y}`);
}

export default function ConnectCalendarModal({ onConnected, onClose }) {
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const handler = (evt) => {
      if (!evt?.data || typeof evt.data !== "object") return;
      if (evt.data.type === "oauth-success") onConnected?.(evt.data.provider);
      if (evt.data.type === "oauth-success" || evt.data.type === "oauth-error") onClose?.();
    };
    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
  }, [onConnected, onClose]);

  const start = async (provider) => {
    if (busy) return;
    setBusy(true);
    try {
      const res = await fetch(API(`/oauth/${provider}/start`), { credentials: "include" });
      if (!res.ok) throw new Error("Failed to start OAuth");
      const data = await res.json();
      if (data?.auth_url) openCenteredPopup(data.auth_url, `connect-${provider}`);
    } catch (e) {
      console.error("OAuth start failed:", e);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div style={overlay} role="dialog" aria-modal="true">
      <div style={modal}>
        <h3 style={{ marginTop: 0 }}>Connect your calendar</h3>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button style={btn} onClick={() => start("google")} disabled={busy}>Connect Google</button>
          <button style={btn} onClick={() => start("ms")} disabled={busy}>Connect Microsoft</button>
        </div>
        <button style={{ ...btn, marginTop: 12, background: "#eee" }} onClick={onClose}>Cancel</button>
      </div>
    </div>
  );
}

const overlay = { position:"fixed", inset:0, background:"rgba(0,0,0,.4)", display:"grid", placeItems:"center", zIndex:9999 };
const modal = { background:"#fffaf0", border:"3px solid #2d1b0e", borderRadius:16, padding:16, boxShadow:"6px 6px 0 rgba(45,27,14,.6)", width:420, maxWidth:"90vw" };
const btn = { padding: ".5rem .8rem", fontWeight: 800, border: "3px solid #2d1b0e", background: "linear-gradient(180deg,#f2c988 0%,#e9b76d 100%)", color:"#2d1b0e", borderRadius:12, boxShadow:"3px 3px 0 rgba(45,27,14,.6)", cursor:"pointer" };
