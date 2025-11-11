/*-----------------------------------------------------------------------------
  - name: string                    -> Adventurer display name
  - species?: string                -> Optional species label ("human", "elf", etc.)
  - gold: number                    -> Amount of gold
  - guildStreak: number 0–5         -> How many hearts are filled
  - rank: string                    -> Text label for rank (class/role or tier)
  - expPercent: number 0–100        -> Filled portion of EXP bar
  - spriteUrl?: string              -> URL to the portrait/sprite image
  - level?: number                  -> Level tag displayed as "Lv. X"
  - clickable?: boolean             -> If true, whole card acts like a button
  - actionLabel?: string            -> Label for a small action button
  - onAction?: () => void           -> Click handler for the action button
 -----------------------------------------------------------------------------*/

import React from "react";
import "./AdventurerNamePlate.css";

const AdventurerNamePlate = ({
  name = "New Adventurer",
  species, 
  gold = 0,
  guildStreak = 0,
  rank = "Bronze",
  expPercent = 0,
  spriteUrl, 
  level = 1,
  clickable = false,
  actionLabel,
  onAction,
}) => {
  /*Clamps the EXP between 0 and 100 so a bad value can’t break the bar width.*/
  const safeExp = Math.max(0, Math.min(expPercent, 100));

  /*Builds an array of 5 booleans that tell us which hearts are “filled”.*/
  const hearts = Array.from({ length: 5 }, (_, index) => index < guildStreak);

  /*Helper for nicely capitalizing the species string, if we have one.*/
  const prettySpecies =
    species && typeof species === "string"
      ? species.charAt(0).toUpperCase() + species.slice(1)
      : null;

  /*If the card is clickable, we add button-like semantics for accessibility.*/
  const cardProps = clickable && onAction
    ? {
        role: "button",
        tabIndex: 0,
        onClick: onAction,
        onKeyDown: (e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onAction();
          }
        },
      }
    : {};

  return (
    /*Outer card container (styled in AdventurerNamePlate.css).If clickable, the CSS will add a hover/active state.*/
    <div className={`nameplate-card ${clickable ? "nameplate-card--clickable" : ""}`} {...cardProps}>
      {/*Left Side: avatar frame area */}
      <div className="nameplate-left">
        {/*Outer pixel-style border for the portrait*/}
        <div className="avatar-frame">
          {/*Small level pill in the corner of the frame*/}
          <div className="avatar-level-pill">Lv. {level}</div>

          <div className="avatar-inner">
            {spriteUrl ? (
              <img
                src={spriteUrl}
                alt={`${name}'s portrait`}
                className="avatar-image"
              />
            ) : (
              /*Fallback placeholder if we don’t yet have an image.*/
              <div className="avatar-placeholder">
                               Portrait
              </div>
            )}
          </div>
        </div>
      </div>

      {/*Right Side: text stats, hearts, rank, and EXP*/}
      <div className="nameplate-right">
        {/*Basic text stats: Adventurer label, gold, and “Guild Streak”*/}
        <div className="nameplate-stats">
          <p className="nameplate-line">
            <span className="nameplate-label">Adventurer:</span>{" "}
            {/* 
              We show "Name the Species" if species is available,
              otherwise just the name (or “Unnamed Hero”).
            */}
            <span className="nameplate-value">
              {name || "Unnamed Hero"}
              {prettySpecies ? ` the ${prettySpecies}` : ""}
            </span>
          </p>

          <p className="nameplate-line">
            <span className="nameplate-label">Gold:</span>{" "}
            <span className="nameplate-value">{gold}</span>
          </p>

          <p className="nameplate-line">
            <span className="nameplate-label">Guild Streak</span>
          </p>

          {/*Heart row that visualizes the guild streak*/}
          <div className="nameplate-hearts">
            {hearts.map((filled, index) => (
              <span
                key={index}
                className={`heart-pixel ${
                  filled ? "heart-pixel--filled" : "heart-pixel--empty"
                }`}
              />
            ))}
          </div>
        </div>

        {/*Rank section: label + decorative banners*/}
        <div className="nameplate-rank-section">
          <div className="rank-label-wrapper">
            <span className="nameplate-label">Rank:</span>{" "}
            {/*               We can pass something like "Warrior (Tank)"*/}
            <span className="nameplate-rank-value">{rank}</span>
          </div>

          {/*Decorative banners (can later map to tiers)*/}
          <div className="rank-banners-row">
            <div className="rank-banner rank-banner--teal" />
            <div className="rank-banner rank-banner--red" />
            <div className="rank-banner rank-banner--purple" />
            <div className="rank-banner rank-banner--blue" />
          </div>
        </div>

        {/*EXP bar section + optional action button*/}
        <div className="nameplate-exp-section">
          <div className="nameplate-exp-row">
            <span className="nameplate-label">EXP:</span>

            {/*Background bar*/}
            <div className="exp-bar">
              {/*Filled inner exp bar – width driven by safeExp (0–100%)*/}
              <div className="exp-bar-fill" style={{ width: `${safeExp}%` }} />
            </div>

            {/*Tiny numeric hint, e.g. "42%"*/}
            <span className="exp-percent-label">{safeExp}%</span>
          </div>

          {/*Action button ("Visit Guild Hall")*/}
          {actionLabel && onAction && (
            <button
              type="button"
              className="nameplate-action-button"
              onClick={onAction}
            >
              {actionLabel}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdventurerNamePlate;
