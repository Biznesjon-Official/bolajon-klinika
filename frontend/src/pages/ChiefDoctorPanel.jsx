import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import diseaseService from '../services/diseaseService';
import toast, { Toaster } from 'react-hot-toast';
import DateInput from '../components/DateInput';

export default function ChiefDoctorPanel() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');
  
  // Dashboard data
  const [stats, setStats] = useState({
    staff: { total: 0, present: 0, absent: 0, on_leave: 0 },
    patients: { total: 0, new_today: 0 },
    finance: { today_revenue: 0 },
    tasks: { pending: 0, completed_today: 0 },
    on_duty_doctors: []
  });
  
  // Staff activity
  const [staffActivity, setStaffActivity] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedRole, setSelectedRole] = useState('all');
  
  // On-duty doctors
  const [onDutySchedule, setOnDutySchedule] = useState([]);
  const [availableDoctors, setAvailableDoctors] = useState([]);
  const [showAddDutyModal, setShowAddDutyModal] = useState(false);
  const [dutyForm, setDutyForm] = useState({
    doctor_id: '',
    shift_date: new Date().toISOString().split('T')[0],
    shift_type: 'morning',
    start_time: '09:00',
    end_time: '18:00',
    notes: ''
  });
  
  // My tasks
  const [myTasks, setMyTasks] = useState([]);
  const [tasksLoading, setTasksLoading] = useState(false);

  // Diseases
  const [diseases, setDiseases] = useState([]);
  const [diseaseSearch, setDiseaseSearch] = useState('');
  const [showDiseaseModal, setShowDiseaseModal] = useState(false);
  const [editingDisease, setEditingDisease] = useState(null);
  const [diseaseForm, setDiseaseForm] = useState({
    name: '', category: '', diagnoses: [], recommendations: [], can_be_secondary: true
  });
  const [newDiagnosis, setNewDiagnosis] = useState('');
  const [newRecommendation, setNewRecommendation] = useState('');

  useEffect(() => {
    loadData();
  }, [activeTab, selectedDate, selectedRole, diseaseSearch]);

  const loadData = async () => {
    try {
      setLoading(true);
      
      if (activeTab === 'dashboard') {
        const response = await api.get('/chief-doctor/dashboard');
        if (response.data.success) {
          setStats(response.data.data);
        }
      } else if (activeTab === 'staff-activity') {
        const response = await api.get('/chief-doctor/staff-activity', {
          params: { date: selectedDate, role: selectedRole }
        });
        if (response.data.success) {
          setStaffActivity(response.data.data);
        }
      } else if (activeTab === 'on-duty') {
        const [scheduleRes, doctorsRes] = await Promise.all([
          api.get('/chief-doctor/on-duty-schedule'),
          api.get('/chief-doctor/available-doctors')
        ]);
        if (scheduleRes.data.success) {
          setOnDutySchedule(scheduleRes.data.data);
        }
        if (doctorsRes.data.success) {
          setAvailableDoctors(doctorsRes.data.data);
        }
      } else if (activeTab === 'my-tasks') {
        setTasksLoading(true);
        const response = await api.get('/tasks/my-tasks');
        if (response.data.success) {
          setMyTasks(response.data.data || []);
        }
        setTasksLoading(false);
      } else if (activeTab === 'diseases') {
        const response = await diseaseService.getAll({ search: diseaseSearch });
        if (response.success) {
          setDiseases(response.data);
        }
      }
    } catch (error) {
      console.error('Load data error:', error);
      toast.error('Ma\'lumotlarni yuklashda xatolik');
    } finally {
      setLoading(false);
    }
  };

  // Disease handlers
  const resetDiseaseForm = () => {
    setDiseaseForm({ name: '', category: '', diagnoses: [], recommendations: [], can_be_secondary: true })
    setNewDiagnosis('')
    setNewRecommendation('')
    setEditingDisease(null)
  }

  const handleOpenDiseaseModal = (disease = null) => {
    if (disease) {
      setEditingDisease(disease)
      setDiseaseForm({
        name: disease.name,
        category: disease.category || '',
        diagnoses: disease.diagnoses || [],
        recommendations: disease.recommendations || [],
        can_be_secondary: disease.can_be_secondary !== false
      })
    } else {
      resetDiseaseForm()
    }
    setShowDiseaseModal(true)
  }

  const handleAddDiagnosis = () => {
    if (!newDiagnosis.trim()) return
    setDiseaseForm(prev => ({
      ...prev,
      diagnoses: [...prev.diagnoses, { text: newDiagnosis.trim(), is_default: true }]
    }))
    setNewDiagnosis('')
  }

  const handleAddRecommendation = () => {
    if (!newRecommendation.trim()) return
    setDiseaseForm(prev => ({
      ...prev,
      recommendations: [...prev.recommendations, { text: newRecommendation.trim(), is_default: true }]
    }))
    setNewRecommendation('')
  }

  const handleSaveDisease = async () => {
    if (!diseaseForm.name.trim()) return toast.error('Kasallik nomini kiriting')
    try {
      if (editingDisease) {
        await diseaseService.update(editingDisease._id, diseaseForm)
        toast.success('Kasallik yangilandi')
      } else {
        await diseaseService.create(diseaseForm)
        toast.success('Kasallik qo\'shildi')
      }
      setShowDiseaseModal(false)
      resetDiseaseForm()
      loadData()
    } catch (error) {
      toast.error(error.response?.data?.message || 'Xatolik')
    }
  }

  const handleDeleteDisease = async (id) => {
    if (!confirm('Kasallikni o\'chirmoqchimisiz?')) return
    try {
      await diseaseService.delete(id)
      toast.success('O\'chirildi')
      loadData()
    } catch (error) {
      toast.error('Xatolik')
    }
  }

  const handleAddDutyDoctor = async () => {
    try {
      if (!dutyForm.doctor_id) {
        toast.error('Shifokorni tanlang');
        return;
      }

      const response = await api.post('/chief-doctor/on-duty-schedule', dutyForm);
      if (response.data.success) {
        toast.success('Navbatdagi shifokor biriktirildi');
        setShowAddDutyModal(false);
        setDutyForm({
          doctor_id: '',
          shift_date: new Date().toISOString().split('T')[0],
          shift_type: 'morning',
          start_time: '09:00',
          end_time: '18:00',
          notes: ''
        });
        loadData();
      }
    } catch (error) {
      console.error('Add duty doctor error:', error);
      toast.error(error.response?.data?.error || 'Xatolik yuz berdi');
    }
  };

  const handleDeleteDutyDoctor = async (id) => {
    if (!confirm('Navbatdagi shifokorni o\'chirmoqchimisiz?')) return;
    
    try {
      const response = await api.delete(`/chief-doctor/on-duty-schedule/${id}`);
      if (response.data.success) {
        toast.success('O\'chirildi');
        loadData();
      }
    } catch (error) {
      console.error('Delete duty doctor error:', error);
      toast.error('Xatolik yuz berdi');
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      present: 'bg-green-100 text-green-700',
      absent: 'bg-red-100 text-red-700',
      late: 'bg-yellow-100 text-yellow-700',
      on_leave: 'bg-blue-100 text-blue-700'
    };
    return colors[status] || 'bg-gray-100 text-gray-700';
  };

  const getStatusText = (status) => {
    const texts = {
      present: 'Ishda',
      absent: 'Yo\'q',
      late: 'Kechikdi',
      on_leave: 'Ta\'tilda'
    };
    return texts[status] || status;
  };

  const getRoleText = (role) => {
    const roles = {
      admin: 'Administrator',
      doctor: 'Shifokor',
      nurse: 'Hamshira',
      laborant: 'Laborant',
      sanitar: 'Tozalovchi',
      receptionist: 'Qabulxona',
      masseur: 'Massajchi',
      speech_therapist: 'Logoped',
      chief_doctor: 'Bosh shifokor'
    };
    return roles[role] || role;
  };

  if (loading && activeTab === 'dashboard') {
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
    <div className="p-3 sm:p-4 sm:p-4 sm:p-6 lg:p-8 space-y-4 sm:space-y-6">
      <Toaster position="top-right" />

      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-indigo-700 rounded-xl sm:rounded-2xl p-4 sm:p-6 text-white shadow-xl">
        <div className="flex items-center gap-3 sm:gap-4">
          <span className="material-symbols-outlined text-5xl">medical_information</span>
          <div>
            <h1 className="text-2xl sm:text-3xl font-black">BOSH SHIFOKOR PANELI</h1>
            <p className="text-base sm:text-lg opacity-90">Xush kelibsiz, {user?.first_name || 'Bosh shifokor'}</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white dark:bg-gray-800 rounded-lg sm:rounded-xl shadow-sm">
        <div className="border-b border-gray-200 dark:border-gray-700">
          <div className="flex gap-2 sm:gap-2 sm:gap-3 px-4 sm:px-4 sm:px-6 lg:px-4 sm:px-6 lg:px-8 overflow-x-auto scrollbar-hide">
            {[
              { id: 'dashboard', label: 'Dashboard', icon: 'dashboard' },
              { id: 'staff-activity', label: 'Xodimlar faoliyati', icon: 'groups' },
              { id: 'on-duty', label: 'Navbatdagi shifokorlar', icon: 'event_available' },
              { id: 'my-tasks', label: 'Mening vazifalarim', icon: 'task_alt' },
              { id: 'diseases', label: 'Kasalliklar', icon: 'medical_information' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 sm:gap-2 sm:gap-3 px-4 sm:px-4 sm:px-6 lg:px-4 sm:px-6 lg:px-8 py-2 sm:py-3 font-semibold border-b-2 transition-colors whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'border-primary text-primary'
                    : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                <span className="material-symbols-outlined">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        <div className="p-4 sm:p-6">
          {activeTab === 'dashboard' && (
            <div className="space-y-4 sm:space-y-6">
              {/* Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg sm:rounded-xl p-4 sm:p-6 text-white">
                  <span className="material-symbols-outlined text-2xl sm:text-3xl mb-2">groups</span>
                  <p className="text-3xl sm:text-4xl font-black">{stats.staff.total}</p>
                  <p className="text-sm sm:text-sm sm:text-base opacity-90">Jami xodimlar</p>
                  <div className="mt-3 text-xs">
                    <p>Ishda: {stats.staff.present} | Yo'q: {stats.staff.absent}</p>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg sm:rounded-xl p-4 sm:p-6 text-white">
                  <span className="material-symbols-outlined text-2xl sm:text-3xl mb-2">person</span>
                  <p className="text-3xl sm:text-4xl font-black">{stats.patients.total}</p>
                  <p className="text-sm sm:text-sm sm:text-base opacity-90">Jami bemorlar</p>
                  <div className="mt-3 text-xs">
                    <p>Bugun yangi: {stats.patients.new_today}</p>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg sm:rounded-xl p-4 sm:p-6 text-white">
                  <span className="material-symbols-outlined text-2xl sm:text-3xl mb-2">task_alt</span>
                  <p className="text-3xl sm:text-4xl font-black">{stats.tasks.pending}</p>
                  <p className="text-sm sm:text-sm sm:text-base opacity-90">Bajarilmagan vazifalar</p>
                  <div className="mt-3 text-xs">
                    <p>Bugun bajarildi: {stats.tasks.completed_today}</p>
                  </div>
                </div>
              </div>

              {/* On-duty doctors today */}
              <div className="bg-white dark:bg-gray-800 rounded-lg sm:rounded-xl border p-4 sm:p-6">
                <h3 className="text-lg sm:text-xl font-bold mb-4">Bugungi navbatdagi shifokorlar</h3>
                {stats.on_duty_doctors.length === 0 ? (
                  <p className="text-gray-600 dark:text-gray-400">Bugun navbatdagi shifokorlar yo'q</p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                    {stats.on_duty_doctors.map(duty => (
                      <div key={duty._id} className="bg-green-50 dark:bg-green-900/20 rounded-lg sm:rounded-lg sm:rounded-xl p-3 sm:p-4">
                        <div className="flex items-center gap-2 sm:gap-3">
                          <div className="size-12 bg-green-100 dark:bg-green-900/40 rounded-full flex items-center justify-center">
                            <span className="material-symbols-outlined text-green-600 dark:text-green-400">person</span>
                          </div>
                          <div>
                            <p className="font-bold">{duty.doctor_id?.first_name} {duty.doctor_id?.last_name}</p>
                            <p className="text-sm sm:text-sm sm:text-base text-gray-600 dark:text-gray-400">{duty.doctor_id?.specialization}</p>
                            <p className="text-xs text-gray-500">{duty.start_time} - {duty.end_time}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'staff-activity' && (
            <div className="space-y-3 sm:space-y-4">
              {/* Filters */}
              <div className="flex flex-wrap gap-3 sm:gap-4">
                <div>
                  <label className="block text-sm sm:text-sm sm:text-base font-semibold mb-2">Sana</label>
                  <DateInput
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="px-4 sm:px-4 sm:px-6 lg:px-4 sm:px-6 lg:px-8 py-2 sm:py-2.5 border rounded-lg sm:rounded-lg sm:rounded-xl dark:bg-gray-900 dark:border-gray-700"
                  />
                </div>
                <div>
                  <label className="block text-sm sm:text-sm sm:text-base font-semibold mb-2">Lavozim</label>
                  <select
                    value={selectedRole}
                    onChange={(e) => setSelectedRole(e.target.value)}
                    className="px-4 sm:px-4 sm:px-6 lg:px-4 sm:px-6 lg:px-8 py-2 sm:py-2.5 border rounded-lg sm:rounded-lg sm:rounded-xl dark:bg-gray-900 dark:border-gray-700"
                  >
                    <option value="all">Barchasi</option>
                    <option value="doctor">Shifokor</option>
                    <option value="nurse">Hamshira</option>
                    <option value="laborant">Laborant</option>
                    <option value="receptionist">Qabulxona</option>
                    <option value="sanitar">Tozalovchi</option>
                  </select>
                </div>
              </div>

              {/* Staff list */}
              {loading ? (
                <div className="text-center py-12">
                  <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
                </div>
              ) : staffActivity.length === 0 ? (
                <p className="text-center py-12 text-gray-600">Xodimlar topilmadi</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                  {staffActivity.map(staff => (
                    <div key={staff._id} className="bg-white dark:bg-gray-800 border rounded-lg sm:rounded-lg sm:rounded-xl p-3 sm:p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-2 sm:gap-3">
                          <div className="size-12 bg-primary/10 rounded-full flex items-center justify-center">
                            <span className="material-symbols-outlined text-primary">person</span>
                          </div>
                          <div>
                            <p className="font-bold">{staff.first_name} {staff.last_name}</p>
                            <p className="text-sm sm:text-sm sm:text-base text-gray-600 dark:text-gray-400">{getRoleText(staff.role)}</p>
                          </div>
                        </div>
                        {staff.attendance && (
                          <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusColor(staff.attendance.status)}`}>
                            {getStatusText(staff.attendance.status)}
                          </span>
                        )}
                      </div>
                      
                      {staff.attendance && (
                        <div className="text-sm sm:text-sm sm:text-base space-y-1 mb-3">
                          {staff.attendance.check_in && (
                            <p><span className="font-semibold">Keldi:</span> {new Date(staff.attendance.check_in).toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' })}</p>
                          )}
                          {staff.attendance.check_out && (
                            <p><span className="font-semibold">Ketdi:</span> {new Date(staff.attendance.check_out).toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' })}</p>
                          )}
                        </div>
                      )}
                      
                      <div className="bg-gray-50 dark:bg-gray-900 rounded-lg sm:rounded-lg sm:rounded-xl p-3">
                        <p className="text-sm sm:text-sm sm:text-base font-semibold mb-1">Vazifalar</p>
                        <div className="flex gap-3 sm:gap-4 text-sm sm:text-sm sm:text-base">
                          <span>Jami: {staff.tasks.total}</span>
                          <span className="text-green-600">Bajarildi: {staff.tasks.completed}</span>
                          <span className="text-yellow-600">Kutilmoqda: {staff.tasks.pending}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'on-duty' && (
            <div className="space-y-3 sm:space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg sm:text-xl font-bold">Navbatdagi shifokorlar jadvali</h3>
                <button
                  onClick={() => setShowAddDutyModal(true)}
                  className="px-4 sm:px-4 sm:px-6 lg:px-4 sm:px-6 lg:px-8 py-2 sm:py-2.5 bg-primary text-white rounded-lg sm:rounded-lg sm:rounded-xl hover:bg-primary/90 flex items-center gap-2 sm:gap-2 sm:gap-3"
                >
                  <span className="material-symbols-outlined">add</span>
                  Shifokor biriktirish
                </button>
              </div>

              {loading ? (
                <div className="text-center py-12">
                  <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
                </div>
              ) : onDutySchedule.length === 0 ? (
                <p className="text-center py-12 text-gray-600">Navbatdagi shifokorlar yo'q</p>
              ) : (
                <div className="space-y-2 sm:space-y-3">
                  {onDutySchedule.map(duty => (
                    <div key={duty._id} className="bg-white dark:bg-gray-800 border rounded-lg sm:rounded-lg sm:rounded-xl p-3 sm:p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3 sm:gap-4">
                          <div className="size-14 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center">
                            <span className="material-symbols-outlined text-green-600 dark:text-green-400 text-xl sm:text-2xl">person</span>
                          </div>
                          <div>
                            <p className="font-bold text-base sm:text-lg">{duty.doctor_id?.first_name} {duty.doctor_id?.last_name}</p>
                            <p className="text-sm sm:text-sm sm:text-base text-gray-600 dark:text-gray-400">{duty.doctor_id?.specialization}</p>
                            <p className="text-sm sm:text-sm sm:text-base text-gray-500">{duty.doctor_id?.phone}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold">{new Date(duty.shift_date).toLocaleDateString('uz-UZ')}</p>
                          <p className="text-sm sm:text-sm sm:text-base text-gray-600">{duty.start_time} - {duty.end_time}</p>
                          <p className="text-xs text-gray-500 capitalize">{duty.shift_type}</p>
                        </div>
                        <button
                          onClick={() => handleDeleteDutyDoctor(duty._id)}
                          className="px-3 py-2 sm:py-2.5 bg-red-500 text-white rounded-lg sm:rounded-lg sm:rounded-xl hover:bg-red-600"
                        >
                          <span className="material-symbols-outlined">delete</span>
                        </button>
                      </div>
                      {duty.notes && (
                        <p className="mt-3 text-sm sm:text-sm sm:text-base text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-900 p-3 rounded-lg sm:rounded-lg sm:rounded-xl">
                          {duty.notes}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'diseases' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <h3 className="text-lg sm:text-xl font-bold">Kasalliklar bazasi</h3>
                <div className="flex gap-2">
                  <div className="relative flex-1 sm:w-64">
                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-lg">search</span>
                    <input
                      type="text"
                      value={diseaseSearch}
                      onChange={(e) => setDiseaseSearch(e.target.value)}
                      placeholder="Kasallik qidirish..."
                      className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                  <button
                    onClick={() => handleOpenDiseaseModal()}
                    className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-semibold hover:opacity-90 flex items-center gap-2 whitespace-nowrap"
                  >
                    <span className="material-symbols-outlined text-sm">add</span>
                    Yangi kasallik
                  </button>
                </div>
              </div>

              {diseases.length === 0 ? (
                <div className="text-center py-12">
                  <span className="material-symbols-outlined text-6xl text-gray-300 mb-4 block">medical_information</span>
                  <p className="text-gray-500">Kasalliklar topilmadi</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {diseases.map(disease => (
                    <div key={disease._id} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h4 className="font-bold text-gray-900 dark:text-white">{disease.name}</h4>
                          {disease.category && (
                            <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 rounded-full">{disease.category}</span>
                          )}
                        </div>
                        <div className="flex gap-1">
                          <button onClick={() => handleOpenDiseaseModal(disease)} className="p-1.5 text-gray-400 hover:text-blue-500 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20">
                            <span className="material-symbols-outlined text-lg">edit</span>
                          </button>
                          <button onClick={() => handleDeleteDisease(disease._id)} className="p-1.5 text-gray-400 hover:text-red-500 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20">
                            <span className="material-symbols-outlined text-lg">delete</span>
                          </button>
                        </div>
                      </div>
                      {disease.diagnoses?.length > 0 && (
                        <div className="mb-2">
                          <p className="text-xs font-semibold text-gray-500 mb-1">Tashxislar ({disease.diagnoses.length})</p>
                          <div className="flex flex-wrap gap-1">
                            {disease.diagnoses.slice(0, 3).map((d, i) => (
                              <span key={i} className="text-xs px-2 py-0.5 bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400 rounded">{d.text}</span>
                            ))}
                            {disease.diagnoses.length > 3 && <span className="text-xs text-gray-400">+{disease.diagnoses.length - 3}</span>}
                          </div>
                        </div>
                      )}
                      {disease.recommendations?.length > 0 && (
                        <div>
                          <p className="text-xs font-semibold text-gray-500 mb-1">Maslahatlar ({disease.recommendations.length})</p>
                          <div className="flex flex-wrap gap-1">
                            {disease.recommendations.slice(0, 2).map((r, i) => (
                              <span key={i} className="text-xs px-2 py-0.5 bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400 rounded">{r.text}</span>
                            ))}
                            {disease.recommendations.length > 2 && <span className="text-xs text-gray-400">+{disease.recommendations.length - 2}</span>}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'my-tasks' && (
            <div className="space-y-3 sm:space-y-4">
              <h3 className="text-lg sm:text-xl font-bold">Mening vazifalarim</h3>
              
              {tasksLoading ? (
                <div className="text-center py-12">
                  <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
                </div>
              ) : myTasks.length === 0 ? (
                <div className="text-center py-12">
                  <span className="material-symbols-outlined text-6xl text-gray-300 mb-4">task_alt</span>
                  <p className="text-gray-600 dark:text-gray-400">Vazifalar yo'q</p>
                </div>
              ) : (
                <div className="space-y-2 sm:space-y-3">
                  {myTasks.map(task => (
                    <div key={task._id} className="bg-white dark:bg-gray-800 border rounded-lg sm:rounded-lg sm:rounded-xl p-3 sm:p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <h4 className="font-bold text-base sm:text-lg mb-1">{task.title}</h4>
                          {task.description && (
                            <p className="text-sm sm:text-sm sm:text-base text-gray-600 dark:text-gray-400 mb-2">{task.description}</p>
                          )}
                          <div className="flex flex-wrap gap-2 sm:gap-2 sm:gap-3 text-xs">
                            <span className={`px-2 py-1 rounded-full font-semibold ${
                              task.priority === 'high' ? 'bg-red-100 text-red-700' :
                              task.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                              'bg-green-100 text-green-700'
                            }`}>
                              {task.priority === 'high' ? 'Yuqori' : task.priority === 'medium' ? 'O\'rta' : 'Past'}
                            </span>
                            <span className={`px-2 py-1 rounded-full font-semibold ${
                              task.status === 'completed' ? 'bg-green-100 text-green-700' :
                              task.status === 'in_progress' ? 'bg-blue-100 text-blue-700' :
                              'bg-gray-100 text-gray-700'
                            }`}>
                              {task.status === 'completed' ? 'Bajarildi' : 
                               task.status === 'in_progress' ? 'Jarayonda' : 'Kutilmoqda'}
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between text-sm sm:text-sm sm:text-base text-gray-500">
                        <div className="flex items-center gap-3 sm:gap-4">
                          {task.due_date && (
                            <span className="flex items-center gap-1">
                              <span className="material-symbols-outlined text-sm sm:text-base">event</span>
                              {new Date(task.due_date).toLocaleDateString('uz-UZ')}
                            </span>
                          )}
                          {task.assigned_by && (
                            <span className="flex items-center gap-1">
                              <span className="material-symbols-outlined text-sm sm:text-base">person</span>
                              {task.assigned_by.first_name} {task.assigned_by.last_name}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Disease Modal */}
      {showDiseaseModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-3 sm:p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl sm:rounded-2xl p-4 sm:p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg sm:text-xl font-bold">{editingDisease ? 'Kasallikni tahrirlash' : 'Yangi kasallik'}</h3>
              <button onClick={() => { setShowDiseaseModal(false); resetDiseaseForm() }} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold mb-1">Kasallik nomi *</label>
                <input
                  type="text"
                  value={diseaseForm.name}
                  onChange={(e) => setDiseaseForm(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="Masalan: ORVI, Bronxit, Pnevmoniya..."
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1">Kategoriya</label>
                <input
                  type="text"
                  value={diseaseForm.category}
                  onChange={(e) => setDiseaseForm(prev => ({ ...prev, category: e.target.value }))}
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="Masalan: Nafas yo'llari, Yurak, Oshqozon..."
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={diseaseForm.can_be_secondary}
                  onChange={(e) => setDiseaseForm(prev => ({ ...prev, can_be_secondary: e.target.checked }))}
                  className="w-4 h-4 accent-primary"
                />
                <label className="text-sm">Yondosh kasallik sifatida ishlatilsin</label>
              </div>

              {/* Tashxislar */}
              <div>
                <label className="block text-sm font-semibold mb-2">Tashxislar</label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={newDiagnosis}
                    onChange={(e) => setNewDiagnosis(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddDiagnosis())}
                    className="flex-1 px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="Tashxis matni..."
                  />
                  <button onClick={handleAddDiagnosis} className="px-3 py-2 bg-green-500 text-white rounded-lg text-sm font-semibold hover:bg-green-600">
                    <span className="material-symbols-outlined text-sm">add</span>
                  </button>
                </div>
                <div className="space-y-1 max-h-32 overflow-y-auto">
                  {diseaseForm.diagnoses.map((d, i) => (
                    <div key={i} className="flex items-center justify-between px-3 py-1.5 bg-green-50 dark:bg-green-900/20 rounded-lg">
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={d.is_default}
                          onChange={() => {
                            const updated = [...diseaseForm.diagnoses]
                            updated[i] = { ...updated[i], is_default: !updated[i].is_default }
                            setDiseaseForm(prev => ({ ...prev, diagnoses: updated }))
                          }}
                          className="w-3.5 h-3.5 accent-green-500"
                        />
                        <span className="text-sm">{d.text}</span>
                      </div>
                      <button onClick={() => setDiseaseForm(prev => ({ ...prev, diagnoses: prev.diagnoses.filter((_, idx) => idx !== i) }))} className="text-red-400 hover:text-red-600">
                        <span className="material-symbols-outlined text-sm">close</span>
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Maslahatlar */}
              <div>
                <label className="block text-sm font-semibold mb-2">Maslahatlar</label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={newRecommendation}
                    onChange={(e) => setNewRecommendation(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddRecommendation())}
                    className="flex-1 px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="Maslahat matni..."
                  />
                  <button onClick={handleAddRecommendation} className="px-3 py-2 bg-amber-500 text-white rounded-lg text-sm font-semibold hover:bg-amber-600">
                    <span className="material-symbols-outlined text-sm">add</span>
                  </button>
                </div>
                <div className="space-y-1 max-h-32 overflow-y-auto">
                  {diseaseForm.recommendations.map((r, i) => (
                    <div key={i} className="flex items-center justify-between px-3 py-1.5 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={r.is_default}
                          onChange={() => {
                            const updated = [...diseaseForm.recommendations]
                            updated[i] = { ...updated[i], is_default: !updated[i].is_default }
                            setDiseaseForm(prev => ({ ...prev, recommendations: updated }))
                          }}
                          className="w-3.5 h-3.5 accent-amber-500"
                        />
                        <span className="text-sm">{r.text}</span>
                      </div>
                      <button onClick={() => setDiseaseForm(prev => ({ ...prev, recommendations: prev.recommendations.filter((_, idx) => idx !== i) }))} className="text-red-400 hover:text-red-600">
                        <span className="material-symbols-outlined text-sm">close</span>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button onClick={() => { setShowDiseaseModal(false); resetDiseaseForm() }} className="flex-1 py-2.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg font-semibold hover:bg-gray-200">
                Bekor qilish
              </button>
              <button onClick={handleSaveDisease} className="flex-1 py-2.5 bg-primary text-white rounded-lg font-semibold hover:opacity-90">
                {editingDisease ? 'Yangilash' : 'Saqlash'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Duty Doctor Modal */}
      {showAddDutyModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-3 sm:p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl sm:rounded-2xl p-4 sm:p-6 max-w-sm sm:max-w-md w-full">
            <h3 className="text-lg sm:text-xl font-bold mb-4">Navbatdagi shifokor biriktirish</h3>
            <div className="space-y-3 sm:space-y-4">
              <div>
                <label className="block text-sm sm:text-sm sm:text-base font-semibold mb-2">Shifokor *</label>
                <select
                  value={dutyForm.doctor_id}
                  onChange={(e) => setDutyForm({ ...dutyForm, doctor_id: e.target.value })}
                  className="w-full px-4 sm:px-4 sm:px-6 lg:px-4 sm:px-6 lg:px-8 py-2 sm:py-3 border rounded-lg sm:rounded-lg sm:rounded-xl dark:bg-gray-900 dark:border-gray-700"
                  required
                >
                  <option value="">Shifokorni tanlang...</option>
                  {availableDoctors.map(doctor => (
                    <option key={doctor._id} value={doctor._id}>
                      {doctor.first_name} {doctor.last_name} - {doctor.specialization}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm sm:text-sm sm:text-base font-semibold mb-2">Sana *</label>
                <DateInput
                  value={dutyForm.shift_date}
                  onChange={(e) => setDutyForm({ ...dutyForm, shift_date: e.target.value })}
                  className="w-full px-4 sm:px-4 sm:px-6 lg:px-4 sm:px-6 lg:px-8 py-2 sm:py-3 border rounded-lg sm:rounded-lg sm:rounded-xl dark:bg-gray-900 dark:border-gray-700"
                  required
                />
              </div>

              <div>
                <label className="block text-sm sm:text-sm sm:text-base font-semibold mb-2">Smena turi *</label>
                <select
                  value={dutyForm.shift_type}
                  onChange={(e) => setDutyForm({ ...dutyForm, shift_type: e.target.value })}
                  className="w-full px-4 sm:px-4 sm:px-6 lg:px-4 sm:px-6 lg:px-8 py-2 sm:py-3 border rounded-lg sm:rounded-lg sm:rounded-xl dark:bg-gray-900 dark:border-gray-700"
                >
                  <option value="morning">Ertalabki</option>
                  <option value="evening">Kechki</option>
                  <option value="night">Tungi</option>
                  <option value="full_day">Kun bo'yi</option>
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <label className="block text-sm sm:text-sm sm:text-base font-semibold mb-2">Boshlanish *</label>
                  <input
                    type="time"
                    value={dutyForm.start_time}
                    onChange={(e) => setDutyForm({ ...dutyForm, start_time: e.target.value })}
                    className="w-full px-4 sm:px-4 sm:px-6 lg:px-4 sm:px-6 lg:px-8 py-2 sm:py-3 border rounded-lg sm:rounded-lg sm:rounded-xl dark:bg-gray-900 dark:border-gray-700"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm sm:text-sm sm:text-base font-semibold mb-2">Tugash *</label>
                  <input
                    type="time"
                    value={dutyForm.end_time}
                    onChange={(e) => setDutyForm({ ...dutyForm, end_time: e.target.value })}
                    className="w-full px-4 sm:px-4 sm:px-6 lg:px-4 sm:px-6 lg:px-8 py-2 sm:py-3 border rounded-lg sm:rounded-lg sm:rounded-xl dark:bg-gray-900 dark:border-gray-700"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm sm:text-sm sm:text-base font-semibold mb-2">Izoh</label>
                <textarea
                  value={dutyForm.notes}
                  onChange={(e) => setDutyForm({ ...dutyForm, notes: e.target.value })}
                  className="w-full px-4 sm:px-4 sm:px-6 lg:px-4 sm:px-6 lg:px-8 py-2 sm:py-3 border rounded-lg sm:rounded-lg sm:rounded-xl dark:bg-gray-900 dark:border-gray-700"
                  rows="3"
                  placeholder="Izoh yozing..."
                />
              </div>

              <div className="flex gap-2 sm:gap-3">
                <button
                  onClick={() => setShowAddDutyModal(false)}
                  className="flex-1 px-4 sm:px-4 sm:px-6 lg:px-4 sm:px-6 lg:px-8 py-2 sm:py-3 border rounded-lg sm:rounded-lg sm:rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  Bekor qilish
                </button>
                <button
                  onClick={handleAddDutyDoctor}
                  className="flex-1 px-4 sm:px-4 sm:px-6 lg:px-4 sm:px-6 lg:px-8 py-2 sm:py-3 bg-primary text-white rounded-lg sm:rounded-lg sm:rounded-xl hover:bg-primary/90"
                >
                  Biriktirish
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

