import { API } from '../apiBase';

/*------------------------------------------------------------------------------------
Example:
updateEconomy(user_id=5, econData={gold_delta: 10})    -> Add 10 gold to user 5
updateEconomy(2, {xp_delta: -20})                      -> Remove 20 xp from user 2
------------------------------------------------------------------------------------*/
export async function updateEconomy(user_id, econData) {
  try {
    const response = await fetch(API(`/users/${user_id}/economy`), {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(econData)
    });
    return await response.json();
  } catch (error) {
    console.error('Error updating economy:', error);
    return null;
  }
}