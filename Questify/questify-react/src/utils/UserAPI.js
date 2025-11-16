import { API } from '../apiBase';

// Updates rollover in user table, then is received through UserContext
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