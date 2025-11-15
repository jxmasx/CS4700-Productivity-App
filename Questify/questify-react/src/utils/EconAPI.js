import { API } from '../apiBase';

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

export async function updateRollover(user_id) {
  try {
    const response = await fetch(API(`/users/${user_id}/rollover`), {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' }
    });
    return await response.json();
  } catch (error) {
    console.error('Error updating rollover:', error);
    return null;
  }
}