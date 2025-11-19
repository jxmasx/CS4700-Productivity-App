/*-----------------------------------------------------------------------------
TestBuildAdventurer.js - Replaces current BuildAdventurer if we prefer it
"Choose Your Adventurer" character creation page.

FEATURES - (Will have to be changed again)
  - NPC dialog intro/outro
  - Name, species, starter outfit
  - Visual sprite preview (layered images)
  - Starter customization (head/cloak/weapon/accent)
  - Saves adventurer data to localStorage under "adventurer"
  - Button to go to Guild Hall
  - Uses AdventurerNamePlate as a live "ID card"
 -----------------------------------------------------------------------------*/

import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import NPCDialog from "./NPCDialog";
import AdventurerNamePlate from "./AdventurerNamePlate";
import QuestifyNavBar from "./QuestifyNavBar";
import QuestCard from "./QuestCard";
//import IntegrationsPopup from "./IntegrationsPopup";

 {/*Global Navigation Bar – same across all of Questify*/}
        <QuestifyNavBar />

const SPECIES = ["human", "elf", "orc", "dwarf"];

const OUTFITS = [
  { key: "robes", label: "Basic Robes" },
  { key: "armor", label: "Basic Armor" },
];

/*Cosmetic parts that affect sprite layering. Should be changed as sprite imgs are uploaded*/
const PART_OPTIONS = {
  head: [
    { key: "none", label: "None" },
    { key: "circlet", label: "Circlet" },
    { key: "hood", label: "Hood" },
    { key: "helm", label: "Helm" },
  ],
  cloak: [
    { key: "none", label: "None" },
    { key: "blue", label: "Blue Cloak" },
    { key: "green", label: "Green Cloak" },
    { key: "red", label: "Red Cloak" },
  ],
  weapon: [
    { key: "staff", label: "Staff" },
    { key: "sword", label: "Sword" },
    { key: "dagger", label: "Dagger" },
  ],
  accent: [
    { key: "gold", label: "Gold" },
    { key: "silver", label: "Silver" },
    { key: "bronze", label: "Bronze" },
  ],
};

/* -----------------------------------------------------------------------------
 SpritePreview: shows stacked sprite layers in a square preview box.
-----------------------------------------------------------------------------*/
function SpritePreview({ species, outfit, parts, name }) {
  /*Builds an ordered list of layers (base, outfit, cloak, head, weapon).
  Replace with sprite imgs as they are uploaded instead of emojis
  */
  const layers = useMemo(
    () => [
      {
        id: "base",
        url: `/sprites/avatar/base_${species}.png`,
        fallback: "🧙‍♂️",
      },
      {
        id: "outfit",
        url: `/sprites/avatar/outfit_${outfit}_${species}.png`,
        fallback: outfit === "armor" ? "🛡️" : "🧥",
      },
      {
        id: "cloak",
        url:
          parts.cloak !== "none"
            ? `/sprites/avatar/cloak_${parts.cloak}_${species}.png`
            : null,
        fallback: parts.cloak !== "none" ? "🧣" : null,
      },
      {
        id: "head",
        url:
          parts.head !== "none"
            ? `/sprites/avatar/head_${parts.head}_${species}.png`
            : null,
        fallback:
          parts.head === "circlet"
            ? "👑"
            : parts.head === "hood"
            ? "🫥"
            : parts.head === "helm"
            ? "🪖"
            : null,
      },
      {
        id: "weapon",
        url: `/sprites/avatar/weapon_${parts.weapon}_${species}.png`,
        fallback:
          parts.weapon === "staff"
            ? "🪄"
            : parts.weapon === "sword"
            ? "🗡️"
            : "🔪",
      },
    ],
    [species, outfit, parts]
  );


  {/*Right side: preview + name plate*/}
<div
  style={{
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    minHeight: "100%",
    width: "100%",
    gap: "1rem",
  }}
>
  <SpritePreview
    species={species}
    outfit={outfit}
    parts={parts}
    name={name}
  />

  <AdventurerNamePlate
    name={name || "New Adventurer"}
    species={species}
    gold={0}                 /*starting gold (0 here; GuildHall will show real)*/
    guildStreak={0}          /*streak starts at 0*/
    rank="Unranked"          /*placeholder rank until we assign ranks*/
    expPercent={0}
    /*simple sprite: use the outfit layer as the “portrait”*/
    spriteUrl={`/sprites/avatar/outfit_${outfit}_${species}.png`}
    level={1}
    actionLabel="Visit Guild Hall"
    onAction={() => navigate("/guild-hall")}
  />
</div>


  return (
    <div style={{ textAlign: "center", color: "#3f220e", width: "100%" }}>
      {/*Creates sprite box*/}
      <div
        style={{
          position: "relative",
          width: "100%",
          maxWidth: "420px",
          aspectRatio: "1 / 1",
          margin: "0 auto 16px",
          borderRadius: 16,
          background: "rgba(122, 203, 255, 1)",
          boxShadow: "inset 0 0 0 2px rgba(0,0,0,.08)",
          overflow: "hidden",
        }}
      >
        {/*Creates Image layers*/}
        {layers.map(
          (layer) =>
            layer.url && (
              <img
                key={layer.id}
                src={layer.url}
                alt={layer.id}
                style={{
                  position: "absolute",
                  inset: 0,
                  width: "100%",
                  height: "100%",
                  imageRendering: "pixelated",
                  objectFit: "contain",
                }}
                onError={(e) => {
                  /*Hides broken images and fall back to emoji.*/
                  e.currentTarget.style.display = "none";
                  const el = document.getElementById(`fallback-${layer.id}`);
                  if (el) el.style.display = "grid";
                }}
              />
            )
        )}

        {/*Emoji fallbacks - DELETE once sprite clothing images are updated and replace with sprite img*/}
        {layers.map(
          (layer) =>
            layer.fallback && (
              <div
                key={`fallback-${layer.id}`}
                id={`fallback-${layer.id}`}
                style={{
                  display: layer.url ? "none" : "grid",
                  position: "absolute",
                  inset: 0,
                  placeItems: "center",
                  fontSize: 64,
                  opacity: 0.9,
                }}
              >
                {layer.fallback}
              </div>
            )
        )}
      </div>

      <h2 style={{ margin: "0.5rem 0", fontSize: "1.2rem" }}>
        {name || "Adventurer"} the {species}
      </h2>
    </div>
  );
}

