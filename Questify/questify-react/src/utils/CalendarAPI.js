import { API } from '../apiBase';

// DIRTY FIX TO GET CALENDAR FROM BACKEND, USES LOCALSTORAGE STRING
export async function getCalendar(user_id) {
    try {
      const response = await fetch(API(`/users/${user_id}/calendar`));
      if (!response.ok) {
        // If calendar doesn't exist for user, return empty array
        if (response.status === 404) {
          return { store_local_events: "[]", store_tasks: "[]" };
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error reading calendar:', error);
      return { store_local_events: "[]", store_tasks: "[]" };
    }
  }

// DIRTY FIX TO UPDATE CALENDAR, JUST USES LOCALSTORAGE STRING
export async function updateCalendar(user_id, calendarData) {
  try {
    console.log('Updating calendar with data:', calendarData);
    const response = await fetch(API(`/users/${user_id}/calendar`), {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(calendarData)
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Calendar update failed:', response.status, errorText);
      throw new Error(`HTTP error! status: ${response.status}, body: ${errorText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error updating calendar:', error);
    return null;
  }
}