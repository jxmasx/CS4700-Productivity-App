/* -----------------------------------------------------------------------------
 QUESTIFY GUILD HALL & SHOP
  - Displays current gold and inventory
  - Lets player claim pending rewards from habits/quests
  - Creates Guild Shop with predefined items
  - Creates Custom Reward Creator (The user-defined treats & rewards)
  - Reads/writes gold, inventory, and pending rewards via localStorage (Will need to be changed to connect to database)

 LOCALSTORAGE KEYS (must match QuestCard / other systems)
  - adventurerGold       -> total gold in Guild Hall context
  - adventurerInventory  -> simple list of obtained items/rewards
  - pendingRewards       -> unclaimed rewards; objects like:
      { id, label, gold, xp }
 -----------------------------------------------------------------------------*/

import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import AdventurerNamePlate from "./AdventurerNamePlate";
import QuestifyNavBar from "./QuestifyNavBar";


/*Default stock in the Guild Shop.*/
const DEFAULT_SHOP_ITEMS = [
  {
    id: "potion-small",
    name: "Small Mana Potion",
    cost: 20,
    desc: "Restore a little energy after a long study session.",
  },
  {
    id: "potion-large",
    name: "Major Health Potion",
    cost: 40,
    desc: "A big self-care moment – stretch, hydrate, reset.",
  },
  {
    id: "focus-scroll",
    name: "Scroll of Focus",
    cost: 35,
    desc: "Use when you want a focused, distraction-free work block.",
  },
  {
    id: "guild-banner",
    name: "Guild Banner",
    cost: 60,
    desc: "A cosmetic upgrade that shows your dedication to the guild.",
  },
];

/*LocalStorage key names centralized so they’re easy to reuse. WILL HAVE TO BE CHANGED*/
const LOCAL_KEYS = {
  GOLD: "adventurerGold",
  INVENTORY: "adventurerInventory",
  PENDING: "pendingRewards",
};

