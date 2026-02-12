import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { prescriptionService } from '../services/prescriptionService';
import { patientService } from '../services/patientService';

const PatientPrescriptions = () => {
  const { id } = useParams();
  const [loading, setLoading] = useState(true);
  const [patient, setPatient] = useState(null);
  const [prescriptions, setPrescriptions] = useState([]);
  const [selectedPrescription, setSelectedPrescription] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  useEffect(() => {
    loadData();
  }, [id]);

  const loadData = async () => {
    try {
      setLoading(true);
      
      const [patientResponse, prescriptionsResponse] = await Promise.all([
        patientService.getPatient(id),
        prescriptionService.getPatientPrescriptions(id)
      ]);

      if (patientResponse.success) {
        setPatient(patientResponse.data.patient);
      }

      if (prescriptionsResponse.success) {
        setPrescriptions(prescriptionsResponse.data);
      }
    } catch (error) {
      console.error('Load data error:', error);
    } finally {
      setLoading(false);
    }
  };

  const viewPrescription = async (prescriptionId) => {
    try {
      const response = await prescriptionService.getPrescription(prescriptionId);
      if (response.success) {
        setSelectedPrescription(response.data);
        setShowDetailModal(true);
      }
    } catch (error) {
      console.error('View prescription error:', error);
    }
  };

  const getTypeColor = (type) => {
    return type === 'URGENT' 
      ? 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400'
      : 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400';
  };

  const getTypeText = (type) => {
    return type === 'URGENT' ? 'Shoshilinch' : 'Oddiy';
  };

  if (loading) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="size-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Yuklanmoqda...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white">
            Bemor retseptlari
          </h1>
          {patient && (
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              {patient.first_name} {patient.last_name} - {patient.patient_number}
            </p>
          )}
        </div>
        <button
          onClick={loadData}
          className="px-4 sm:px-4 sm:px-6 lg:px-4 sm:px-6 lg:px-8 py-2 sm:py-2.5 bg-primary text-white rounded-lg sm:rounded-lg sm:rounded-xl text-sm sm:text-sm sm:text-base font-semibold hover:opacity-90"
        >
          <span className="material-symbols-outlined text-sm sm:text-base mr-2 align-middle">refresh</span>
          Yangilash
        </button>
      </div>

      {/* Prescriptions List */}
      <div className="bg-white dark:bg-gray-900 rounded-lg sm:rounded-xl border border-gray-200 dark:border-gray-800">
        {prescriptions.length === 0 ? (
          <div className="p-12 text-center">
            <span className="material-symbols-outlined text-6xl text-gray-300 dark:text-gray-700 mb-4">
              medical_services
            </span>
            <p className="text-gray-500 dark:text-gray-400">Retseptlar yo'q</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {prescriptions.map((prescription) => (
              <div
                key={prescription.id}
                className="p-4 sm:p-6 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 sm:gap-3 mb-3">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getTypeColor(prescription.prescription_type)}`}>
                        {getTypeText(prescription.prescription_type)}
                      </span>
                      <span className="text-sm sm:text-sm sm:text-base text-gray-500">
                        {new Date(prescription.created_at).toLocaleDateString('uz-UZ', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                    </div>

                    <div className="space-y-2 sm:space-y-2 sm:space-y-3">
                      <div>
                        <span className="text-sm sm:text-sm sm:text-base font-semibold text-gray-700 dark:text-gray-300">
                          Tashxis:
                        </span>
                        <p className="text-gray-900 dark:text-white mt-1">
                          {prescription.diagnosis}
                        </p>
                      </div>

                      <div>
                        <span className="text-sm sm:text-sm sm:text-base font-semibold text-gray-700 dark:text-gray-300">
                          Shifokor:
                        </span>
                        <p className="text-gray-600 dark:text-gray-400">
                          Dr. {prescription.doctor_first_name} {prescription.doctor_last_name}
                        </p>
                      </div>

                      {prescription.medications && prescription.medications.length > 0 && (
                        <div>
                          <span className="text-sm sm:text-sm sm:text-base font-semibold text-gray-700 dark:text-gray-300">
                            Dorilar: {prescription.medications.length} ta
                          </span>
                          <div className="mt-2 space-y-1">
                            {prescription.medications.slice(0, 3).map((med, index) => (
                              <div key={index} className="flex items-center gap-2 sm:gap-2 sm:gap-3 text-sm sm:text-sm sm:text-base">
                                {med.is_urgent && (
                                  <span className="size-2 bg-red-500 rounded-full"></span>
                                )}
                                <span className="text-gray-600 dark:text-gray-400">
                                  {med.medication_name} - {med.dosage}
                                </span>
                              </div>
                            ))}
                            {prescription.medications.length > 3 && (
                              <p className="text-sm sm:text-sm sm:text-base text-gray-500">
                                va yana {prescription.medications.length - 3} ta...
                              </p>
                            )}
                          </div>
                        </div>
                      )}

                      {prescription.notes && (
                        <div>
                          <span className="text-sm sm:text-sm sm:text-base font-semibold text-gray-700 dark:text-gray-300">
                            Izoh:
                          </span>
                          <p className="text-gray-600 dark:text-gray-400 text-sm sm:text-sm sm:text-base">
                            {prescription.notes}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-2 sm:gap-2 sm:gap-3">
                    <button
                      onClick={() => viewPrescription(prescription.id)}
                      className="px-4 sm:px-4 sm:px-6 lg:px-4 sm:px-6 lg:px-8 py-2 sm:py-2.5 bg-primary text-white rounded-lg sm:rounded-lg sm:rounded-xl text-sm sm:text-sm sm:text-base font-semibold hover:opacity-90 flex items-center gap-2 sm:gap-2 sm:gap-3"
                    >
                      <span className="material-symbols-outlined text-sm sm:text-base">visibility</span>
                      Batafsil
                    </button>
                    <button
                      onClick={() => {
                        prescriptionService.printPrescriptionReceipt(
                          prescription,
                          patient
                        );
                      }}
                      className="px-4 sm:px-4 sm:px-6 lg:px-4 sm:px-6 lg:px-8 py-2 sm:py-2.5 bg-green-600 text-white rounded-lg sm:rounded-lg sm:rounded-xl text-sm sm:text-sm sm:text-base font-semibold hover:bg-green-700 flex items-center gap-2 sm:gap-2 sm:gap-3"
                      title="Chekni chiqarish"
                    >
                      <span className="material-symbols-outlined text-sm sm:text-base">print</span>
                      Chek
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {showDetailModal && selectedPrescription && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-3 sm:p-4">
          <div className="bg-white dark:bg-gray-900 rounded-lg sm:rounded-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-4 sm:p-6 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
              <h2 className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white">
                Retsept detallari
              </h2>
              <button
                onClick={() => setShowDetailModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
              {/* Patient Info */}
              <div className="p-3 sm:p-4 bg-green-50 dark:bg-green-900/20 rounded-lg sm:rounded-lg sm:rounded-xl">
                <p className="font-semibold text-gray-900 dark:text-white">
                  {selectedPrescription.patient_first_name} {selectedPrescription.patient_last_name}
                </p>
                <p className="text-sm sm:text-sm sm:text-base text-gray-600 dark:text-gray-400">
                  {selectedPrescription.patient_number}
                </p>
              </div>

              {/* Prescription Info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <span className="text-sm sm:text-sm sm:text-base font-semibold text-gray-700 dark:text-gray-300">
                    Sana
                  </span>
                  <p className="text-gray-900 dark:text-white">
                    {new Date(selectedPrescription.created_at).toLocaleDateString('uz-UZ', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
                <div>
                  <span className="text-sm sm:text-sm sm:text-base font-semibold text-gray-700 dark:text-gray-300">
                    Shifokor
                  </span>
                  <p className="text-gray-900 dark:text-white">
                    Dr. {selectedPrescription.doctor_first_name} {selectedPrescription.doctor_last_name}
                  </p>
                </div>
              </div>

              {/* Diagnosis */}
              <div>
                <span className="text-sm sm:text-sm sm:text-base font-semibold text-gray-700 dark:text-gray-300">
                  Tashxis
                </span>
                <p className="text-gray-900 dark:text-white mt-1">
                  {selectedPrescription.diagnosis}
                </p>
              </div>

              {/* Medications */}
              <div>
                <h3 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white mb-4">
                  Dorilar ro'yxati
                </h3>
                <div className="space-y-3 sm:space-y-4">
                  {selectedPrescription.medications?.map((med, index) => (
                    <div
                      key={med.id}
                      className={`p-3 sm:p-4 rounded-lg sm:rounded-lg sm:rounded-xl ${
                        med.is_urgent
                          ? 'bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500'
                          : 'bg-gray-50 dark:bg-gray-800'
                      }`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2 sm:gap-2 sm:gap-3">
                          <span className="font-semibold text-gray-900 dark:text-white">
                            {index + 1}. {med.medication_name}
                          </span>
                          {med.is_urgent && (
                            <span className="px-2 py-0.5 bg-red-600 text-white text-xs rounded-full">
                              Shoshilinch
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Shoshilinch retseptda faqat dori nomi, oddiyda to'liq ma'lumotlar */}
                      {selectedPrescription.prescription_type === 'REGULAR' && (
                        <>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 text-sm sm:text-sm sm:text-base">
                            {med.dosage && (
                              <div>
                                <span className="text-gray-600 dark:text-gray-400">Dozasi:</span>
                                <p className="text-gray-900 dark:text-white font-medium">
                                  {med.dosage}
                                </p>
                              </div>
                            )}
                            {med.frequency && (
                              <div>
                                <span className="text-gray-600 dark:text-gray-400">Chastotasi:</span>
                                <p className="text-gray-900 dark:text-white font-medium">
                                  {med.frequency}
                                </p>
                              </div>
                            )}
                            {med.duration_days && (
                              <div>
                                <span className="text-gray-600 dark:text-gray-400">Davomiyligi:</span>
                                <p className="text-gray-900 dark:text-white font-medium">
                                  {med.duration_days} kun
                                </p>
                              </div>
                            )}
                          </div>

                          {med.instructions && (
                            <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-700">
                              <span className="text-xs text-gray-600 dark:text-gray-400">
                                Ko'rsatmalar:
                              </span>
                              <p className="text-sm sm:text-sm sm:text-base text-gray-900 dark:text-white mt-1">
                                {med.instructions}
                              </p>
                            </div>
                          )}
                        </>
                      )}

                      {selectedPrescription.prescription_type === 'URGENT' && (
                        <p className="text-sm sm:text-sm sm:text-base text-gray-600 dark:text-gray-400 italic">
                          Shoshilinch retsept - batafsil ma'lumotlar shifokor tomonidan og'zaki beriladi
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Notes */}
              {selectedPrescription.notes && (
                <div>
                  <span className="text-sm sm:text-sm sm:text-base font-semibold text-gray-700 dark:text-gray-300">
                    Qo'shimcha izohlar
                  </span>
                  <p className="text-gray-900 dark:text-white mt-1">
                    {selectedPrescription.notes}
                  </p>
                </div>
              )}
            </div>

            <div className="p-4 sm:p-6 border-t border-gray-200 dark:border-gray-800 flex gap-2 sm:gap-3">
              <button
                onClick={() => {
                  prescriptionService.printPrescriptionReceipt(
                    selectedPrescription,
                    patient
                  );
                }}
                className="flex-1 px-4 sm:px-6 lg:px-4 sm:px-6 lg:px-8 py-2 sm:py-3 bg-green-600 text-white rounded-lg sm:rounded-xl font-semibold hover:bg-green-700 flex items-center justify-center gap-2 sm:gap-2 sm:gap-3"
              >
                <span className="material-symbols-outlined">print</span>
                Chekni chiqarish
              </button>
              <button
                onClick={() => setShowDetailModal(false)}
                className="flex-1 px-4 sm:px-6 lg:px-4 sm:px-6 lg:px-8 py-2 sm:py-3 bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg sm:rounded-xl font-semibold hover:bg-gray-200 dark:hover:bg-gray-700"
              >
                Yopish
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PatientPrescriptions;
