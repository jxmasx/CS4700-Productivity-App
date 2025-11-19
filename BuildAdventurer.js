import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import NPCDialog from "./NPCDialog";
import QuestifyNavBar from "./QuestifyNavBar";

const SPECIES = ["human", "elf", "orc", "dwarf"];
const OUTFITS = [
  { key: "robes", label: "Basic Robes" },
  { key: "armor", label: "Basic Armor" },
];
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

function SpritePreview({ species, outfit, parts, name }) {
  const layers = useMemo(
    () => [
      { id: "base", url: `/sprites/avatar/base_${species}.png`, fallback: "🧙‍♂️" },
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
          parts.weapon === "staff" ? "🪄" : parts.weapon === "sword" ? "🗡️" : "🔪",
      },
    ],
    [species, outfit, parts]
  );

  return (
    <div style={{ textAlign: "center", color: "#3f220e", width: "100%" }}>
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
        {layers.map((layer) =>
          layer.url ? (
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
                e.currentTarget.style.display = "none";
                const el = document.getElementById(`fallback-${layer.id}`);
                if (el) el.style.display = "grid";
              }}
            />
          ) : null
        )}
        {layers.map((layer) =>
          layer.fallback ? (
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
          ) : null
        )}
      </div>
      <h2 style={{ margin: "0.5rem 0", fontSize: "1.2rem" }}>
        {name || "Adventurer"} the {species}
      </h2>
    </div>
  );
}

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

  const [showIntro, setShowIntro] = useState(true);
  const [showOutro, setShowOutro] = useState(false);
  const navigate = useNavigate();

  const submit = (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    localStorage.setItem(
      "adventurer",
      JSON.stringify({ name, species, outfit, parts })
    );
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
      <div className="wood" style={{ width: "min(1100px, 96vw)", padding: "1.5rem" }}>
        
        <div className="title-band" aria-hidden="true">
          {/* <div className="leaf" style={{ transform: "rotate(-18deg)" }} /> */}
          <div className="title">Choose Your Adventurer</div>
          {/* <div className="leaf" style={{ transform: "rotate(18deg) scaleX(-1)" }} /> */}
        </div>

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
          {/* LEFT COLUMN — customization */}
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

            {/* --- Customization options --- */}
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

            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                marginTop: 12,
              }}
            >
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
              </button>
            </div>
          </form>

          {/* RIGHT COLUMN — preview */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              minHeight: "100%",
              width: "100%",
            }}
          >
            <SpritePreview
              species={species}
              outfit={outfit}
              parts={parts}
              name={name}
            />
          </div>
        </div>
      </div>

      {/* NPC dialogs */}
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























// import React, { useMemo, useState } from "react";

// const dressDescriptions = [
//   { key: "green", label: "Green Sash Dress", url: "/sprites/female_sash_green.png" },
//   { key: "red", label: "Red Sash Dress", url: "/sprites/female_sash_red.png" },
//   { key: "blue", label: "Blue Sash Dress", url: "/sprites/female_sash_blue.png" },
// ];

// function SpritePreview({ gender, selectedDress }) {
//   const layers = useMemo(() => {
//     const baseLayer = {
//       id: "base",
//       url: gender === "female" ? "/sprites/female_base.png" : "/sprites/male_base.png",
//     };

//     const dressLayer =
//       selectedDress && gender === "female"
//         ? {
//             id: "dress",
//             url: dressDescriptions.find((d) => d.key === selectedDress)?.url,
//           }
//         : null;

//     return [baseLayer, dressLayer].filter(Boolean);
//   }, [gender, selectedDress]);

//   return (
//     <div style={{ textAlign: "center", color: "#3f220e", width: "100%" }}>
//       <div
//         style={{
//           position: "relative",
//           width: "100%",
//           maxWidth: "300px",
//           aspectRatio: "1 / 1",
//           margin: "0 auto 16px",
//           borderRadius: 16,
//           background: "#cceeff",
//           overflow: "hidden",
//         }}
//       >
//         {layers.map(
//           (layer) =>
//             layer.url && (
//               <img
//                 key={layer.id}
//                 src={layer.url}
//                 alt={layer.id}
//                 style={{
//                   position: "absolute",
//                   inset: 0,
//                   width: "100%",
//                   height: "100%",
//                   imageRendering: "pixelated",
//                   objectFit: "contain",
//                 }}
//               />
//             )
//         )}
//       </div>
//       <h2>Preview</h2>
//     </div>
//   );
// }

// export default function BuildAdventurer() {
//   const [name, setName] = useState("");
//   const [gender, setGender] = useState("male");
//   const [dressStage, setDressStage] = useState(false);
//   const [selectedDress, setSelectedDress] = useState(null);

//   const handleSashClick = () => {
//     setDressStage(true);
//     setSelectedDress(null);
//   };

//   return (
//     <main
//       style={{
//         minHeight: "100vh",
//         display: "flex",
//         flexDirection: "column",
//         alignItems: "center",
//         background: "#d0ecff",
//         padding: "2rem",
//         fontFamily: "sans-serif",
//       }}
//     >
//       <h1>Choose Your Adventurer</h1>

//       {/* Name Input */}
//       <label style={{ marginBottom: 12 }}>
//         Name:
//         <input
//           value={name}
//           onChange={(e) => setName(e.target.value)}
//           placeholder="Enter name"
//           style={{ marginLeft: 8, padding: 6 }}
//         />
//       </label>

//       {/* Gender Selection */}
//       <div style={{ marginBottom: 16 }}>
//         <strong>Gender:</strong>
//         <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
//           {["male", "female"].map((g) => (
//             <button
//               key={g}
//               onClick={() => {
//                 setGender(g);
//                 setDressStage(false);
//                 setSelectedDress(null);
//               }}
//               style={{
//                 padding: "8px 12px",
//                 background: gender === g ? "#333" : "#aaa",
//                 color: "#fff",
//                 borderRadius: 6,
//                 border: "none",
//                 cursor: "pointer",
//               }}
//             >
//               {g[0].toUpperCase() + g.slice(1)}
//             </button>
//           ))}
//         </div>
//       </div>

//       {/* Outfit (Sash Dress) for Female Only */}
//       {gender === "female" && (
//         <div style={{ marginBottom: 16 }}>
//           <strong>Outfit:</strong>
//           {!dressStage ? (
//             <button
//               onClick={handleSashClick}
//               style={{
//                 marginTop: 8,
//                 padding: "8px 12px",
//                 background: "#6e3f1c",
//                 color: "#fff",
//                 border: "none",
//                 borderRadius: 6,
//                 cursor: "pointer",
//               }}
//             >
//               Sash Dress
//             </button>
//           ) : (
//             <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 10 }}>
//               {dressDescriptions.map((desc) => (
//                 <button
//                   key={desc.key}
//                   onClick={() => setSelectedDress(desc.key)}
//                   style={{
//                     padding: "8px 12px",
//                     background: selectedDress === desc.key ? "#2f241a" : "#6e3f1c",
//                     color: "#fff",
//                     border: "none",
//                     borderRadius: 6,
//                     cursor: "pointer",
//                   }}
//                 >
//                   {desc.label}
//                 </button>
//               ))}
//             </div>
//           )}
//         </div>
//       )}

//       {/* Sprite Preview */}
//       <SpritePreview gender={gender} selectedDress={selectedDress} />
//     </main>
//   );
// }
















