/*-----------------------------------------------------------------------------
 GLOBAL NAVIGATION BAR FOR QUESTIFY

 PURPOSE
  - Provides consistent navigation between core pages:
      • Dashboard ("/")
      • Build Your Adventurer ("/build-adventurer")
      • Guild Hall & Shop ("/guild-hall")
      • Intro Scene ("/intro-scene") – optional story intro
-----------------------------------------------------------------------------*/

import React from "react";
import { Link, useLocation } from "react-router-dom";

const QuestifyNavBar = () => {
  /*useLocation lets us know which route we are currently on
    so we can highlight the active button.*/
  const location = useLocation();

  /*Helper: returns true if a given path is the current path.*/
  const isActive = (path) => location.pathname === path;

  return (
    <nav
      className="questify-nav"
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "0.75rem",
        padding: "0.5rem 0.75rem",
        marginBottom: "0.75rem",
        borderRadius: 999,
        background: "rgba(0, 0, 0, 0.08)",
      }}
    >
      {/*Left side: app logo/title*/}
      <div
        style={{
          fontWeight: 800,
          fontSize: "0.95rem",
          letterSpacing: "0.06em",
          textTransform: "uppercase",
          color: "#3f220e",
        }}
      >
        QUESTIFY
      </div>

      {/*Right side: navigation buttons*/}
      <div
        style={{
          display: "flex",
          gap: "0.5rem",
          flexWrap: "wrap",
          justifyContent: "flex-end",
        }}
      >
        {/*Dashboard*/}
        <Link
          to="/"
          style={{
            textDecoration: "none",
          }}
        >
          <button
            type="button"
            style={{
              padding: "6px 12px",
              borderRadius: 999,
              border: "1px solid #8b5e34",
              background: isActive("/")
                ? "#3b2a18"
                : "rgba(255, 247, 232, 0.95)",
              color: isActive("/") ? "#fff7e8" : "#3f220e",
              fontSize: "0.8rem",
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            Dashboard
          </button>
        </Link>

        {/*Build Adventurer Button*/}
        <Link
          to="/build-adventurer"
          style={{
            textDecoration: "none",
          }}
        >
          <button
            type="button"
            style={{
              padding: "6px 12px",
              borderRadius: 999,
              border: "1px solid #8b5e34",
              background: isActive("/build-adventurer")
                ? "#3b2a18"
                : "rgba(255, 247, 232, 0.95)",
              color: isActive("/build-adventurer") ? "#fff7e8" : "#3f220e",
              fontSize: "0.8rem",
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            Adventurer
          </button>
        </Link>

        {/*Guild Hall & Shop Button*/}
        <Link
          to="/guild-hall"
          style={{
            textDecoration: "none",
          }}
        >
          <button
            type="button"
            style={{
              padding: "6px 12px",
              borderRadius: 999,
              border: "1px solid #8b5e34",
              background: isActive("/guild-hall")
                ? "#3b2a18"
                : "rgba(255, 247, 232, 0.95)",
              color: isActive("/guild-hall") ? "#fff7e8" : "#3f220e",
              fontSize: "0.8rem",
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            Guild Hall
          </button>
        </Link>

        {/*Intro Scene (idk if we are still doing this) */}
        <Link
          to="/intro-scene"
          style={{
            textDecoration: "none",
          }}
        >
          <button
            type="button"
            style={{
              padding: "6px 12px",
              borderRadius: 999,
              border: "1px solid #8b5e34",
              background: isActive("/intro-scene")
                ? "#3b2a18"
                : "rgba(255, 247, 232, 0.95)",
              color: isActive("/intro-scene") ? "#fff7e8" : "#3f220e",
              fontSize: "0.8rem",
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            Story Intro
          </button>
        </Link>
      </div>
    </nav>
  );
};

export default QuestifyNavBar;
