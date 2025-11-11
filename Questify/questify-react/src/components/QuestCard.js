/* -----------------------------------------------------------------------------
 QUEST CARD (Starter Quest: Complete your first habit)
  - Appears near task/habit creation (e.g., Dashboard Task List).
  - Guides user to complete their first habit.
  - On completion, it:
      * Marks quest as completed in localStorage ("questStatus").
      * Adds a reward into "pendingRewards" so GuildHall can pay it out.
      * Calls onQuestCompleted (Dashboard can add XP/Gold immediately).

 Stores on LOCALSTORAGE:
    - "pendingRewards" -> read by GuildHall
    - "questStatus"    -> map of questId -> { completed, completedAt }
 -----------------------------------------------------------------------------*/

import React, { useEffect, useState } from "react";
import QuestifyNavBar from "./QuestifyNavBar";


const PENDING_REWARDS_KEY = "pendingRewards";
const QUEST_STATUS_KEY = "questStatus";

const QuestCard = ({
  visible = true,
  questId = "starter-quest-first-habit",
  label = "Starter Quest: Complete your first habit",
  rewardGold = 5,
  rewardXp = 10,
  onQuestCompleted,
}) => {
  const [isCompleted, setIsCompleted] = useState(false);
  const [showBanner, setShowBanner] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");

  /*Loads quest completion status from localStorage. - Will have to be changed */
  useEffect(() => {
    try {
      const raw = localStorage.getItem(QUEST_STATUS_KEY);
      if (!raw) return;
      const map = JSON.parse(raw);
      if (map && map[questId]?.completed) {
        setIsCompleted(true);
      }
    } catch {
      setIsCompleted(false);
    }
  }, [questId]);

  const saveQuestStatus = (completed) => {
    try {
      const raw = localStorage.getItem(QUEST_STATUS_KEY);
      const map = raw ? JSON.parse(raw) : {};
      map[questId] = {
        completed,
        completedAt: completed ? Date.now() : undefined,
      };
      localStorage.setItem(QUEST_STATUS_KEY, JSON.stringify(map));
    } catch {
      /*Ignore write errors*/
    }
  };

  const enqueueRewardForGuildHall = () => {
    try {
      const raw = localStorage.getItem(PENDING_REWARDS_KEY);
      const existing = raw ? JSON.parse(raw) : [];
      const newReward = {
        id: questId,
        label,
        gold: rewardGold,
        xp: rewardXp,
      };
      const updated = [...existing, newReward];
      localStorage.setItem(PENDING_REWARDS_KEY, JSON.stringify(updated));
    } catch {
      /*Ignore errors; UI should still shows completion*/
    }
  };

  const handleCheckboxChange = (e) => {
    const checked = e.target.checked;
    if (!checked || isCompleted) return;

    setIsCompleted(true);
    saveQuestStatus(true);
    enqueueRewardForGuildHall();
    setShowBanner(true);
    setStatusMessage(
      "You defended the Hall of Habits. The smog retreats… for now."
    );

    if (typeof onQuestCompleted === "function") {
      onQuestCompleted();
    }

    window.setTimeout(() => {
      setShowBanner(false);
    }, 4000);
  };

  if (!visible && !isCompleted) return null;

  return (
    <div
      className="quest-card"
      style={{
        position: "relative",
        maxWidth: 420,
        padding: "1rem 1.1rem",
        borderRadius: 16,
        border: "2px solid #8b5e34",
        background: "#f7e8cf",
        boxShadow: "0 6px 16px rgba(0, 0, 0, 0.25)",
        color: "#3f220e",
        display: "flex",
        flexDirection: "column",
        gap: 8,
      }}
    >
      {/*Header*/}
      <div
        style={{
          display: "flex",
          alignItems: "baseline",
          justifyContent: "space-between",
          gap: 8,
        }}
      >
        <h2
          style={{
            margin: 0,
            fontSize: "1.05rem",
            lineHeight: 1.2,
          }}
        >
          {label}
        </h2>

        {isCompleted && (
          <span
            style={{
              padding: "2px 8px",
              borderRadius: 999,
              background: "#27ae60",
              color: "#fff",
              fontSize: "0.7rem",
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "0.05em",
            }}
          >
            Completed
          </span>
        )}
      </div>

      {/*Explanation*/}
      <p
        style={{
          margin: 0,
          fontSize: "0.85rem",
          color: "#5a3417",
        }}
      >
        Mark your very first habit as complete on the board. This teaches the
        system how you finish quests.
      </p>

      {/*UI guide*/}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          marginTop: 4,
          padding: "6px 8px",
          borderRadius: 12,
          background: "#fffaf3",
          border: "1px dashed #b07a46",
        }}
      >
        <label
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            cursor: isCompleted ? "default" : "pointer",
          }}
        >
          <input
            type="checkbox"
            checked={isCompleted}
            onChange={handleCheckboxChange}
            disabled={isCompleted}
            style={{
              width: 18,
              height: 18,
              cursor: isCompleted ? "default" : "pointer",
            }}
          />
          <span style={{ fontSize: "0.85rem" }}>
            Check this after you complete your first habit on the board.
          </span>
        </label>
      </div>

      {/*Reward summary*/}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: 12,
          marginTop: 6,
          fontSize: "0.8rem",
        }}
      >
        <span>
          <strong>Reward:</strong> +{rewardXp} XP
        </span>
        <span>
          <strong>Reward:</strong> +{rewardGold} Gold
        </span>
        <span style={{ opacity: 0.8 }}>
          (Collectable in the Guild Hall)
        </span>
      </div>

      {/*NPC text line*/}
      <div
        style={{
          marginTop: 8,
          padding: "6px 8px",
          borderRadius: 12,
          background: "#f2e0c2",
          fontSize: "0.8rem",
          border: "1px solid #d49a58",
        }}
      >
        <strong>Guildmaster:</strong>{" "}
        <span style={{ fontStyle: "italic" }}>
          “Great work, Novice. Remember, consistency is magic. One small victory
          becomes many.”
        </span>
      </div>

      {/*Success banner (Only temporary)*/}
      {showBanner && (
        <div
          style={{
            marginTop: 8,
            padding: "8px 10px",
            borderRadius: 12,
            background:
              "linear-gradient(90deg, #27ae60 0%, #1abc9c 50%, #2980b9 100%)",
            color: "#fff",
            fontSize: "0.85rem",
            fontWeight: 600,
            boxShadow: "0 4px 12px rgba(0,0,0,.35)",
          }}
        >
          {statusMessage}
        </div>
      )}
    </div>
  );
};

export default QuestCard;
