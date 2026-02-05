/**
 * TASK SERVICE
 * Vazifa boshqaruvi xizmati
 */

import api from './api';

/**
 * Create new task (Admin)
 */
export const createTask = async (taskData) => {
  try {
    const response = await api.post('/tasks/create', taskData);
    return response.data;
  } catch (error) {
    console.error('Create task error:', error);
    throw error;
  }
};

/**
 * Get all tasks (Admin)
 */
export const getAllTasks = async (filters = {}) => {
  try {
    const response = await api.get('/tasks/all', { params: filters });
    return response.data;
  } catch (error) {
    console.error('Get all tasks error:', error);
    throw error;
  }
};

/**
 * Get my tasks (Staff)
 */
export const getMyTasks = async () => {
  try {
    const response = await api.get('/tasks/my-tasks');
    return response.data;
  } catch (error) {
    console.error('Get my tasks error:', error);
    throw error;
  }
};

/**
 * Start task (Staff)
 */
export const startTask = async (taskId) => {
  try {
    const response = await api.put(`/tasks/${taskId}/start`);
    return response.data;
  } catch (error) {
    console.error('Start task error:', error);
    throw error;
  }
};

/**
 * Complete task (Staff)
 */
export const completeTask = async (taskId, completionNotes) => {
  try {
    const response = await api.put(`/tasks/${taskId}/complete`, { completionNotes });
    return response.data;
  } catch (error) {
    console.error('Complete task error:', error);
    throw error;
  }
};

/**
 * Verify task (Admin)
 */
export const verifyTask = async (taskId, verificationNotes) => {
  try {
    const response = await api.put(`/tasks/${taskId}/verify`, { verificationNotes });
    return response.data;
  } catch (error) {
    console.error('Verify task error:', error);
    throw error;
  }
};

/**
 * Reject task (Admin)
 */
export const rejectTask = async (taskId, rejectionReason) => {
  try {
    const response = await api.put(`/tasks/${taskId}/reject`, { rejectionReason });
    return response.data;
  } catch (error) {
    console.error('Reject task error:', error);
    throw error;
  }
};

/**
 * Delete task (Admin)
 */
export const deleteTask = async (taskId) => {
  try {
    const response = await api.delete(`/tasks/${taskId}`);
    return response.data;
  } catch (error) {
    console.error('Delete task error:', error);
    throw error;
  }
};

/**
 * Get staff list (Admin)
 */
export const getStaffList = async (role = null) => {
  try {
    const params = role ? { role } : {};
    const response = await api.get('/tasks/staff-list', { params });
    return response.data;
  } catch (error) {
    console.error('Get staff list error:', error);
    throw error;
  }
};

export default {
  createTask,
  getAllTasks,
  getMyTasks,
  startTask,
  completeTask,
  verifyTask,
  rejectTask,
  deleteTask,
  getStaffList
};
