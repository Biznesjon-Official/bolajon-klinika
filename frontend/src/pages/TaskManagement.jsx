/**
 * TASK MANAGEMENT PAGE
 * Admin tomonidan xodimlarga vazifa berish va boshqarish
 */

import { useState, useEffect } from 'react';
import taskService from '../services/taskService';
import toast, { Toaster } from 'react-hot-toast';
import Modal from '../components/Modal';

export default function TaskManagement() {
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('active'); // 'active', 'history'
  const [tasks, setTasks] = useState([]);
  const [staffList, setStaffList] = useState([]);
  
  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  
  // Form data
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    taskType: '',
    priority: '',
    assignedTo: '',
    dueDate: '',
    locationDetails: ''
  });

  const [verificationNotes, setVerificationNotes] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');

  useEffect(() => {
    loadData();
  }, [activeTab]);

  const loadData = async () => {
    try {
      setLoading(true);
      
      const filters = activeTab === 'active' 
        ? { status: ['pending', 'in_progress', 'completed'].join(',') }
        : { status: ['verified', 'cancelled'].join(',') };

      const [tasksResponse, staffResponse] = await Promise.all([
        taskService.getAllTasks(),
        taskService.getStaffList() // Get all staff, not just sanitar
      ]);

      if (tasksResponse.success) {
        // Filter based on tab
        const filteredTasks = tasksResponse.data.filter(task => {
          if (activeTab === 'active') {
            return ['pending', 'in_progress', 'completed'].includes(task.status);
          } else {
            return ['verified', 'cancelled'].includes(task.status);
          }
        });
        setTasks(filteredTasks);
      }

      if (staffResponse.success) {
        setStaffList(staffResponse.data);
        console.log('Xodimlar ro\'yxati:', staffResponse.data);
      } else {
        console.log('Xodimlar yuklashda xatolik:', staffResponse);
      }

    } catch (error) {
      console.error('Load data error:', error);
      console.error('Error details:', error.response?.data);
      
      const errorData = error.response?.data;
      
      if (error.response?.status === 401) {
        toast.error('Tizimga kirish huquqi yo\'q');
      } else if (error.response?.status === 403) {
        toast.error('Bu sahifaga kirish taqiqlangan');
      } else {
        toast.error('Ma\'lumotlarni yuklashda xatolik: ' + (errorData?.message || error.message));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTask = async (e) => {
    e.preventDefault();
    
    try {
      console.log('Sending task data:', formData);
      const response = await taskService.createTask(formData);
      
      if (response.success) {
        toast.success('Vazifa muvaffaqiyatli yaratildi');
        setShowCreateModal(false);
        resetForm();
        loadData();
      }
    } catch (error) {
      console.error('Create task error:', error);
      console.error('Error response:', error.response?.data);
      const errorMessage = error.response?.data?.message || 'Vazifa yaratishda xatolik';
      toast.error(errorMessage);
    }
  };

  const handleVerifyTask = async () => {
    try {
      const response = await taskService.verifyTask(selectedTask.id, verificationNotes);
      
      if (response.success) {
        toast.success('Vazifa tasdiqlandi');
        setShowVerifyModal(false);
        setVerificationNotes('');
        setSelectedTask(null);
        loadData();
      }
    } catch (error) {
      console.error('Verify task error:', error);
      toast.error('Vazifani tasdiqlashda xatolik');
    }
  };

  const handleRejectTask = async () => {
    try {
      const response = await taskService.rejectTask(selectedTask.id, rejectionReason);
      
      if (response.success) {
        toast.success('Vazifa qaytarildi');
        setShowRejectModal(false);
        setRejectionReason('');
        setSelectedTask(null);
        loadData();
      }
    } catch (error) {
      console.error('Reject task error:', error);
      toast.error('Vazifani qaytarishda xatolik');
    }
  };

  const handleDeleteTask = async (taskId) => {
    if (!confirm('Vazifani o\'chirmoqchimisiz?')) return;
    
    try {
      const response = await taskService.deleteTask(taskId);
      
      if (response.success) {
        toast.success('Vazifa o\'chirildi');
        loadData();
      }
    } catch (error) {
      console.error('Delete task error:', error);
      toast.error('Vazifani o\'chirishda xatolik');
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      taskType: '',
      priority: '',
      assignedTo: '',
      dueDate: '',
      locationDetails: ''
    });
  };

  const getStatusBadge = (status) => {
    const badges = {
      pending: { text: 'Yangi', class: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' },
      in_progress: { text: 'Bajarilmoqda', class: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' },
      completed: { text: 'Tugatilgan', class: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400' },
      verified: { text: 'Tasdiqlangan', class: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' },
      cancelled: { text: 'Bekor qilingan', class: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' }
    };
    return badges[status] || badges.pending;
  };

  const getPriorityBadge = (priority) => {
    const badges = {
      low: { text: 'Past', class: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300' },
      medium: { text: 'O\'rta', class: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' },
      high: { text: 'Yuqori', class: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400' },
      urgent: { text: 'Shoshilinch', class: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' }
    };
    return badges[priority] || badges.medium;
  };

  const formatDate = (date) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('uz-UZ', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Yuklanmoqda...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-3 sm:p-4 sm:p-4 sm:p-6 lg:p-4 sm:p-6 lg:p-8 space-y-4 sm:space-y-6">
      <Toaster position="top-right" />

      {/* Header */}
      <div className="flex flex-col sm:flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
        <div>
          <h1 className="text-2xl sm:text-2xl sm:text-3xl font-black text-gray-900 dark:text-white">
            Vazifa Boshqaruvi
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Xodimlarga vazifa berish va nazorat qilish
            {staffList.length > 0 && (
              <span className="ml-2 text-sm sm:text-sm sm:text-base">
                • {staffList.length} ta xodim mavjud
              </span>
            )}
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="px-4 sm:px-6 lg:px-4 sm:px-6 lg:px-8 py-2 sm:py-3 bg-primary text-white rounded-lg sm:rounded-lg sm:rounded-xl font-semibold hover:bg-primary/90 transition-colors flex items-center gap-2 sm:gap-2 sm:gap-3"
          disabled={staffList.length === 0}
        >
          <span className="material-symbols-outlined">add</span>
          Yangi Vazifa
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg sm:rounded-xl p-3 sm:p-4 border-2 border-yellow-200 dark:border-yellow-800">
          <p className="text-sm sm:text-sm sm:text-base text-gray-600 dark:text-gray-400">Yangi</p>
          <p className="text-xl sm:text-2xl font-black text-yellow-600 dark:text-yellow-400">
            {tasks.filter(t => t.status === 'pending').length}
          </p>
        </div>
        <div className="bg-green-50 dark:bg-green-900/20 rounded-lg sm:rounded-xl p-3 sm:p-4 border-2 border-green-200 dark:border-green-800">
          <p className="text-sm sm:text-sm sm:text-base text-gray-600 dark:text-gray-400">Bajarilmoqda</p>
          <p className="text-xl sm:text-2xl font-black text-green-600 dark:text-green-400">
            {tasks.filter(t => t.status === 'in_progress').length}
          </p>
        </div>
        <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg sm:rounded-xl p-3 sm:p-4 border-2 border-purple-200 dark:border-purple-800">
          <p className="text-sm sm:text-sm sm:text-base text-gray-600 dark:text-gray-400">Tasdiqlash</p>
          <p className="text-xl sm:text-2xl font-black text-purple-600 dark:text-purple-400">
            {tasks.filter(t => t.status === 'completed').length}
          </p>
        </div>
        <div className="bg-green-50 dark:bg-green-900/20 rounded-lg sm:rounded-xl p-3 sm:p-4 border-2 border-green-200 dark:border-green-800">
          <p className="text-sm sm:text-sm sm:text-base text-gray-600 dark:text-gray-400">Tasdiqlangan</p>
          <p className="text-xl sm:text-2xl font-black text-green-600 dark:text-green-400">
            {tasks.filter(t => t.status === 'verified').length}
          </p>
        </div>
      </div>

      {/* No Staff Warning */}
      {staffList.length === 0 && (
        <div className="bg-orange-50 dark:bg-orange-900/20 border-2 border-orange-200 dark:border-orange-800 rounded-lg sm:rounded-xl p-4 sm:p-6">
          <div className="flex items-start gap-3 sm:gap-4">
            <span className="material-symbols-outlined text-3xl sm:text-4xl text-orange-600 dark:text-orange-400">warning</span>
            <div className="flex-1">
              <h3 className="text-base sm:text-lg font-bold text-orange-900 dark:text-orange-200 mb-2">
                Xodimlar topilmadi
              </h3>
              <p className="text-orange-800 dark:text-orange-300 mb-3">
                Vazifa berish uchun avval xodimlarni tizimga qo'shishingiz kerak.
              </p>
              <a
                href="/staff"
                className="inline-flex items-center gap-2 sm:gap-2 sm:gap-3 px-4 sm:px-4 sm:px-6 lg:px-4 sm:px-6 lg:px-8 py-2 sm:py-2.5 bg-orange-600 text-white rounded-lg sm:rounded-lg sm:rounded-xl font-semibold hover:bg-orange-700 transition-colors"
              >
                <span className="material-symbols-outlined">person_add</span>
                Xodim Qo'shish
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="bg-white dark:bg-gray-900 rounded-lg sm:rounded-xl shadow-sm">
        <div className="border-b border-gray-200 dark:border-gray-800">
          <div className="flex gap-2 sm:gap-2 sm:gap-3 px-4 sm:px-4 sm:px-6 lg:px-4 sm:px-6 lg:px-8">
            <button
              onClick={() => setActiveTab('active')}
              className={`px-4 sm:px-6 lg:px-4 sm:px-6 lg:px-8 py-2 sm:py-3 font-semibold border-b-2 transition-colors ${
                activeTab === 'active'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-gray-600 dark:text-gray-400'
              }`}
            >
              Faol Vazifalar
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`px-4 sm:px-6 lg:px-4 sm:px-6 lg:px-8 py-2 sm:py-3 font-semibold border-b-2 transition-colors ${
                activeTab === 'history'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-gray-600 dark:text-gray-400'
              }`}
            >
              Tarix
            </button>
          </div>
        </div>

        <div className="p-4 sm:p-6">
          {tasks.length === 0 ? (
            <div className="text-center py-12">
              <span className="material-symbols-outlined text-6xl text-gray-300 dark:text-gray-700">
                task_alt
              </span>
              <p className="text-gray-500 dark:text-gray-400 mt-4">Vazifalar yo'q</p>
            </div>
          ) : (
            <div className="space-y-2 sm:space-y-3">
              {tasks.map(task => {
                const statusBadge = getStatusBadge(task.status);
                const priorityBadge = getPriorityBadge(task.priority);
                
                return (
                  <div
                    key={task.id}
                    className="bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-lg sm:rounded-lg sm:rounded-xl p-3 sm:p-4 hover:shadow-md transition-shadow"
                  >
                    <div className="flex flex-col lg:flex-col sm:flex-row lg:items-start lg:justify-between gap-3 sm:gap-4">
                      <div className="flex-1">
                        <div className="flex items-start gap-2 sm:gap-3 mb-2">
                          <div className="size-10 bg-primary/10 rounded-lg sm:rounded-lg sm:rounded-xl flex items-center justify-center flex-shrink-0">
                            <span className="material-symbols-outlined text-primary">task</span>
                          </div>
                          <div className="flex-1">
                            <h3 className="font-bold text-base sm:text-lg">{task.title}</h3>
                            <p className="text-sm sm:text-sm sm:text-base text-gray-600 dark:text-gray-400 mt-1">
                              {task.description}
                            </p>
                            <div className="flex flex-wrap items-center gap-2 sm:gap-2 sm:gap-3 mt-2">
                              <span className={`px-2 py-1 rounded text-xs font-semibold ${statusBadge.class}`}>
                                {statusBadge.text}
                              </span>
                              <span className={`px-2 py-1 rounded text-xs font-semibold ${priorityBadge.class}`}>
                                {priorityBadge.text}
                              </span>
                              <span className="text-xs text-gray-500">
                                👤 {task.first_name} {task.last_name}
                              </span>
                              {task.due_date && (
                                <span className="text-xs text-gray-500">
                                  📅 {formatDate(task.due_date)}
                                </span>
                              )}
                            </div>
                            {task.location_details && (
                              <p className="text-xs text-gray-500 mt-2">
                                📍 {task.location_details}
                              </p>
                            )}
                            {task.completion_notes && (
                              <div className="mt-2 p-2 bg-green-50 dark:bg-green-900/20 rounded text-sm sm:text-sm sm:text-base">
                                <p className="font-semibold text-green-900 dark:text-green-300">Xodim izohi:</p>
                                <p className="text-green-800 dark:text-green-400">{task.completion_notes}</p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2 sm:gap-2 sm:gap-3">
                        {task.status === 'completed' && (
                          <>
                            <button
                              onClick={() => {
                                setSelectedTask(task);
                                setShowVerifyModal(true);
                              }}
                              className="px-4 sm:px-4 sm:px-6 lg:px-4 sm:px-6 lg:px-8 py-2 sm:py-2.5 bg-green-500 text-white rounded-lg sm:rounded-lg sm:rounded-xl font-semibold hover:bg-green-600 transition-colors flex items-center gap-2 sm:gap-2 sm:gap-3"
                            >
                              <span className="material-symbols-outlined text-sm sm:text-sm sm:text-base">check_circle</span>
                              Tasdiqlash
                            </button>
                            <button
                              onClick={() => {
                                setSelectedTask(task);
                                setShowRejectModal(true);
                              }}
                              className="px-4 sm:px-4 sm:px-6 lg:px-4 sm:px-6 lg:px-8 py-2 sm:py-2.5 bg-orange-500 text-white rounded-lg sm:rounded-lg sm:rounded-xl font-semibold hover:bg-orange-600 transition-colors flex items-center gap-2 sm:gap-2 sm:gap-3"
                            >
                              <span className="material-symbols-outlined text-sm sm:text-sm sm:text-base">cancel</span>
                              Qaytarish
                            </button>
                          </>
                        )}
                        {['pending', 'in_progress'].includes(task.status) && (
                          <button
                            onClick={() => handleDeleteTask(task.id)}
                            className="px-4 sm:px-4 sm:px-6 lg:px-4 sm:px-6 lg:px-8 py-2 sm:py-2.5 bg-red-500 text-white rounded-lg sm:rounded-lg sm:rounded-xl font-semibold hover:bg-red-600 transition-colors flex items-center gap-2 sm:gap-2 sm:gap-3"
                          >
                            <span className="material-symbols-outlined text-sm sm:text-sm sm:text-base">delete</span>
                            O'chirish
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Create Task Modal */}
      {showCreateModal && (
        <Modal
          isOpen={showCreateModal}
          onClose={() => {
            setShowCreateModal(false);
            resetForm();
          }}
          title="Yangi Vazifa Yaratish"
        >
          <form onSubmit={handleCreateTask} className="space-y-3 sm:space-y-4">
            <div>
              <label className="block text-sm sm:text-sm sm:text-base font-semibold mb-2">Sarlavha *</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-4 sm:px-4 sm:px-6 lg:px-4 sm:px-6 lg:px-8 py-2 sm:py-2.5 border rounded-lg sm:rounded-lg sm:rounded-xl dark:bg-gray-800 dark:border-gray-700"
                required
              />
            </div>

            <div>
              <label className="block text-sm sm:text-sm sm:text-base font-semibold mb-2">Tavsif</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-4 sm:px-4 sm:px-6 lg:px-4 sm:px-6 lg:px-8 py-2 sm:py-2.5 border rounded-lg sm:rounded-lg sm:rounded-xl dark:bg-gray-800 dark:border-gray-700"
                rows="3"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div>
                <label className="block text-sm sm:text-sm sm:text-base font-semibold mb-2">Turi *</label>
                <input
                  type="text"
                  value={formData.taskType}
                  onChange={(e) => setFormData({ ...formData, taskType: e.target.value })}
                  className="w-full px-4 sm:px-4 sm:px-6 lg:px-4 sm:px-6 lg:px-8 py-2 sm:py-2.5 border rounded-lg sm:rounded-lg sm:rounded-xl dark:bg-gray-800 dark:border-gray-700"
                  placeholder="Masalan: Tozalash, Ta'mirlash..."
                  required
                />
              </div>

              <div>
                <label className="block text-sm sm:text-sm sm:text-base font-semibold mb-2">Muhimlik *</label>
                <select
                  value={formData.priority}
                  onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                  className="w-full px-4 sm:px-4 sm:px-6 lg:px-4 sm:px-6 lg:px-8 py-2 sm:py-2.5 border rounded-lg sm:rounded-lg sm:rounded-xl dark:bg-gray-800 dark:border-gray-700"
                  required
                >
                  <option value="">Tanlanmagan</option>
                  <option value="low">Past</option>
                  <option value="medium">O'rta</option>
                  <option value="high">Yuqori</option>
                  <option value="urgent">Shoshilinch</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm sm:text-sm sm:text-base font-semibold mb-2">Xodim *</label>
              {staffList.length === 0 ? (
                <div className="w-full px-4 sm:px-4 sm:px-6 lg:px-4 sm:px-6 lg:px-8 py-2 sm:py-3 border rounded-lg sm:rounded-lg sm:rounded-xl bg-yellow-50 dark:bg-yellow-900/20 border-yellow-300 dark:border-yellow-700 text-yellow-800 dark:text-yellow-300 text-sm sm:text-sm sm:text-base">
                  ⚠️ Xodimlar topilmadi. Iltimos, avval xodim qo'shing.
                </div>
              ) : (
                <select
                  value={formData.assignedTo}
                  onChange={(e) => setFormData({ ...formData, assignedTo: e.target.value })}
                  className="w-full px-4 sm:px-4 sm:px-6 lg:px-4 sm:px-6 lg:px-8 py-2 sm:py-2.5 border rounded-lg sm:rounded-lg sm:rounded-xl dark:bg-gray-800 dark:border-gray-700"
                  required
                >
                  <option value="">Tanlanmagan</option>
                  {staffList.map(staff => (
                    <option key={staff.id} value={staff.id}>
                      {staff.first_name} {staff.last_name} ({staff.role})
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div>
              <label className="block text-sm sm:text-sm sm:text-base font-semibold mb-2">Muddat</label>
              <input
                type="datetime-local"
                value={formData.dueDate}
                onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                className="w-full px-4 sm:px-4 sm:px-6 lg:px-4 sm:px-6 lg:px-8 py-2 sm:py-2.5 border rounded-lg sm:rounded-lg sm:rounded-xl dark:bg-gray-800 dark:border-gray-700"
              />
            </div>

            <div>
              <label className="block text-sm sm:text-sm sm:text-base font-semibold mb-2">Joylashuv</label>
              <input
                type="text"
                value={formData.locationDetails}
                onChange={(e) => setFormData({ ...formData, locationDetails: e.target.value })}
                className="w-full px-4 sm:px-4 sm:px-6 lg:px-4 sm:px-6 lg:px-8 py-2 sm:py-2.5 border rounded-lg sm:rounded-lg sm:rounded-xl dark:bg-gray-800 dark:border-gray-700"
                placeholder="Masalan: 3-qavat, 305-xona"
              />
            </div>

            <div className="flex gap-2 sm:gap-3 pt-4">
              <button
                type="submit"
                className="flex-1 px-4 sm:px-6 lg:px-4 sm:px-6 lg:px-8 py-2 sm:py-3 bg-primary text-white rounded-lg sm:rounded-lg sm:rounded-xl font-semibold hover:bg-primary/90"
              >
                Yaratish
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowCreateModal(false);
                  resetForm();
                }}
                className="px-4 sm:px-6 lg:px-4 sm:px-6 lg:px-8 py-2 sm:py-3 bg-gray-200 dark:bg-gray-700 rounded-lg sm:rounded-lg sm:rounded-xl font-semibold hover:bg-gray-300 dark:hover:bg-gray-600"
              >
                Bekor qilish
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Verify Modal */}
      {showVerifyModal && selectedTask && (
        <Modal
          isOpen={showVerifyModal}
          onClose={() => {
            setShowVerifyModal(false);
            setVerificationNotes('');
            setSelectedTask(null);
          }}
          title="Vazifani Tasdiqlash"
        >
          <div className="space-y-3 sm:space-y-4">
            <div className="bg-green-50 dark:bg-green-900/20 p-3 sm:p-4 rounded-lg sm:rounded-lg sm:rounded-xl">
              <p className="font-semibold">{selectedTask.title}</p>
              <p className="text-sm sm:text-sm sm:text-base text-gray-600 dark:text-gray-400 mt-1">
                {selectedTask.first_name} {selectedTask.last_name}
              </p>
            </div>

            <div>
              <label className="block text-sm sm:text-sm sm:text-base font-semibold mb-2">Izoh (ixtiyoriy)</label>
              <textarea
                value={verificationNotes}
                onChange={(e) => setVerificationNotes(e.target.value)}
                className="w-full px-4 sm:px-4 sm:px-6 lg:px-4 sm:px-6 lg:px-8 py-2 sm:py-2.5 border rounded-lg sm:rounded-lg sm:rounded-xl dark:bg-gray-800 dark:border-gray-700"
                rows="3"
                placeholder="Tasdiqlash izohi..."
              />
            </div>

            <div className="flex gap-2 sm:gap-3">
              <button
                onClick={handleVerifyTask}
                className="flex-1 px-4 sm:px-6 lg:px-4 sm:px-6 lg:px-8 py-2 sm:py-3 bg-green-500 text-white rounded-lg sm:rounded-lg sm:rounded-xl font-semibold hover:bg-green-600"
              >
                Tasdiqlash
              </button>
              <button
                onClick={() => {
                  setShowVerifyModal(false);
                  setVerificationNotes('');
                  setSelectedTask(null);
                }}
                className="px-4 sm:px-6 lg:px-4 sm:px-6 lg:px-8 py-2 sm:py-3 bg-gray-200 dark:bg-gray-700 rounded-lg sm:rounded-lg sm:rounded-xl font-semibold"
              >
                Bekor qilish
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Reject Modal */}
      {showRejectModal && selectedTask && (
        <Modal
          isOpen={showRejectModal}
          onClose={() => {
            setShowRejectModal(false);
            setRejectionReason('');
            setSelectedTask(null);
          }}
          title="Vazifani Qaytarish"
        >
          <div className="space-y-3 sm:space-y-4">
            <div className="bg-orange-50 dark:bg-orange-900/20 p-3 sm:p-4 rounded-lg sm:rounded-lg sm:rounded-xl">
              <p className="font-semibold">{selectedTask.title}</p>
              <p className="text-sm sm:text-sm sm:text-base text-gray-600 dark:text-gray-400 mt-1">
                {selectedTask.first_name} {selectedTask.last_name}
              </p>
            </div>

            <div>
              <label className="block text-sm sm:text-sm sm:text-base font-semibold mb-2">Sabab *</label>
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                className="w-full px-4 sm:px-4 sm:px-6 lg:px-4 sm:px-6 lg:px-8 py-2 sm:py-2.5 border rounded-lg sm:rounded-lg sm:rounded-xl dark:bg-gray-800 dark:border-gray-700"
                rows="3"
                placeholder="Nima uchun qaytarilmoqda..."
                required
              />
            </div>

            <div className="flex gap-2 sm:gap-3">
              <button
                onClick={handleRejectTask}
                className="flex-1 px-4 sm:px-6 lg:px-4 sm:px-6 lg:px-8 py-2 sm:py-3 bg-orange-500 text-white rounded-lg sm:rounded-lg sm:rounded-xl font-semibold hover:bg-orange-600"
              >
                Qaytarish
              </button>
              <button
                onClick={() => {
                  setShowRejectModal(false);
                  setRejectionReason('');
                  setSelectedTask(null);
                }}
                className="px-4 sm:px-6 lg:px-4 sm:px-6 lg:px-8 py-2 sm:py-3 bg-gray-200 dark:bg-gray-700 rounded-lg sm:rounded-lg sm:rounded-xl font-semibold"
              >
                Bekor qilish
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
