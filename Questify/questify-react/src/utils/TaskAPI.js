import { API } from '../apiBase';

/*---------------------------------------------------------------------------------
Example:                              -> Creates a task with title, type, etc.
createTask(user_id=5, taskData={                                        
      id: crypto.randomUUID(), title: "Title of Task", type: "To-Do",
      category: "CHA", difficulty: "Easy", dueAt: due.toISOString(),
      done: false, pomsDone: 0, pomsEstimate: 10,
    };)
---------------------------------------------------------------------------------*/
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

// Get all of a users tasks from backend using user_id
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

// Update a task with same structure as createTask on specified user_id and task_id
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

// Delete a user's specified task on user_id and task_id
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