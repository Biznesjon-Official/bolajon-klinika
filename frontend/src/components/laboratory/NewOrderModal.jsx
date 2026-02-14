import { useState } from 'react';
import toast from 'react-hot-toast';
import laboratoryService from '../../services/laboratoryService';

export default function NewOrderModal({ isOpen, onClose, patients, doctors, tests, onSuccess, t }) {
  const [formData, setFormData] = useState({
    patient_id: '',
    doctor_id: '',
    test_id: '',
    priority: 'normal',
    notes: ''
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.patient_id || !formData.test_id) {
      toast.error(t('lab.fillRequired'));
      return;
    }

    try {
      setLoading(true);
      const response = await laboratoryService.createOrder(formData);
      if (response.success) {
        toast.success(`${t('lab.orderCreated')} - Hisob-faktura: ${response.data.invoice_number}`);
      } else {
        toast.success(t('lab.orderCreated'));
      }
      onClose();
      onSuccess();
    } catch (error) {
      toast.error(t('lab.error') + ': ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-3 sm:p-4">
      <div className="bg-white dark:bg-gray-900 rounded-xl sm:rounded-2xl max-w-xl sm:max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit} className="p-3 sm:p-4 sm:p-4 sm:p-6 space-y-3 sm:space-y-4 sm:space-y-4 sm:space-y-6">
          <div className="flex items-center justify-between mb-4 sticky top-0 bg-white dark:bg-gray-900 pb-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-xl sm:text-xl sm:text-2xl font-black text-gray-900 dark:text-white">{t('lab.newOrderTitle')}</h2>
            <button
              type="button"
              onClick={onClose}
              className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 flex-shrink-0"
            >
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>

          {/* Bemor */}
          <div>
            <label className="block text-xs sm:text-sm sm:text-sm sm:text-base font-semibold text-gray-700 dark:text-gray-300 mb-2">
              {t('lab.patient')} <span className="text-red-500">{t('lab.required')}</span>
            </label>
            <select
              required
              value={formData.patient_id}
              onChange={(e) => setFormData({ ...formData, patient_id: e.target.value })}
              className="w-full px-3 sm:px-4 sm:px-4 sm:px-6 lg:px-4 sm:px-6 lg:px-8 py-2 sm:py-2.5 sm:py-2 sm:py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white rounded-lg sm:rounded-xl focus:outline-none focus:ring-2 focus:ring-primary text-sm sm:text-sm sm:text-base"
            >
              <option value="">{t('lab.selectPatient')}</option>
              {patients.map((patient) => (
                <option key={patient.id} value={patient.id}>
                  {patient.first_name} {patient.last_name} - {patient.patient_number}
                </option>
              ))}
            </select>
          </div>

          {/* Shifokor */}
          <div>
            <label className="block text-xs sm:text-sm sm:text-sm sm:text-base font-semibold text-gray-700 dark:text-gray-300 mb-2">
              {t('lab.doctor')}
            </label>
            <select
              value={formData.doctor_id}
              onChange={(e) => setFormData({ ...formData, doctor_id: e.target.value })}
              className="w-full px-3 sm:px-4 sm:px-4 sm:px-6 lg:px-4 sm:px-6 lg:px-8 py-2 sm:py-2.5 sm:py-2 sm:py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white rounded-lg sm:rounded-xl focus:outline-none focus:ring-2 focus:ring-primary text-sm sm:text-sm sm:text-base"
            >
              <option value="">{t('lab.selectDoctor')}</option>
              {doctors.map((doctor) => (
                <option key={doctor.id} value={doctor.id}>
                  {doctor.first_name} {doctor.last_name} - {doctor.specialization}
                </option>
              ))}
            </select>
          </div>

          {/* Tahlil */}
          <div>
            <label className="block text-xs sm:text-sm sm:text-sm sm:text-base font-semibold text-gray-700 dark:text-gray-300 mb-2">
              {t('lab.test')} <span className="text-red-500">{t('lab.required')}</span>
            </label>
            <select
              required
              value={formData.test_id}
              onChange={(e) => setFormData({ ...formData, test_id: e.target.value })}
              className="w-full px-3 sm:px-4 sm:px-4 sm:px-6 lg:px-4 sm:px-6 lg:px-8 py-2 sm:py-2.5 sm:py-2 sm:py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white rounded-lg sm:rounded-xl focus:outline-none focus:ring-2 focus:ring-primary text-sm sm:text-sm sm:text-base"
            >
              <option value="">{t('lab.selectTest')}</option>
              {tests.map((test) => (
                <option key={test.id} value={test.id}>
                  {test.name} - {test.price?.toLocaleString() || 0} so'm
                </option>
              ))}
            </select>
          </div>

          {/* Muhimlik */}
          <div>
            <label className="block text-xs sm:text-sm sm:text-sm sm:text-base font-semibold text-gray-700 dark:text-gray-300 mb-2">
              {t('lab.priority')}
            </label>
            <div className="flex flex-col sm:flex-col sm:flex-row gap-2 sm:gap-2 sm:gap-3 sm:gap-2 sm:gap-3">
              <button
                type="button"
                onClick={() => setFormData({ ...formData, priority: 'normal' })}
                className={`flex-1 px-3 sm:px-4 sm:px-4 sm:px-6 lg:px-4 sm:px-6 lg:px-8 py-2 sm:py-2.5 sm:py-2 sm:py-3 rounded-lg sm:rounded-xl font-semibold transition-all text-sm sm:text-sm sm:text-base ${
                  formData.priority === 'normal'
                    ? 'bg-primary text-white'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300'
                }`}
              >
                {t('lab.normalPriority')}
              </button>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, priority: 'urgent' })}
                className={`flex-1 px-3 sm:px-4 sm:px-4 sm:px-6 lg:px-4 sm:px-6 lg:px-8 py-2 sm:py-2.5 sm:py-2 sm:py-3 rounded-lg sm:rounded-xl font-semibold transition-all text-sm sm:text-sm sm:text-base ${
                  formData.priority === 'urgent'
                    ? 'bg-orange-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300'
                }`}
              >
                {t('lab.urgent')}
              </button>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, priority: 'stat' })}
                className={`flex-1 px-3 sm:px-4 sm:px-4 sm:px-6 lg:px-4 sm:px-6 lg:px-8 py-2 sm:py-2.5 sm:py-2 sm:py-3 rounded-lg sm:rounded-xl font-semibold transition-all text-sm sm:text-sm sm:text-base ${
                  formData.priority === 'stat'
                    ? 'bg-red-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300'
                }`}
              >
                {t('lab.stat')}
              </button>
            </div>
          </div>

          {/* Izoh */}
          <div>
            <label className="block text-xs sm:text-sm sm:text-sm sm:text-base font-semibold text-gray-700 dark:text-gray-300 mb-2">
              {t('lab.notes')}
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows="3"
              className="w-full px-3 sm:px-4 sm:px-4 sm:px-6 lg:px-4 sm:px-6 lg:px-8 py-2 sm:py-2.5 sm:py-2 sm:py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white rounded-lg sm:rounded-xl focus:outline-none focus:ring-2 focus:ring-primary resize-none text-sm sm:text-sm sm:text-base"
              placeholder={t('lab.notesPlaceholder')}
            />
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-col sm:flex-row gap-2 sm:gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="w-full sm:flex-1 px-4 sm:px-4 sm:px-6 lg:px-4 sm:px-6 lg:px-8 sm:px-4 sm:px-6 lg:px-4 sm:px-6 lg:px-8 py-2 sm:py-2.5 sm:py-2 sm:py-3 bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg sm:rounded-xl font-semibold hover:bg-gray-200 dark:hover:bg-gray-700 text-sm sm:text-sm sm:text-base"
            >
              {t('lab.cancel')}
            </button>
            <button
              type="submit"
              disabled={loading}
              className="w-full sm:flex-1 px-4 sm:px-4 sm:px-6 lg:px-4 sm:px-6 lg:px-8 sm:px-4 sm:px-6 lg:px-4 sm:px-6 lg:px-8 py-2 sm:py-2.5 sm:py-2 sm:py-3 bg-primary text-white rounded-lg sm:rounded-xl font-semibold hover:opacity-90 disabled:opacity-50 text-sm sm:text-sm sm:text-base"
            >
              {loading ? t('lab.loading') : t('lab.createOrder')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
