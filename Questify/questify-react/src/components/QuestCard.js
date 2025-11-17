/* -----------------------------------------------------------------------------
 QUEST CARD 
  - Appears near task/habit creation (e.g., Dashboard Task List).
  - Guides user to complete their first habit.
  - On completion, it:
      * Marks quest as completed in localStorage ("questStatus").
      * Adds a reward into "pendingRewards" so GuildHall can pay it out.
      * Calls onQuestCompleted (Dashboard can add XP/Gold immediately).
 -----------------------------------------------------------------------------*/

import React, { useState } from "react";
import { useUser } from "../contexts/UserContext"
import { addPendingReward, updateUserQuest } from "../utils/QuestAPI"

const QuestCard = ({
  visible = true,
  questId = "starter-quest-first-habit",
  label = "Starter Quest: Complete your first habit",
  rewardGold = 5,
  rewardXp = 10,
  statusMessage = "Quest completed!",
  onQuestCompleted,
  userQuestId = null,
  initialCompleted = false,
}) => {
  const { user } = useUser();

  const [isCompleted, setIsCompleted] = useState(initialCompleted);
  const [showBanner, setShowBanner] = useState(false);
  const [bannerMessage, setBannerMessage] = useState("");

  // Set the status of quest (complete/incomplete)
  const saveQuestStatus = async (completed) => {
    if (userQuestId && user?.id) {
      try {
        await updateUserQuest(user.id, userQuestId, completed);
      } catch (error) {
        console.error('Failed to update quest status:', error);
      }
    }
  };

  // Add pending reward to guild hall for completing the quest
  const enqueueRewardForGuildHall = () => {
    try {
      const newReward = {
        id: questId,
        label,
        gold: rewardGold,
        xp: rewardXp,
      };

      addPendingReward(user.id, newReward)

    } catch {
      /*Ignores errors; UI will still shows completion*/
    }
  };

  const handleCheckboxChange = (e) => {
    const checked = e.target.checked;
    /*Only react to going from unchecked -> checked, and only once.*/
    if (!checked || isCompleted) return;

    setIsCompleted(true);
    saveQuestStatus(true);
    enqueueRewardForGuildHall();
    setShowBanner(true);
    setBannerMessage(statusMessage);

    if (typeof onQuestCompleted === "function") {
      onQuestCompleted();
    }

    window.setTimeout(() => {
      setShowBanner(false);
    }, 4000);
  };

  /*
    VISIBILITY RULES:
    - If Dashboard says `visible={false}`, doesn’t render at all.
    - If the quest is already completed, hides the card completely.
  */
  // if (!visible || isCompleted) {
  //   return null;
  // }

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
        flexDirection: "column-reverse",
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

      {/*UI Guide*/}
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

      {/*Reward Summary*/}
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
        <span style={{ opacity: 0.8 }}>(Collectable in the Guild Hall)</span>
      </div>

      {/*NPC text lines*/}
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

      {/*Success banner (temporary only)*/}
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
          {bannerMessage}
        </div>
      )}
    </div>
  );
};

export default QuestCard;
