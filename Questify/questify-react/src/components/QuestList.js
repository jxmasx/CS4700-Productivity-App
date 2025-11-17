import React, { useState, useEffect } from "react";
import QuestCard from "./QuestCard";
import { useUser } from "../contexts/UserContext";
import { getUserQuests } from "../utils/QuestAPI";

// OG Task
const STARTER_QUEST = {
    id: "starter-quest-first-habit",
    label: "Starter Quest: Complete your first habit",
    rewardXp: 10,
    rewardGold: 5,
    statusMessage: "You defended the Hall of Habits. The smog retreats… for now.",
};

export default function QuestList() {
    const { user } = useUser();
    const [quests, setQuests] = useState([]);

    // Fetch user's quests from the API
    useEffect(() => {
        const fetchQuests = async () => {
            if (!user?.id) {
                return;
            }

            try {
                const userQuests = await getUserQuests(user.id);

                const allQuests = [
                    {
                        quest_id: STARTER_QUEST.id,
                        quest_name: STARTER_QUEST.label,
                        xp_reward: STARTER_QUEST.rewardXp,
                        gold_reward: STARTER_QUEST.rewardGold,
                        completion_message: STARTER_QUEST.statusMessage,
                        user_quest_id: null, // Local quest, no backend ID
                    },
                    ...(userQuests || [])
                ];
                setQuests(allQuests);
            } catch (error) {
                console.log("Error fetching quests:", error)
            }
        };

        fetchQuests();
    }, [user?.id]);

    // Happens when the quest is completed, idk what to do with it
    const handleQuestCompleted = (questId) => {
        console.log(`Quest completed: ${questId}`);
    };

    return (
        <div>
            {quests.map((quest) => (
                <div key={quest.user_quest_id || quest.quest_id} className="quest-modal-backdrop">
                    <div className="quest-modal">
                        <QuestCard
                            visible={true}
                            questId={quest.quest_id}
                            label={quest.quest_name}
                            rewardXp={quest.xp_reward}
                            rewardGold={quest.gold_reward}
                            statusMessage={quest.completion_message || "Quest completed!"}
                            userQuestId={quest.user_quest_id}
                            onQuestCompleted={() => handleQuestCompleted(quest.quest_id)}
                        />
                    </div>
                </div>
            ))}
        </div>
    );
}