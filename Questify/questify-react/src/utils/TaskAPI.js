import { API } from '../apiBase';

export async function createTask(user_id, taskData) {
  try {
    const response = await fetch(API(`/users/${user_id}/tasks`), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(taskData)
    });
    return await response.json();
  } catch (error) {
    console.error('Error creating task:', error);
    return null;
  }
}

export async function readTasks(user_id) {
    try {
      const response = await fetch(API(`/users/${user_id}/tasks`));
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error reading tasks:', error);
      return [];
    }
  }

export async function updateTask(user_id, task_id, taskData) {
  try {
    const response = await fetch(API(`/users/${user_id}/tasks/${task_id}`), {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(taskData)
    });
    return await response.json();
  } catch (error) {
    console.error('Error updating task:', error);
    return null;
  }
}

export async function deleteTask(user_id, task_id) {
  try {
    await fetch(API(`/users/${user_id}/tasks/${task_id}`), {
      method: 'DELETE'
    });
    return true;
  } catch (error) {
    console.error('Error deleting task:', error);
    return false;
  }
}