/**
 * STAFF SALARY SERVICE
 * Xodimlar uchun maosh ma'lumotlari
 */

import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';

const getAuthHeader = () => {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

/**
 * Get my salary information
 */
export const getMySalary = async () => {
  try {
    const response = await axios.get(`${API_URL}/staff-salary/my-salary`, {
      headers: getAuthHeader()
    });
    return response.data;
  } catch (error) {
    console.error('Get my salary error:', error);
    throw error;
  }
};

/**
 * Get my bonuses and penalties
 */
export const getMyBonuses = async () => {
  try {
    const response = await axios.get(`${API_URL}/staff-salary/my-bonuses`, {
      headers: getAuthHeader()
    });
    return response.data;
  } catch (error) {
    console.error('Get my bonuses error:', error);
    throw error;
  }
};

/**
 * Get my commissions
 */
export const getMyCommissions = async (month, year) => {
  try {
    const params = {};
    if (month) params.month = month;
    if (year) params.year = year;

    const response = await axios.get(`${API_URL}/staff-salary/my-commissions`, {
      headers: getAuthHeader(),
      params
    });
    return response.data;
  } catch (error) {
    console.error('Get my commissions error:', error);
    throw error;
  }
};

export default {
  getMySalary,
  getMyBonuses,
  getMyCommissions
};
