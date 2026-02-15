cd // ODDIY VA ISHLAYDIGAN ResultModal
// Bu kodni Laboratory.jsx ga ko'chiring

function ResultModal({ isOpen, onClose, order, onSuccess, t }) {
  const [loading, setLoading] = useState(false);
  const [testParams, setTestParams] = useState([]);
  
  // Order ochilganda test parametrlarini yuklash
  useEffect(() => {
    async function loadTestParams() {
      if (!isOpen || !order) return;
      
      console.log('=== LOADING TEST PARAMS ===');
      console.log('Order:', order);
      console.log('Test ID:', order.test_id);
      
      if (order.test_id) {
        try {
          const response = await laboratoryService.getTestById(order.test_id);
          console.log('Test response:', response);
          
          if (response.success && response.data && response.data.test_parameters) {
            const params = response.data.test_parameters.map(p => ({
              name: p.name || p.parameter,
              value: '',
              unit: p.unit || '',
              normalRange: p.normal_range || p.normalRange || ''
            }));
            console.log('Setting params:', params);
            setTestParams(params);
          } else {
            console.log('No test_parameters found');
            setTestParams([]);
          }
        } catch (error) {
          console.error('Error loading test:', error);
          setTestParams([]);
        }
      } else {
        console.log('No test_id in order');
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
  
  console.log('=== RENDERING MODAL ===');
  console.log('testParams:', testParams);
  console.log('testParams.length:', testParams.length);
  
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-900 rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between border-b pb-4">
            <h2 className="text-2xl font-bold">Натижани киритиш</h2>
            <button type="button" onClick={onClose} className="text-gray-500 hover:text-gray-700">
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>
          
          {/* Order info */}
          <div className="p-4 bg-green-50 rounded-lg">
            <p className="font-semibold">{order?.patient_name}</p>
            <p className="text-sm text-gray-600">{order?.test_name}</p>
          </div>
          
          {/* Table */}
          {testParams.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse border-2 border-gray-300">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border border-gray-300 px-4 py-3 text-left font-bold">№</th>
                    <th className="border border-gray-300 px-4 py-3 text-left font-bold">ТАҲЛИЛ НОМИ</th>
                    <th className="border border-gray-300 px-4 py-3 text-center font-bold">НАТИЖА</th>
                    <th className="border border-gray-300 px-4 py-3 text-center font-bold text-blue-600">МЕ'ЁР</th>
                    <th className="border border-gray-300 px-4 py-3 text-center font-bold text-blue-600">ЎЛЧОВ БИРЛИГИ</th>
                  </tr>
                </thead>
                <tbody>
                  {testParams.map((param, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="border border-gray-300 px-4 py-3 text-center font-semibold">
                        {index + 1}.
                      </td>
                      <td className="border border-gray-300 px-4 py-3 font-bold uppercase">
                        {param.name}
                      </td>
                      <td className="border border-gray-300 px-2 py-2">
                        <input
                          type="text"
                          value={param.value}
                          onChange={(e) => {
                            const newParams = [...testParams];
                            newParams[index].value = e.target.value;
                            setTestParams(newParams);
                          }}
                          className="w-full px-3 py-2 border border-gray-300 rounded text-center"
                          placeholder="Қиймат"
                        />
                      </td>
                      <td className="border border-gray-300 px-4 py-3 text-center text-blue-600 font-semibold">
                        {param.normalRange}
                      </td>
                      <td className="border border-gray-300 px-4 py-3 text-center text-blue-600 font-semibold">
                        {param.unit}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <p>Bu test uchun parametrlar topilmadi</p>
              <p className="text-sm mt-2">Oddiy natija kiritish</p>
            </div>
          )}
          
          {/* Buttons */}
          <div className="flex gap-3 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Бекор қилиш
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-6 py-3 bg-primary text-white rounded-lg hover:opacity-90 disabled:opacity-50"
            >
              {loading ? 'Сақланмоқда...' : 'Сақлаш'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
