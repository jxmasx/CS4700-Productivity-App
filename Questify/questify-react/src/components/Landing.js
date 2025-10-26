import React from "react";
import { useNavigate } from "react-router-dom";

export default function Landing() {
  const navigate = useNavigate();

  return (
    <main
      className="landing"
      style={{
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(180deg, #74b9ff 0%, #1e6dd8 100%)",
        color: "#fff",
        textAlign: "center",
        fontFamily: "Poppins, system-ui, sans-serif",
      }}
    >
      <h1
        style={{
          fontSize: "clamp(48px, 8vw, 72px)",
          marginBottom: "0.3em",
          textShadow: "0 4px 8px rgba(0,0,0,0.25)",
        }}
      >
        Questify
      </h1>

      <p
        style={{
          fontSize: "clamp(18px, 2vw, 26px)",
          marginBottom: "2em",
          color: "#e8f3ff",
        }}
      >
        Turn productivity into quests!
      </p>

      <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
        <button
          onClick={() => navigate("/login")}
          style={{
            background: "#111",
            color: "#fff",
            border: "none",
            borderRadius: "999px",
            padding: "12px 32px",
            fontSize: "1.2rem",
            fontWeight: "600",
            cursor: "pointer",
            boxShadow: "0 10px 25px rgba(0,0,0,0.3)",
            transition: "transform 0.2s, box-shadow 0.2s",
          }}
          onMouseEnter={(e) => {
            e.target.style.transform = "translateY(-3px)";
            e.target.style.boxShadow = "0 12px 28px rgba(0,0,0,0.4)";
          }}
          onMouseLeave={(e) => {
            e.target.style.transform = "translateY(0)";
            e.target.style.boxShadow = "0 10px 25px rgba(0,0,0,0.3)";
          }}
        >
          Log In
        </button>

        <button
          onClick={() => navigate("/signup")}
          style={{
            background: "#fcd34d",
            color: "#2f241a",
            border: "none",
            borderRadius: "999px",
            padding: "12px 32px",
            fontSize: "1.2rem",
            fontWeight: "600",
            cursor: "pointer",
            boxShadow: "0 10px 25px rgba(0,0,0,0.3)",
            transition: "transform 0.2s, box-shadow 0.2s",
          }}
          onMouseEnter={(e) => {
            e.target.style.transform = "translateY(-3px)";
            e.target.style.boxShadow = "0 12px 28px rgba(0,0,0,0.4)";
          }}
          onMouseLeave={(e) => {
            e.target.style.transform = "translateY(0)";
            e.target.style.boxShadow = "0 10px 25px rgba(0,0,0,0.3)";
          }}
        >
          Sign Up
        </button>
      </div>

      <footer style={{ position: "absolute", bottom: "2rem", fontSize: "0.9rem", opacity: 0.7 }}>
        © {new Date().getFullYear()} Questify
      </footer>
    </main>
  );
}
