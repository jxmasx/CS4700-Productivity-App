import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function IntroScene() {
  const navigate = useNavigate();

  useEffect(() => {
    const audio = new Audio("/Audio/Beautiful_Village.mp3");
    audio.volume = 0.3;
    audio.loop = true;
    audio.play().catch(() => {});
    return () => audio.pause();
  }, []);

  return (
    <main
      style={{
        minHeight: "100vh",
        width: "100vw",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        backgroundImage: "url(/sprites/backgrounds/productivity_kingdom.png)",
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
        color: "#fff",
        textAlign: "center",
        fontFamily: "Poppins, system-ui, sans-serif",
        padding: "2rem 1rem",
      }}
    >
      <h1
        style={{
          fontSize: "clamp(36px, 5vw, 60px)",
          marginBottom: "1rem",
          color: "#fcd34d",
          textShadow: "0 4px 10px rgba(0,0,0,0.6)",
          fontWeight: 800,
        }}
      >
        The Kingdom of Productivity
      </h1>

      <p style={{ lineHeight: 1.6, marginBottom: "1rem", fontSize: "1.15rem" }}>
        The Kingdom of Productivity was once a thriving land of focus, discipline, and growth.
        But a quiet fog called <strong>Distraction</strong> has crept in—causing chaos and disorder.
      </p>

      <p style={{ lineHeight: 1.6, marginBottom: "1rem", fontSize: "1.15rem" }}>
        Keep habits and complete tasks to make the fog recede. When you slip, Distraction spreads.
      </p>

      <p style={{ lineHeight: 1.6, marginBottom: "2rem", fontSize: "1.15rem" }}>
        Join the <strong>Adventurer’s Guild</strong>, turn your life into quests, and help restore the kingdom.
      </p>

      <button
        onClick={() => navigate("/dashboard")}
        style={{
          background: "linear-gradient(180deg, #fcd34d, #b58105)",
          border: "none",
          borderRadius: 999,
          padding: "14px 38px",
          fontSize: "1.2rem",
          fontWeight: 700,
          color: "#2f241a",
          cursor: "pointer",
          boxShadow: "0 8px 20px rgba(0,0,0,0.3)",
        }}
      >
        Explore Your Dashboard
      </button>
    </main>
  );
}