// -----------------------------------------------------------------------------
// Main page component
// -----------------------------------------------------------------------------
export default function BuildAdventurer() {
  const [name, setName] = useState("");
  const [species, setSpecies] = useState("human");
  const [outfit, setOutfit] = useState("robes");
  const [parts, setParts] = useState({
    head: "none",
    cloak: "none",
    weapon: "staff",
    accent: "gold",
  });

  /*NPC dialogs visibility*/
  const [showIntro, setShowIntro] = useState(true);
  const [showOutro, setShowOutro] = useState(false);

  const navigate = useNavigate();

  /*Form submit: saves adventurer to localStorage - This needs to be changed with backend*/
  const submit = (e) => {
    e.preventDefault();
    if (!name.trim()) return;

    const payload = { name, species, outfit, parts };
    localStorage.setItem("adventurer", JSON.stringify(payload));
    setShowOutro(true);
  };

  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(180deg, #74b9ff 0%, #1e6dd8 100%)",
        fontFamily: "Poppins, system-ui, sans-serif",
        padding: "2rem 1rem",
      }}
    >
      <div
        className="wood"
        style={{ width: "min(1100px, 96vw)", padding: "1.5rem" }}
      >
        {
        <div className="title-band" aria-hidden="true">
          <div className="title">Choose Your Adventurer</div>
        </div>
        }

        {/*Global Navigation Bar – same across all of Questify*/}
               <QuestifyNavBar />

        <div
          className="panel"
          style={{
            display: "grid",
            gridTemplateColumns: "minmax(0, 1fr) 420px",
            gap: "2rem",
            alignItems: "start",
            justifyContent: "center",
            width: "100%",
            overflow: "hidden",
          }}
        >
          {/*Left side customization form*/}
          <form
            onSubmit={submit}
            style={{
              display: "grid",
              gap: "1.25rem",
              color: "#3f220e",
            }}
          >
            <p style={{ marginTop: 0 }}>
              Your journey begins here. Who will you become?
            </p>

            {/*Name input*/}
            <label>
              Adventurer Name
              <div className="input" style={{ marginTop: 6 }}>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your name"
                  required
                />
              </div>
            </label>

            {/*Species selection*/}
            <div>
              <div style={{ fontWeight: 700, marginBottom: 6 }}>Species</div>
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                {SPECIES.map((s) => (
                  <label
                    key={s}
                    className="chip"
                    style={{
                      padding: "8px 12px",
                      background: species === s ? "#2f241a" : "#6e3f1c",
                      opacity: 0.95,
                      cursor: "pointer",
                    }}
                  >
                    <input
                      type="radio"
                      name="species"
                      value={s}
                      checked={species === s}
                      onChange={() => setSpecies(s)}
                      style={{ display: "none" }}
                    />
                    {s[0].toUpperCase() + s.slice(1)}
                  </label>
                ))}
              </div>
            </div>

            {/*Outfit selection, will change as sprites and character outfits are uploaded*/}
            <div>
              <div style={{ fontWeight: 700, marginBottom: 6 }}>
                Starter Outfit
              </div>
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                {OUTFITS.map((o) => (
                  <label
                    key={o.key}
                    className="chip"
                    style={{
                      padding: "8px 12px",
                      background: outfit === o.key ? "#2f241a" : "#6e3f1c",
                      opacity: 0.95,
                      cursor: "pointer",
                    }}
                  >
                    <input
                      type="radio"
                      name="outfit"
                      value={o.key}
                      checked={outfit === o.key}
                      onChange={() => setOutfit(o.key)}
                      style={{ display: "none" }}
                    />
                    {o.label}
                  </label>
                ))}
              </div>
            </div>

            {/*Customization options*/}
            <div style={{ fontWeight: 800, marginTop: 10 }}>Customization</div>
            {Object.entries(PART_OPTIONS).map(([partType, options]) => (
              <div key={partType}>
                <div style={{ fontWeight: 700, marginBottom: 6 }}>
                  {partType[0].toUpperCase() + partType.slice(1)}
                </div>

                {partType === "accent" ? (
                  <select
                    value={parts.accent}
                    onChange={(e) =>
                      setParts((p) => ({ ...p, accent: e.target.value }))
                    }
                    style={{
                      width: "100%",
                      padding: "10px 12px",
                      borderRadius: 12,
                      border: "2px solid #8b5e34",
                      background: "#f9f2e5",
                    }}
                  >
                    {options.map((opt) => (
                      <option key={opt.key} value={opt.key}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                ) : (
                  /*Head / cloak / weapon use chips */
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    {options.map((opt) => (
                      <button
                        key={opt.key}
                        type="button"
                        className="chip"
                        onClick={() =>
                          setParts((p) => ({ ...p, [partType]: opt.key }))
                        }
                        style={{
                          padding: "8px 10px",
                          background:
                            parts[partType] === opt.key ? "#2f241a" : "#6e3f1c",
                          color: "#fff7e8",
                          cursor: "pointer",
                        }}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}

            {/*Actions*/}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 8,
                alignItems: "flex-end",
                marginTop: 12,
              }}
            >
            {/*Creates submit button:Join the Guild
              <button
                className="chip"
                type="submit"
                disabled={!name.trim()}
                style={{
                  background: "#111",
                  color: "#fff",
                  padding: "12px 24px",
                  borderRadius: 999,
                  fontWeight: 800,
                  opacity: name.trim() ? 1 : 0.6,
                  cursor: name.trim() ? "pointer" : "not-allowed",
                  boxShadow: "0 10px 20px rgba(0,0,0,.25)",
                }}
              >
                Join the Guild
              </button> */}
               

              {/*Links to Guild Hall & Shop*/}
              <button
                type="button"
                className="chip"
                onClick={() => navigate("/guild-hall")}
                style={{
                  background: "#3b2a18",
                  color: "#fff7e8",
                  padding: "10px 18px",
                  borderRadius: 999,
                  fontWeight: 700,
                  cursor: "pointer",
                  border: "none",
                }}
              >
                Visit Guild Hall &amp; Shop
              </button>
            </div>
          </form>

          {/*Creates right side: sprite preview + nameplate*/}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              minHeight: "100%",
              width: "100%",
              gap: "1rem",
            }}
          >
            <SpritePreview
              species={species}
              outfit={outfit}
              parts={parts}
              name={name}
            />

            <AdventurerNamePlate
              name={name || "New Adventurer"}
              species={species}
              gold={0}
              guildStreak={0}
              rank="Unranked"
              expPercent={0}
              spriteUrl={`/sprites/avatar/outfit_${outfit}_${species}.png`}
              level={1}
              actionLabel="Visit Guild Hall"
              onAction={() => navigate("/guild-hall")}
            />
          </div>
        </div>
      </div>

      {/*NPC dialogs and then sends user to following screens*/}
      <NPCDialog
        visible={showIntro}
        text="Every adventurer’s story starts with a name. Speak yours."
        name="Registrar"
        avatarSrc="/sprites/npc_registrar.png"
        variant="modal"
        onNext={() => setShowIntro(false)}
      />
      <NPCDialog
        visible={showOutro}
        text={`Well then, ${name || "Adventurer"} the ${species}! Let’s see what quests await you!`}
        name="Registrar"
        avatarSrc="/sprites/npc_registrar.png"
        variant="modal"
        onNext={() => navigate("/intro-scene")}
      />
    </main>
  );
}