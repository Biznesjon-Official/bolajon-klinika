import { useState } from 'react';
import toast from 'react-hot-toast';
import laboratoryService from '../../services/laboratoryService';
import api from '../../services/api';

export default function TestsCatalog({ tests, onRefresh, t }) {
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingTest, setEditingTest] = useState(null);
  const [formData, setFormData] = useState({
    test_name: '',
    price: '',
    description: '',
    turnaround_time: '',
    category: ''
  });
  const [pdfFile, setPdfFile] = useState(null);
  const [uploadingPdf, setUploadingPdf] = useState(false);
  const [pdfTableData, setPdfTableData] = useState([]);

  const handleAdd = () => {
    setEditingTest(null);
    setFormData({
      test_name: '',
      price: '',
      description: '',
      turnaround_time: '',
      category: ''
    });
    setPdfFile(null);
    setPdfTableData([]);
    setShowAddModal(true);
  };

  const handleEdit = (test) => {
    setEditingTest(test);
    setFormData({
      test_name: test.test_name || '',
      price: test.price || '',
      description: test.description || '',
      turnaround_time: test.turnaround_time || '',
      category: test.category || ''
    });
    setPdfFile(null);
    setPdfTableData([]);
    setShowAddModal(true);
  };

  const handlePdfUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      toast.error('Faqat PDF fayl yuklash mumkin');
      return;
    }

    setPdfFile(file);
    setUploadingPdf(true);

    try {
      const formData = new FormData();
      formData.append('pdf', file);

      const response = await api.post('/laboratory/parse-pdf', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      if (response.data.success) {
        toast.success(response.data.message || 'PDF muvaffaqiyatli yuklandi');
        
        if (response.data.data) {
          const pdfData = response.data.data;
          
          setFormData(prev => ({
            ...prev,
            test_name: pdfData.test_name || prev.test_name,
            description: pdfData.description || prev.description
          }));
          
          if (pdfData.table_data && pdfData.table_data.length > 0) {
            setPdfTableData(pdfData.table_data);
          } else {
            setPdfTableData([
              { parameter: '', value: '', unit: '', normalRange: '' }
            ]);
            toast.info('PDF yuklandi. Iltimos, jadval ma\'lumotlarini qo\'lda kiriting.');
          }
        }
      }
    } catch (error) {
      toast.error('PDF ni yuklashda xatolik: ' + (error.response?.data?.message || error.message));
      setPdfFile(null);
      setPdfTableData([]);
    } finally {
      setUploadingPdf(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const backendData = {
        name: formData.test_name,
        category: formData.category || 'Umumiy',
        price: formData.price,
        description: formData.description,
        duration_minutes: formData.turnaround_time ? parseInt(formData.turnaround_time) * 60 : null,
        test_parameters: pdfTableData.length > 0 ? pdfTableData.map(row => ({
          name: row.parameter,
          unit: row.unit,
          normal_range: row.normalRange
        })) : []
      };

      if (editingTest) {
        await laboratoryService.updateTest(editingTest.id, backendData);
        toast.success('Xizmat yangilandi');
      } else {
        await laboratoryService.createTest(backendData);
        toast.success('Xizmat qo\'shildi');
      }
      setShowAddModal(false);
      setPdfTableData([]);
      onRefresh();
    } catch (error) {
      toast.error('Xatolik: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleDelete = async (testId) => {
    if (!window.confirm('Ushbu xizmatni o\'chirmoqchimisiz?')) return;
    try {
      await laboratoryService.deleteTest(testId);
      toast.success('Xizmat o\'chirildi');
      onRefresh();
    } catch (error) {
      toast.error('Xatolik: ' + (error.response?.data?.message || error.message));
    }
  };

  return (
    <div className="bg-white dark:bg-gray-900 rounded-lg sm:rounded-xl border border-gray-200 dark:border-gray-800 p-3 sm:p-4 sm:p-4 sm:p-6 overflow-hidden sm:block">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg sm:text-lg sm:text-xl font-bold text-gray-900 dark:text-white">Laboratoriya xizmatlari</h3>
        <button
          onClick={handleAdd}
          className="px-4 sm:px-4 sm:px-6 lg:px-4 sm:px-6 lg:px-8 py-2 sm:py-2.5 bg-primary text-white rounded-lg sm:rounded-lg sm:rounded-xl font-semibold hover:opacity-90 flex items-center gap-2 sm:gap-2 sm:gap-3"
        >
          <span className="material-symbols-outlined">add</span>
          Xizmat qo'shish
        </button>
      </div>

      {tests.length === 0 ? (
        <div className="text-center py-12">
          <span className="material-symbols-outlined text-6xl text-gray-300 mb-4">science</span>
          <p className="text-gray-600 dark:text-gray-400">Hali xizmatlar qo'shilmagan</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3 sm:gap-3 sm:gap-4">
          {tests.map((test) => (
            <div key={test.id} className="border border-gray-200 dark:border-gray-700 rounded-lg sm:rounded-lg sm:rounded-xl p-3 sm:p-4 bg-gray-50 dark:bg-gray-800 overflow-hidden sm:block">
              <div className="flex items-start justify-between mb-2">
                <h4 className="font-bold text-gray-900 dark:text-white break-words flex-1">{test.test_name}</h4>
                <div className="flex gap-1">
                  <button
                    onClick={() => handleEdit(test)}
                    className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                  >
                    <span className="material-symbols-outlined text-base sm:text-lg">edit</span>
                  </button>
                  <button
                    onClick={() => handleDelete(test.id)}
                    className="p-1 text-red-600 hover:bg-red-50 rounded"
                  >
                    <span className="material-symbols-outlined text-base sm:text-lg">delete</span>
                  </button>
                </div>
              </div>
              <p className="text-sm sm:text-sm sm:text-base text-gray-600 dark:text-gray-400 break-words">{test.test_code}</p>
              <p className="text-base sm:text-lg font-semibold text-primary mt-2">
                {test.price?.toLocaleString() || 0} so'm
              </p>
              {test.description && (
                <p className="text-sm sm:text-sm sm:text-base text-gray-600 dark:text-gray-400 mt-2 break-words">{test.description}</p>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-3 sm:p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl sm:rounded-2xl max-w-xl sm:max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-4 sm:p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl sm:text-2xl font-bold">{editingTest ? 'Xizmatni tahrirlash' : 'Yangi xizmat qo\'shish'}</h3>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
                <div>
                  <label className="block text-sm sm:text-sm sm:text-base font-semibold mb-2">Xizmat nomi *</label>
                  <input
                    type="text"
                    value={formData.test_name}
                    onChange={(e) => setFormData({ ...formData, test_name: e.target.value })}
                    className="w-full px-4 sm:px-4 sm:px-6 lg:px-4 sm:px-6 lg:px-8 py-2 sm:py-2.5 border rounded-lg sm:rounded-lg sm:rounded-xl dark:bg-gray-900 dark:border-gray-700"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm sm:text-sm sm:text-base font-semibold mb-2">Narxi (so'm) *</label>
                  <input
                    type="number"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    className="w-full px-4 sm:px-4 sm:px-6 lg:px-4 sm:px-6 lg:px-8 py-2 sm:py-2.5 border rounded-lg sm:rounded-lg sm:rounded-xl dark:bg-gray-900 dark:border-gray-700"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm sm:text-sm sm:text-base font-semibold mb-2">Tavsif</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-4 sm:px-4 sm:px-6 lg:px-4 sm:px-6 lg:px-8 py-2 sm:py-2.5 border rounded-lg sm:rounded-lg sm:rounded-xl dark:bg-gray-900 dark:border-gray-700"
                    rows="3"
                  />
                </div>

                <div>
                  <label className="block text-sm sm:text-sm sm:text-base font-semibold mb-2">Tayyorlanish vaqti (soat)</label>
                  <input
                    type="number"
                    value={formData.turnaround_time}
                    onChange={(e) => setFormData({ ...formData, turnaround_time: e.target.value })}
                    className="w-full px-4 sm:px-4 sm:px-6 lg:px-4 sm:px-6 lg:px-8 py-2 sm:py-2.5 border rounded-lg sm:rounded-lg sm:rounded-xl dark:bg-gray-900 dark:border-gray-700"
                  />
                </div>

                <div>
                  <label className="block text-sm sm:text-sm sm:text-base font-semibold mb-2">Kategoriya</label>
                  <input
                    type="text"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-4 sm:px-4 sm:px-6 lg:px-4 sm:px-6 lg:px-8 py-2 sm:py-2.5 border rounded-lg sm:rounded-lg sm:rounded-xl dark:bg-gray-900 dark:border-gray-700"
                    placeholder="Masalan: Biokimyo, Gematologiya"
                  />
                </div>

                {!editingTest && (
                  <>
                    <div>
                      <label className="block text-sm sm:text-sm sm:text-base font-semibold mb-2">
                        Natija varaqasi (PDF)
                        <span className="text-gray-500 text-xs ml-2">(Ixtiyoriy)</span>
                      </label>
                      <div className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg sm:rounded-lg sm:rounded-xl p-4 text-center">
                        <input
                          type="file"
                          accept=".pdf"
                          onChange={handlePdfUpload}
                          className="hidden"
                          id="pdf-upload"
                          disabled={uploadingPdf}
                        />
                        <label
                          htmlFor="pdf-upload"
                          className="cursor-pointer flex flex-col items-center gap-2"
                        >
                          <span className="material-symbols-outlined text-4xl text-gray-400">upload_file</span>
                          {pdfFile ? (
                            <div className="text-sm">
                              <p className="font-semibold text-green-600">{pdfFile.name}</p>
                              <p className="text-gray-500">PDF yuklandi</p>
                            </div>
                          ) : uploadingPdf ? (
                            <p className="text-sm text-gray-600">Yuklanmoqda...</p>
                          ) : (
                            <div className="text-sm text-gray-600">
                              <p className="font-semibold">PDF natija varaqasini yuklang</p>
                              <p className="text-xs">Jadval ma'lumotlari avtomatik ajratib olinadi</p>
                            </div>
                          )}
                        </label>
                      </div>
                    </div>

                    {/* PDF dan olingan jadval ma'lumotlari */}
                    {pdfTableData.length > 0 && (
                      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg sm:rounded-xl p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <span className="material-symbols-outlined text-blue-600">table_chart</span>
                            <h4 className="font-semibold text-blue-900 dark:text-blue-100">
                              Natija varaqasi jadvali
                            </h4>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              const newRow = { parameter: '', value: '', unit: '', normalRange: '' };
                              setPdfTableData([...pdfTableData, newRow]);
                            }}
                            className="px-3 py-1 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 flex items-center gap-1"
                          >
                            <span className="material-symbols-outlined text-sm">add</span>
                            Qator qo'shish
                          </button>
                        </div>
                        <div className="overflow-x-auto">
                          <table className="w-full text-sm border-collapse">
                            <thead className="bg-blue-100 dark:bg-blue-900/40">
                              <tr>
                                <th className="px-3 py-2 text-left font-semibold border">Параметр номи</th>
                                <th className="px-3 py-2 text-left font-semibold border">Бирлик</th>
                                <th className="px-3 py-2 text-left font-semibold border">Меъёр</th>
                                <th className="px-3 py-2 text-center font-semibold border w-20">Амал</th>
                              </tr>
                            </thead>
                            <tbody>
                              {pdfTableData.map((row, index) => (
                                <tr key={index} className="hover:bg-blue-100 dark:hover:bg-blue-900/20">
                                  <td className="px-2 py-2 border">
                                    <input
                                      type="text"
                                      value={row.parameter}
                                      onChange={(e) => {
                                        const newData = [...pdfTableData];
                                        newData[index].parameter = e.target.value;
                                        setPdfTableData(newData);
                                      }}
                                      className="w-full px-2 py-1 border rounded text-sm bg-white dark:bg-gray-800"
                                      placeholder="Параметр номи"
                                    />
                                  </td>
                                  <td className="px-2 py-2 border">
                                    <input
                                      type="text"
                                      value={row.unit}
                                      onChange={(e) => {
                                        const newData = [...pdfTableData];
                                        newData[index].unit = e.target.value;
                                        setPdfTableData(newData);
                                      }}
                                      className="w-full px-2 py-1 border rounded text-sm bg-white dark:bg-gray-800"
                                      placeholder="Бирлик"
                                    />
                                  </td>
                                  <td className="px-2 py-2 border">
                                    <input
                                      type="text"
                                      value={row.normalRange}
                                      onChange={(e) => {
                                        const newData = [...pdfTableData];
                                        newData[index].normalRange = e.target.value;
                                        setPdfTableData(newData);
                                      }}
                                      className="w-full px-2 py-1 border rounded text-sm bg-white dark:bg-gray-800"
                                      placeholder="Меъёр"
                                    />
                                  </td>
                                  <td className="px-2 py-2 text-center border">
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const newData = pdfTableData.filter((_, i) => i !== index);
                                        setPdfTableData(newData);
                                      }}
                                      className="p-1 text-red-600 hover:bg-red-50 rounded"
                                    >
                                      <span className="material-symbols-outlined text-sm">delete</span>
                                    </button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                        <p className="text-xs text-blue-700 dark:text-blue-300 mt-3">
                          💡 Jadval ma'lumotlarini tahrirlang yoki yangi qatorlar qo'shing
                        </p>
                      </div>
                    )}

                    {/* Qo'lda jadval qo'shish tugmasi */}
                    {!pdfFile && pdfTableData.length === 0 && (
                      <div className="text-center p-4 border-2 border-dashed border-gray-300 rounded-lg">
                        <button
                          type="button"
                          onClick={() => {
                            setPdfTableData([
                              { parameter: '', value: '', unit: '', normalRange: '' }
                            ]);
                          }}
                          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2 mx-auto"
                        >
                          <span className="material-symbols-outlined">add_circle</span>
                          Qo'lda jadval yaratish
                        </button>
                        <p className="text-xs text-gray-500 mt-2">
                          PDF yuklash o'rniga qo'lda parametrlarni kiritishingiz mumkin
                        </p>
                      </div>
                    )}
                  </>
                )}

                <div className="flex gap-2 sm:gap-3 pt-4 border-t">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="flex-1 px-4 sm:px-4 sm:px-6 lg:px-4 sm:px-6 lg:px-8 py-2 sm:py-2.5 border border-gray-300 rounded-lg sm:rounded-lg sm:rounded-xl hover:bg-gray-50"
                  >
                    Bekor qilish
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 sm:px-4 sm:px-6 lg:px-4 sm:px-6 lg:px-8 py-2 sm:py-2.5 bg-primary text-white rounded-lg sm:rounded-lg sm:rounded-xl hover:opacity-90"
                  >
                    {editingTest ? 'Yangilash' : 'Qo\'shish'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
