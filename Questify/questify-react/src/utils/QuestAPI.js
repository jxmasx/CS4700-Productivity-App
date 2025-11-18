import { API } from '../apiBase';

// Get list of all quests
export async function getAllQuests() {
  try {
    const response = await fetch(API('/quests'));
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching quests:', error);
    return [];
  }
}

// Get a specific quest using id
export async function getQuest(quest_id) {
  try {
    const response = await fetch(API(`/quests/${quest_id}`));
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching quest:', error);
    return null;
  }
}

// Used to create a quest (admins only)
export async function createQuest(questData) {
  try {
    const response = await fetch(API('/quests'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(questData)
    });
    if (!response.ok) {
      const error = await response.json();
      console.error('Create quest failed:', response.status, error);
      throw new Error(`Failed to create quest: ${JSON.stringify(error)}`);
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error creating quest:', error);
    throw error;
  }
}

// Get all of a user's quests using id
export async function getUserQuests(user_id) {
  try {
    const response = await fetch(API(`/users/${user_id}/quests`));
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching user quests:', error);
    return [];
  }
}

// Add a quest to the specified user
export async function assignQuestToUser(user_id, questData) {
  try {
    const response = await fetch(API(`/users/${user_id}/quests`), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(questData)
    });
    if (!response.ok) {
      const error = await response.json();
      console.error('Assign quest failed:', response.status, error);
      throw new Error(`Failed to assign quest: ${JSON.stringify(error)}`);
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error assigning quest to user:', error);
    throw error;
  }
}

// Update a user's quest (complete/incomplete)
export async function updateUserQuest(user_id, user_quest_id, is_done) {
  try {
    const response = await fetch(API(`/users/${user_id}/quests/${user_quest_id}?is_done=${is_done}`), {
      method: 'PATCH'
    });
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error updating user quest:', error);
    return null;
  }
}

// Remove quest from a user (will not be used?)
export async function deleteUserQuest(user_id, user_quest_id) {
  try {
    await fetch(API(`/users/${user_id}/quests/${user_quest_id}`), {
      method: 'DELETE'
    });
    return true;
  } catch (error) {
    console.error('Error deleting user quest:', error);
    return false;
  }
}

// Delete all of a user's pending rewards
export async function deletePendingRewards(user_id) {
  try {
    await fetch(API(`/quests/${user_id}/pr`), {
      method: 'DELETE'
    });
    return true;
  } catch (error) {
    console.error('Error deleting pending rewards:', error);
    return false;
  }
}

// Delete one of a user's pending rewards
export async function deletePendingReward(user_id, pr_id) {
  try {
    await fetch(API(`/quests/${user_id}/pr/${pr_id}`), {
      method: 'DELETE'
    });
    return true;
  } catch (error) {
    console.error('Error deleting pending reward:', error);
    return false;
  }
}

// Get all of a user's pending rewards
export async function getPendingRewards(user_id) {
    try {
      const response = await fetch(API(`/quests/${user_id}/pr`));
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error reading pending rewards:', error);
      return [];
    }
  }

// Add a pending reward for a user
export async function addPendingReward(user_id, rewardData) {
  try {
    await fetch(API(`/quests/${user_id}/pr`), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(rewardData)
    });
    return true;
  } catch (error) {
    console.error('Error adding pending reward:', error);
    return false;
  }
}