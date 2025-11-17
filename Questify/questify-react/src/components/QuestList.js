import React, { useState, useEffect } from "react";
import QuestCard from "./QuestCard";
import { useUser } from "../contexts/UserContext";
import { getUserQuests, getQuest } from "../utils/QuestAPI";

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

                // Get all user quests
                const allUserQuests = await Promise.all(
                    (userQuests || []).map(async (userQuest) => {
                        const questData = await getQuest(userQuest.quest_id);
                        return {
                            quest_id: userQuest.quest_id,
                            quest_name: questData?.label || "Unknown Quest",
                            xp_reward: questData?.rewardXp || 0,
                            gold_reward: questData?.rewardGold || 0,
                            completion_message: questData?.statusMessage || "Quest completed!",
                            user_quest_id: userQuest.id,
                            is_done: userQuest.is_done,
                        };
                    })
                );
                
                setQuests(allUserQuests);
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
                            initialCompleted={quest.is_done || false}
                            onQuestCompleted={() => handleQuestCompleted(quest.quest_id)}
                        />
                    </div>
                </div>
            ))}
        </div>
    );
}