const GuildHall = () => {
  const navigate = useNavigate();

  /* ---------------------------------------------------------------------------
   GOLD STATE
  ---------------------------------------------------------------------------*/
  const [gold, setGold] = useState(0);

  /*Loads gold once on mount (fallback starter: 100).*/
  useEffect(() => {
    const stored = Number(localStorage.getItem(LOCAL_KEYS.GOLD));
    setGold(Number.isFinite(stored) ? stored : 100);
  }, []);

  /*Persists gold whenever it changes.*/
  useEffect(() => {
    localStorage.setItem(LOCAL_KEYS.GOLD, String(gold));
  }, [gold]);

  /*---------------------------------------------------------------------------
   INVENTORY STATE
  ---------------------------------------------------------------------------*/
  const [inventory, setInventory] = useState([]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(LOCAL_KEYS.INVENTORY);
      if (raw) setInventory(JSON.parse(raw));
    } catch {
      setInventory([]);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(LOCAL_KEYS.INVENTORY, JSON.stringify(inventory));
  }, [inventory]);

  /* ---------------------------------------------------------------------------
   PENDING REWARDS STATE
  ---------------------------------------------------------------------------*/
  const [pendingRewards, setPendingRewards] = useState([]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(LOCAL_KEYS.PENDING);
      if (raw) setPendingRewards(JSON.parse(raw));
    } catch {
      setPendingRewards([]);
    }
  }, []);

  const savePendingRewards = (next) => {
    setPendingRewards(next);
    localStorage.setItem(LOCAL_KEYS.PENDING, JSON.stringify(next));
  };

  // ---------------------------------------------------------------------------
  // CLAIMING REWARDS
  // ---------------------------------------------------------------------------
  const claimReward = (rewardId) => {
    const reward = pendingRewards.find((r) => r.id === rewardId);
    if (!reward) return;

    /*1)Adds gold*/
    setGold((prev) => prev + (reward.gold || 0));

    /*2)Logs reward in inventory for "flavor"*/
    setInventory((items) => [
      ...items,
      {
        id: `reward-${reward.id}-${Date.now()}`,
        name: reward.label || "Completed Habit",
        from: "habit",
        goldValue: reward.gold || 0,
      },
    ]);

    /*3)Removes from pending*/
    savePendingRewards(pendingRewards.filter((r) => r.id !== rewardId));
  };

  const claimAllRewards = () => {
    if (!pendingRewards.length) return;

    const totalGold = pendingRewards.reduce(
      (sum, r) => sum + (r.gold || 0),
      0
    );

    setGold((prev) => prev + totalGold);

    setInventory((items) => [
      ...items,
      ...pendingRewards.map((r) => ({
        id: `reward-${r.id}-${Date.now()}-${Math.random()}`,
        name: r.label || "Completed Habit",
        from: "habit",
        goldValue: r.gold || 0,
      })),
    ]);

    savePendingRewards([]);
  };

  /*---------------------------------------------------------------------------
   SHOP & CUSTOM REWARDS
  ---------------------------------------------------------------------------*/
  const [shopItems] = useState(DEFAULT_SHOP_ITEMS);

  const canAfford = (cost) => gold >= cost;

  const buyItem = (item) => {
    if (!canAfford(item.cost)) return;

    setGold((prev) => prev - item.cost);
    setInventory((items) => [
      ...items,
      {
        id: `shop-${item.id}-${Date.now()}`,
        name: item.name,
        from: "shop",
      },
    ]);
  };

  const [customName, setCustomName] = useState("");
  const [customCost, setCustomCost] = useState(10);

  const handleCreateCustom = (e) => {
    e.preventDefault();

    const trimmed = customName.trim();
    if (!trimmed) return;

    const cost = Number(customCost) || 0;
    if (!canAfford(cost)) return;

    setGold((prev) => prev - cost);

    setInventory((items) => [
      ...items,
      {
        id: `custom-${Date.now()}`,
        name: trimmed,
        from: "custom",
        cost,
      },
    ]);

    setCustomName("");
    setCustomCost(10);
  };

  /*Basic info about the adventurer, pulled from BuildAdventurer.*/
  const storedAdventurer = (() => {
    try {
      return JSON.parse(localStorage.getItem("adventurer") || "{}");
    } catch {
      return {};
    }
  })();

  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        //Background image from public folder
        backgroundImage: `url(${process.env.PUBLIC_URL}/sprites/backgrounds/guildhall_background.png)`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
        fontFamily: "Poppins, system-ui, sans-serif",
        padding: "2rem 1rem",
      }}
    >
      <div
        className="wood guildhall-wood"
        style={{ width: "min(1100px, 96vw)", padding: "1.5rem" }}
      >

         {/*Global Navigation Bar – same across all of Questify*/}
            <QuestifyNavBar />

        {/*Title band*/}
        <div className="title-band" aria-hidden="true">
          <div className="title">Guild Hall &amp; Shop</div>
        </div>

        {/*Nameplate summary at the top*/}
        <div style={{ marginBottom: "1rem" }}>
          <AdventurerNamePlate
            name={storedAdventurer.name || "New Adventurer"}
            species={storedAdventurer.species}
            gold={gold}
            guildStreak={0}
            rank="Guild Novice"
            expPercent={0}
            spriteUrl={
              storedAdventurer.outfit && storedAdventurer.species
                ? `/sprites/avatar/outfit_${storedAdventurer.outfit}_${storedAdventurer.species}.png`
                : undefined
            }
            level={1}
            actionLabel="Return to Dashboard"
            onAction={() => navigate("/")}
          />
        </div>

        {/*TOP ROW*/}
        <div
          className="guildhall-summary"
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "1rem",
            color: "#3f220e",
          }}
        >
          <div style={{ fontWeight: 700 }}>
            Current Gold: <span style={{ fontWeight: 900 }}>{gold}</span>
          </div>
           

         {/*Ignore This: Button to return to Dashboard | replaced with navigator bar*/}  
         {/* <button
            type="button"
            className="chip"
            onClick={() => navigate("/")}
            style={{
              background: "#3b2a18",
              color: "#fff7e8",
              padding: "8px 16px",
              borderRadius: 999,
              fontWeight: 700,
              cursor: "pointer",
              border: "none",
            }}
          >
            Return to Dashboard
          </button> */}
        </div>
                

        {/*Main Grid: left (rewards) / right (shop + custom)*/}
        <div
          className="panel guildhall-panel"
          style={{
            display: "grid",
            gridTemplateColumns: "minmax(0, 1.1fr) minmax(0, 1fr)",
            gap: "1.5rem",
            alignItems: "start",
            width: "100%",
          }}
        >
          {/*Left Side: Rewards & Inventory*/}
          <section
            className="guildhall-column guildhall-rewards"
            style={{
              background: "#f7e8cf",
              borderRadius: 18,
              border: "2px solid #8b5e34",
              padding: "1rem",
              boxShadow: "0 6px 18px rgba(0,0,0,.22)",
            }}
          >
            {/*Rewards header*/}
            <header
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "baseline",
                marginBottom: ".5rem",
              }}
            >
              <div>
                <h2 style={{ margin: 0, fontSize: "1.25rem" }}>
                  Rewards Desk
                </h2>
                <p
                  style={{
                    margin: 0,
                    fontSize: ".9rem",
                    color: "#5a3417",
                  }}
                >
                  Claim rewards earned by completing habits and quests.
                </p>
              </div>

              <button
                type="button"
                disabled={!pendingRewards.length}
                onClick={claimAllRewards}
                className="chip"
                style={{
                  background: pendingRewards.length ? "#2f241a" : "#8b5e34",
                  color: "#fff7e8",
                  padding: "8px 14px",
                  borderRadius: 999,
                  fontWeight: 700,
                  cursor: pendingRewards.length ? "pointer" : "not-allowed",
                  border: "none",
                }}
              >
                Claim All
              </button>
            </header>

            {/*Pending rewards list*/}
            <div
              style={{
                borderRadius: 12,
                border: "1px dashed #b07a46",
                padding: "0.75rem",
                background: "#fffaf3",
                maxHeight: 220,
                overflowY: "auto",
              }}
            >
              {pendingRewards.length === 0 ? (
                <p
                  style={{
                    margin: 0,
                    fontSize: ".9rem",
                    color: "#7b5b3a",
                  }}
                >
                  No unclaimed rewards. Complete habits and quests, then return
                  here to collect your spoils.
                </p>
              ) : (
                <ul
                  style={{
                    listStyle: "none",
                    padding: 0,
                    margin: 0,
                    display: "flex",
                    flexDirection: "column",
                    gap: 8,
                  }}
                >
                  {pendingRewards.map((reward) => (
                    <li
                      key={reward.id}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        padding: "6px 8px",
                        borderRadius: 10,
                        background: "#f2e0c2",
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: 600 }}>
                          {reward.label || "Completed Habit"}
                        </div>
                        <div
                          style={{
                            fontSize: ".8rem",
                            color: "#6a4726",
                          }}
                        >
                          +{reward.gold || 0} gold
                          {reward.xp ? ` · +${reward.xp} EXP` : ""}
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => claimReward(reward.id)}
                        className="chip"
                        style={{
                          background: "#3b2a18",
                          color: "#fff7e8",
                          padding: "6px 10px",
                          borderRadius: 999,
                          fontSize: ".8rem",
                          cursor: "pointer",
                          border: "none",
                        }}
                      >
                        Claim
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/*Inventory listing*/}
            <div style={{ marginTop: "1rem" }}>
              <h3
                style={{
                  margin: "0 0 .25rem",
                  fontSize: "1.05rem",
                }}
              >
                Guild Satchel (Inventory)
              </h3>
              <div
                style={{
                  borderRadius: 12,
                  border: "1px solid #b07a46",
                  padding: "0.75rem",
                  background: "#fffaf3",
                  maxHeight: 220,
                  overflowY: "auto",
                }}
              >
                {inventory.length === 0 ? (
                  <p
                    style={{
                      margin: 0,
                      fontSize: ".9rem",
                      color: "#7b5b3a",
                    }}
                  >
                    Your satchel is empty. Claimed rewards and shop items will
                    appear here.
                  </p>
                ) : (
                  <ul
                    style={{
                      listStyle: "none",
                      padding: 0,
                      margin: 0,
                      display: "flex",
                      flexDirection: "column",
                      gap: 6,
                    }}
                  >
                    {inventory.map((item) => (
                      <li
                        key={item.id}
                        style={{
                          padding: "5px 7px",
                          borderRadius: 8,
                          background: "#f2e4cf",
                          fontSize: ".9rem",
                        }}
                      >
                        <strong>{item.name}</strong>{" "}
                        <span
                          style={{
                            fontSize: ".75rem",
                            color: "#6a4726",
                          }}
                        >
                          {item.from === "habit" && "· Claimed Reward"}
                          {item.from === "shop" && "· Shop Item"}
                          {item.from === "custom" && "· Custom Reward"}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </section>

          {/*Right Side: shop + custom rewards*/}
          <section
            className="guildhall-column guildhall-shop"
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "1rem",
            }}
          >
            {/*Guild Shop*/}
            <div
              style={{
                background: "#f7e8cf",
                borderRadius: 18,
                border: "2px solid #8b5e34",
                padding: "1rem",
                boxShadow: "0 6px 18px rgba(0,0,0,.22)",
              }}
            >
              <h2 style={{ margin: 0, fontSize: "1.2rem" }}>Guild Shop</h2>
              <p
                style={{
                  margin: "0 0 0.5rem",
                  fontSize: ".9rem",
                  color: "#5a3417",
                }}
              >
                Spend gold on power-ups and cosmetic rewards.
              </p>

              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 8,
                }}
              >
                {shopItems.map((item) => {
                  const affordable = canAfford(item.cost);
                  return (
                    <div
                      key={item.id}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        padding: "6px 8px",
                        borderRadius: 10,
                        background: "#fffaf3",
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: 600 }}>{item.name}</div>
                        <div
                          style={{
                            fontSize: ".8rem",
                            color: "#6a4726",
                          }}
                        >
                          {item.desc}
                        </div>
                        <div
                          style={{
                            fontSize: ".8rem",
                            color: "#6a4726",
                            marginTop: 2,
                          }}
                        >
                          Cost: <strong>{item.cost}</strong> gold
                        </div>
                      </div>

                      <button
                        type="button"
                        className="chip"
                        onClick={() => buyItem(item)}
                        disabled={!affordable}
                        style={{
                          background: affordable ? "#2f241a" : "#8b5e34",
                          color: "#fff7e8",
                          padding: "8px 12px",
                          borderRadius: 999,
                          fontWeight: 700,
                          cursor: affordable ? "pointer" : "not-allowed",
                          border: "none",
                          fontSize: ".85rem",
                        }}
                      >
                        {affordable ? "Buy" : "Not enough gold"}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

            {/*Custom reward creator*/}
            <div
              style={{
                background: "#f7e8cf",
                borderRadius: 18,
                border: "2px solid #8b5e34",
                padding: "1rem",
                boxShadow: "0 6px 18px rgba(0,0,0,.22)",
              }}
            >
              <h2 style={{ margin: 0, fontSize: "1.2rem" }}>
                Create Your Own Reward
              </h2>
              <p
                style={{
                  margin: "0 0 .5rem",
                  fontSize: ".9rem",
                  color: "#5a3417",
                }}
              >
                Name an IRL treat or ritual and “buy” it with your hard-earned
                gold.
              </p>

              <form onSubmit={handleCreateCustom}>
                {/*Reward name field*/}
                <label
                  style={{
                    display: "block",
                    marginBottom: 8,
                    fontSize: ".9rem",
                  }}
                >
                  Reward Name
                  <input
                    type="text"
                    value={customName}
                    onChange={(e) => setCustomName(e.target.value)}
                    placeholder="e.g., Bubble Tea, 30-min Game Break"
                    style={{
                      width: "100%",
                      marginTop: 4,
                      padding: "8px 10px",
                      borderRadius: 12,
                      border: "2px solid #8b5e34",
                      background: "#fffaf3",
                    }}
                  />
                </label>

                {/*Reward cost field*/}
                <label
                  style={{
                    display: "block",
                    marginBottom: 10,
                    fontSize: ".9rem",
                  }}
                >
                  Cost in Gold
                  <input
                    type="number"
                    min={0}
                    value={customCost}
                    onChange={(e) => setCustomCost(e.target.value)}
                    style={{
                      width: "100%",
                      marginTop: 4,
                      padding: "8px 10px",
                      borderRadius: 12,
                      border: "2px solid #8b5e34",
                      background: "#fffaf3",
                    }}
                  />
                </label>

                {/*Submit Button*/}
                <button
                  type="submit"
                  className="chip"
                  disabled={
                    !customName.trim() || !canAfford(Number(customCost) || 0)
                  }
                  style={{
                    background:
                      customName.trim() &&
                      canAfford(Number(customCost) || 0)
                        ? "#2f241a"
                        : "#8b5e34",
                    color: "#fff7e8",
                    padding: "10px 18px",
                    borderRadius: 999,
                    fontWeight: 700,
                    cursor:
                      customName.trim() &&
                      canAfford(Number(customCost) || 0)
                        ? "pointer"
                        : "not-allowed",
                    border: "none",
                  }}
                >
                  Buy Custom Reward
                </button>
              </form>

              <p
                style={{
                  marginTop: 8,
                  fontSize: ".8rem",
                  color: "#6a4726",
                }}
              >
                Tip: Use these for IRL rewards that genuinely feel good and are
                sustainable. You are worth celebrating!
              </p>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
};

export default GuildHall;
