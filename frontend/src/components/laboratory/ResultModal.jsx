import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import laboratoryService from '../../services/laboratoryService';

export default function ResultModal({ isOpen, onClose, order, onSuccess, t }) {
  const [loading, setLoading] = useState(false);
  const [testParams, setTestParams] = useState([]);
  const [loadingTest, setLoadingTest] = useState(false);
  
  // Order ochilganda test parametrlarini yuklash
  useEffect(() => {
    async function loadTestParams() {
      if (!isOpen || !order) return;
      
      if (order.test_id) {
        try {
          setLoadingTest(true);
          const response = await laboratoryService.getTestById(order.test_id);
          
          if (response.success && response.data && response.data.test_parameters) {
            const params = response.data.test_parameters.map(p => ({
              name: p.name || p.parameter,
              value: '',
              unit: p.unit || '',
              normalRange: p.normal_range || p.normalRange || ''
            }));
            setTestParams(params);
          } else {
            setTestParams([]);
          }
        } catch (error) {
          console.error('Error loading test:', error);
          setTestParams([]);
        } finally {
          setLoadingTest(false);
        }
      } else {
        setTestParams([]);
      }
    }
    
    loadTestParams();
  }, [isOpen, order]);
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate
    const hasValues = testParams.some(p => p.value.trim() !== '');
    if (!hasValues) {
      toast.error('Kamida bitta parametr qiymatini kiriting');
      return;
    }
    
    try {
      setLoading(true);
      
      const test_results = testParams
        .filter(p => p.value.trim() !== '')
        .map(p => ({
          parameter_name: p.name,
          value: p.value,
          unit: p.unit,
          normal_range: p.normalRange,
          is_normal: null
        }));
      
      await laboratoryService.submitResults(order.id, {
        test_results,
        notes: ''
      });
      
      toast.success('Natija muvaffaqiyatli kiritildi');
      onClose();
      onSuccess();
    } catch (error) {
      toast.error('Xatolik: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };
  
  if (!isOpen) return null;
  
  // Show loading while fetching test details
  if (loadingTest) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-3 sm:p-4">
        <div className="bg-white dark:bg-gray-900 rounded-xl sm:rounded-2xl p-8 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Тест маълумотлари юкланмоқда...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-3 sm:p-4">
      <div className="bg-white dark:bg-gray-900 rounded-xl sm:rounded-2xl max-w-2xl sm:max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit} className="p-3 sm:p-4 sm:p-6 space-y-3 sm:space-y-4 sm:space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-4 sticky top-0 bg-white dark:bg-gray-900 pb-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white">
              Натижани киритиш
            </h2>
            <button
              type="button"
              onClick={onClose}
              className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 flex-shrink-0"
            >
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>
          
          {/* Order info */}
          <div className="p-3 sm:p-4 bg-green-50 dark:bg-green-900/20 rounded-lg sm:rounded-xl border border-green-200 dark:border-green-800">
            <p className="font-semibold text-gray-900 dark:text-white">{order?.patient_name}</p>
            <p className="text-sm text-gray-600 dark:text-gray-400">{order?.test_name}</p>
            <p className="text-sm text-gray-600 dark:text-gray-400">Buyurtma: {order?.order_number}</p>
          </div>
          
          {/* Table - Xizmat qo'shilganda kiritilgan jadval */}
          {testParams.length > 0 ? (
            <div className="space-y-3">
              <div className="mb-3 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-blue-600">description</span>
                  <p className="text-sm text-blue-900 dark:text-blue-100 font-semibold">
                    Xizmat yaratishda qo'shilgan parametrlar jadvali
                  </p>
                </div>
                <p className="text-xs text-blue-700 dark:text-blue-300 mt-1 ml-7">
                  {testParams.length} ta parametr topildi
                </p>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full border-collapse border-2 border-gray-300 dark:border-gray-700">
                  <thead>
                    <tr className="bg-gray-50 dark:bg-gray-800">
                      <th className="border border-gray-300 dark:border-gray-700 px-3 py-3 text-center text-sm font-bold text-gray-900 dark:text-white" style={{ width: '60px' }}>
                        №
                      </th>
                      <th className="border border-gray-300 dark:border-gray-700 px-4 py-3 text-left text-sm font-bold text-gray-900 dark:text-white">
                        ТАҲЛИЛ НОМИ
                      </th>
                      <th className="border border-gray-300 dark:border-gray-700 px-4 py-3 text-center text-sm font-bold text-gray-900 dark:text-white" style={{ width: '200px' }}>
                        НАТИЖА
                      </th>
                      <th className="border border-gray-300 dark:border-gray-700 px-4 py-3 text-center text-sm font-bold text-blue-600 dark:text-blue-400" style={{ width: '150px' }}>
                        МЕ'ЁР
                      </th>
                      <th className="border border-gray-300 dark:border-gray-700 px-4 py-3 text-center text-sm font-bold text-blue-600 dark:text-blue-400" style={{ width: '150px' }}>
                        ЎЛЧОВ БИРЛИГИ
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {testParams.map((param, index) => (
                      <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                        <td className="border border-gray-300 dark:border-gray-700 px-3 py-3 text-center text-sm text-gray-900 dark:text-white font-semibold">
                          {index + 1}.
                        </td>
                        <td className="border border-gray-300 dark:border-gray-700 px-4 py-3 text-left text-sm font-bold text-gray-900 dark:text-white uppercase">
                          {param.name}
                        </td>
                        <td className="border border-gray-300 dark:border-gray-700 px-2 py-2">
                          <input
                            type="text"
                            value={param.value}
                            onChange={(e) => {
                              const newParams = [...testParams];
                              newParams[index].value = e.target.value;
                              setTestParams(newParams);
                            }}
                            className="w-full px-3 py-2.5 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-center text-sm"
                            placeholder="Қиймат"
                          />
                        </td>
                        <td className="border border-gray-300 dark:border-gray-700 px-4 py-3 text-center text-sm text-blue-600 dark:text-blue-400 font-semibold">
                          {param.normalRange}
                        </td>
                        <td className="border border-gray-300 dark:border-gray-700 px-4 py-3 text-center text-sm text-blue-600 dark:text-blue-400 font-semibold">
                          {param.unit}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              <span className="material-symbols-outlined text-5xl mb-4">science</span>
              <p className="font-semibold">Bu test uchun parametrlar topilmadi</p>
              <p className="text-sm mt-2">Xizmat yaratishda PDF yuklash orqali parametrlar qo'shishingiz mumkin</p>
            </div>
          )}
          
          {/* Buttons */}
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={onClose}
              className="w-full sm:flex-1 px-4 py-2.5 bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg font-semibold hover:bg-gray-200 dark:hover:bg-gray-700"
            >
              Бекор қилиш
            </button>
            <button
              type="submit"
              disabled={loading || testParams.length === 0}
              className="w-full sm:flex-1 px-4 py-2.5 bg-primary text-white rounded-lg font-semibold hover:opacity-90 disabled:opacity-50"
            >
              {loading ? 'Сақланмоқда...' : 'Сақлаш'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
