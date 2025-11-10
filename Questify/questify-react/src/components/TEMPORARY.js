import { useUser } from "../contexts/UserContext";

export default function Dashboard() {
    const { user, isAuthenticated, loading } = useUser();

    const character = useMemo(() => {
        return {
          name: user.display_name || "Adventurer",
          class: user.class || "Classless",
          guildRank: user.guild_rank,
          exp: user.xp,
          stats: {
            HP: user.hp || 5,
            MP: user.mana || 5,
            STR: user.str || 5,
            DEX: user.dex || 5,
            STAM: user.stam || 5,
            INT: user.int || 5,
            WIS: user.wis || 5,
            CHARM: user.charm || 5,
          },
        };
      }, [user]);

}