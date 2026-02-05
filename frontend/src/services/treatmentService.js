import api from './api';

/**
 * Get treatment schedules
 */
export const getTreatmentSchedules = async (params = {}) => {
  const response = await api.get('/treatments', { params });
  return response.data;
};

/**
 * Get patient's daily treatment schedule
 */
export const getPatientDailySchedule = async (patientId, date = null) => {
  const params = date ? { date } : {};
  const response = await api.get(`/treatments/patient/${patientId}/schedule`, { params });
  return response.data;
};

/**
 * Get today's treatments for nurse
 */
export const getMyTodayTreatments = async () => {
  const response = await api.get('/treatments/my-today');
  return response.data;
};

/**
 * Complete treatment
 */
export const completeTreatment = async (treatmentId, notes = '') => {
  const response = await api.put(`/treatments/${treatmentId}/complete`, { notes });
  return response.data;
};

/**
 * Assign nurse to treatment
 */
export const assignNurseToTreatment = async (treatmentId, nurseId) => {
  const response = await api.put(`/treatments/${treatmentId}/assign-nurse`, { nurse_id: nurseId });
  return response.data;
};

/**
 * Bulk assign nurse to multiple treatments
 */
export const bulkAssignNurse = async (treatmentIds, nurseId) => {
  const response = await api.put('/treatments/bulk-assign-nurse', {
    treatment_ids: treatmentIds,
    nurse_id: nurseId
  });
  return response.data;
};

export default {
  getTreatmentSchedules,
  getPatientDailySchedule,
  getMyTodayTreatments,
  completeTreatment,
  assignNurseToTreatment,
  bulkAssignNurse
};
