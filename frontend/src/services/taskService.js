/**
 * TASK SERVICE
 * Vazifa boshqaruvi xizmati
 */

import api from './api';

/**
 * Create new task (Admin)
 */
export const createTask = async (taskData) => {
  const response = await api.post('/tasks/create', taskData);
  return response.data;
};

/**
 * Get all tasks (Admin)
 */
export const getAllTasks = async (filters = {}) => {
  const response = await api.get('/tasks/all', { params: filters });
  return response.data;
};

/**
 * Get my tasks (Staff)
 */
export const getMyTasks = async () => {
  const response = await api.get('/tasks/my-tasks');
  return response.data;
};

/**
 * Start task (Staff)
 */
export const startTask = async (taskId) => {
  const response = await api.put(`/tasks/${taskId}/start`);
  return response.data;
};

/**
 * Complete task (Staff)
 */
export const completeTask = async (taskId, completionNotes) => {
  const response = await api.put(`/tasks/${taskId}/complete`, { completionNotes });
  return response.data;
};

/**
 * Verify task (Admin)
 */
export const verifyTask = async (taskId, verificationNotes) => {
  const response = await api.put(`/tasks/${taskId}/verify`, { verificationNotes });
  return response.data;
};

/**
 * Reject task (Admin)
 */
export const rejectTask = async (taskId, rejectionReason) => {
  const response = await api.put(`/tasks/${taskId}/reject`, { rejectionReason });
  return response.data;
};

/**
 * Delete task (Admin)
 */
export const deleteTask = async (taskId) => {
  const response = await api.delete(`/tasks/${taskId}`);
  return response.data;
};

/**
 * Get staff list (Admin)
 */
export const getStaffList = async (role = null) => {
  const params = role ? { role } : {};
  const response = await api.get('/tasks/staff-list', { params });
  return response.data;
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
