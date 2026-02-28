import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import staffService from '../services/staffService';
import payrollService from '../services/payrollService';
import Modal from '../components/Modal';
import AlertModal from '../components/AlertModal';
import ConfirmModal from '../components/ConfirmModal';
import PhoneInput from '../components/PhoneInput';
import DateInput from '../components/DateInput';

const StaffManagementAdvanced = () => {
  const { t } = useTranslation();

  const [activeTab, setActiveTab] = useState('xodimlar') // 'xodimlar' | 'maoshlar'

  const [loading, setLoading] = useState(true);
  const [staff, setStaff] = useState([]);
  const [roles, setRoles] = useState([]);
  const [filterRole, setFilterRole] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');

  // Payroll states
  const [payrollLoading, setPayrollLoading] = useState(false)
  const [payrollCalcLoading, setPayrollCalcLoading] = useState(false)
  const [monthlyPayroll, setMonthlyPayroll] = useState([])
  const [payrollMonth, setPayrollMonth] = useState(new Date().getMonth() + 1)
  const [payrollYear, setPayrollYear] = useState(new Date().getFullYear())
  
  // Alert and Confirm modals
  const [alertModal, setAlertModal] = useState({ isOpen: false, title: '', message: '', type: 'info' });
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, title: '', message: '', onConfirm: null });

  const showAlert = (message, type = 'info', title = '') => {
    setAlertModal({ isOpen: true, title, message, type });
  };

  const showConfirm = (message, onConfirm, options = {}) => {
    setConfirmModal({ 
      isOpen: true, 
      title: options.title || 'Tasdiqlash',
      message, 
      onConfirm,
      type: options.type || 'warning',
      confirmText: options.confirmText || 'Tasdiqlash',
      cancelText: options.cancelText || 'Bekor qilish'
    });
  };
  
  // Modal states
  const [showStaffModal, setShowStaffModal] = useState(false);
  const [currentStep, setCurrentStep] = useState(1); // Stepper uchun
  const [editingStaff, setEditingStaff] = useState(null);
  const [showPassword, setShowPassword] = useState(false); // Parolni ko'rish/yashirish
  const [staffForm, setStaffForm] = useState({
    username: '',
    password: '',
    email: '',
    role_id: '',
    first_name: '',
    last_name: '',
    middle_name: '',
    phone: '+998',
    specialization: '',
    license_number: '',
    hire_date: new Date().toISOString().split('T')[0],
    salary: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (activeTab === 'maoshlar') loadPayroll()
  }, [activeTab, payrollMonth, payrollYear])

  const loadPayroll = async () => {
    try {
      setPayrollLoading(true)
      const res = await payrollService.getMonthlyPayroll({ month: payrollMonth, year: payrollYear })
      setMonthlyPayroll(res.data || [])
    } catch {
      setMonthlyPayroll([])
    } finally {
      setPayrollLoading(false)
    }
  }

  const handleCalculatePayroll = async () => {
    try {
      setPayrollCalcLoading(true)
      await payrollService.calculateMonthly({ month: payrollMonth, year: payrollYear })
      await loadPayroll()
    } catch (err) {
      showAlert(err.response?.data?.message || 'Hisoblashda xatolik', 'error', 'Xatolik')
    } finally {
      setPayrollCalcLoading(false)
    }
  }

  const handlePayPayroll = async (payrollId) => {
    showConfirm('Maoshni to\'langan deb belgilamoqchimisiz?', async () => {
      try {
        await payrollService.payPayroll(payrollId, { payment_method: 'cash' })
        await loadPayroll()
      } catch (err) {
        showAlert(err.response?.data?.message || 'Xatolik', 'error', 'Xatolik')
      }
    }, { title: 'Maosh to\'lash', confirmText: 'To\'lash' })
  }

  // Role nomlarini o'zbekchaga mapping qilish
  const getRoleDisplayName = (roleName) => {
    const roleNames = {
      'admin': 'Administrator',
      'doctor': 'Shifokor',
      'nurse': 'Hamshira',
      'laborant': 'Laborant',
      'sanitar': 'Tozalovchi',
      'masseur': 'Massajchi',
      'speech_therapist': 'Logoped',
      'patient': 'Bemor'
    };
    return roleNames[roleName?.toLowerCase()] || roleName;
  };

  const getRoleNameFromDisplay = (displayName) => {
    const roleMap = {
      'Administrator': 'admin',
      'Shifokor': 'doctor',
      'Hamshira': 'nurse',
      'Laborant': 'laborant',
      'Tozalovchi': 'sanitar',
      'Massajchi': 'masseur',
      'Logoped': 'speech_therapist',
      'Bemor': 'patient'
    };
    return roleMap[displayName] || displayName?.toLowerCase();
  };

  const loadData = async () => {
    try {
      setLoading(true);
      const [staffData, rolesData] = await Promise.all([
        staffService.getStaff(),
        staffService.getRoles()
      ]);
      
      if (staffData.success) setStaff(staffData.data);
      if (rolesData.success) {
        setRoles(rolesData.data);
      }
    } catch (error) {
      console.error('Load data error:', error);
    } finally {
      setLoading(false);
    }
  };

  const openStaffModal = (staffMember = null) => {
    setCurrentStep(1); // Step'ni reset qilish
    if (staffMember) {
      setEditingStaff(staffMember);
      setStaffForm({
        username: staffMember.username || '',
        password: staffMember.password || '',
        email: staffMember.email || '',
        role_id: staffMember.role_id || '',
        first_name: staffMember.first_name || '',
        last_name: staffMember.last_name || '',
        middle_name: staffMember.middle_name || '',
        phone: staffMember.phone || '+998',
        specialization: staffMember.specialization || '',
        license_number: staffMember.license_number || '',
        hire_date: staffMember.hire_date ? staffMember.hire_date.split('T')[0] : '',
        salary: staffMember.salary || ''
      });
    } else {
      setEditingStaff(null);
      setStaffForm({
        username: '',
        password: '',
        email: '',
        role_id: '',
        first_name: '',
        last_name: '',
        middle_name: '',
        phone: '+998',
        specialization: '',
        license_number: '',
        hire_date: new Date().toISOString().split('T')[0],
        salary: ''
      });
    }
    setShowStaffModal(true);
  };

  const handleNextStep = () => {
    // Validate current step before moving to next
    if (currentStep === 1) {
      if (!staffForm.username || !staffForm.password || !staffForm.role_id) {
        showAlert('Iltimos, barcha majburiy maydonlarni to\'ldiring', 'warning', 'Ogohlantirish');
        return;
      }
    } else if (currentStep === 2) {
      if (!staffForm.first_name || !staffForm.last_name || !staffForm.phone) {
        showAlert('Iltimos, barcha majburiy maydonlarni to\'ldiring', 'warning', 'Ogohlantirish');
        return;
      }
    }
    setCurrentStep(currentStep + 1);
  };

  const handlePrevStep = () => {
    setCurrentStep(currentStep - 1);
  };

  const handleStaffSubmit = async (e) => {
    e.preventDefault();
    
    if (editingStaff) {
      // Update staff
      if (!staffForm.first_name || !staffForm.last_name || !staffForm.phone) {
        showAlert('Iltimos, barcha majburiy maydonlarni to\'ldiring', 'warning', 'Ogohlantirish');
        return;
      }

      try {
        const data = {
          email: staffForm.email,
          first_name: staffForm.first_name,
          last_name: staffForm.last_name,
          middle_name: staffForm.middle_name,
          phone: staffForm.phone,
          specialization: staffForm.specialization,
          license_number: staffForm.license_number,
          salary: staffForm.salary ? parseFloat(staffForm.salary) : null
        };

        const response = await staffService.updateStaff(editingStaff.id, data);
        if (response.success) {
          showAlert('Xodim muvaffaqiyatli yangilandi!', 'success', 'Muvaffaqiyatli');
          setShowStaffModal(false);
          loadData();
        }
      } catch (error) {
        console.error('Update staff error:', error);
        showAlert(error.response?.data?.message || 'Xatolik yuz berdi', 'error', 'Xatolik');
      }
    } else {
      // Create staff
      if (!staffForm.username || !staffForm.password || !staffForm.role_id ||
          !staffForm.first_name || !staffForm.last_name || !staffForm.phone) {
        showAlert('Iltimos, barcha majburiy maydonlarni to\'ldiring', 'warning', 'Ogohlantirish');
        return;
      }

      // Shifokor uchun qo'shimcha validatsiya
      const selectedRole = roles.find(r => r.id === parseInt(staffForm.role_id));
      if (selectedRole?.name === 'doctor') {
        if (!staffForm.license_number) {
          showAlert('Shifokor uchun litsenziya raqami majburiy', 'warning', 'Ogohlantirish');
          return;
        }
      }

      try {
        const data = {
          ...staffForm,
          salary: staffForm.salary ? parseFloat(staffForm.salary) : null
        };

        const response = await staffService.createStaff(data);
        
        if (response.success) {
          // Login va parolni ko'rsatish
          const loginInfo = `
Xodim muvaffaqiyatli qo'shildi!

Login: ${staffForm.username}
Parol: ${staffForm.password}

Iltimos, bu ma'lumotlarni saqlang!
          `;
          showAlert(loginInfo, 'success', 'Muvaffaqiyatli');
          setShowStaffModal(false);
          loadData();
        }
      } catch (error) {
        console.error('Create staff error:', error);
        console.error('Error response:', error.response?.data);
        showAlert(error.response?.data?.message || 'Xatolik yuz berdi', 'error', 'Xatolik');
      }
    }
  };

  const handleDeleteStaff = async (staffId) => {
    showConfirm(
      'Ushbu xodimni o\'chirishni tasdiqlaysizmi?',
      async () => {
        try {
          const response = await staffService.deleteStaff(staffId);
          if (response.success) {
            showAlert('Xodim muvaffaqiyatli o\'chirildi!', 'success', 'Muvaffaqiyatli');
            loadData();
          }
        } catch (error) {
          console.error('Delete staff error:', error);
          showAlert('Xatolik yuz berdi', 'error', 'Xatolik');
        }
      },
      {
        title: 'Xodimni o\'chirish',
        type: 'danger',
        confirmText: 'O\'chirish',
        cancelText: 'Bekor qilish'
      }
    );
  };

  const handleToggleStatus = async (staffMember) => {
    try {
      const response = await staffService.updateStaff(staffMember.id, {
        is_active: !staffMember.user_active
      });
      if (response.success) {
        showAlert('Xodim holati o\'zgartirildi!', 'success', 'Muvaffaqiyatli');
        loadData();
      }
    } catch (error) {
      console.error('Toggle status error:', error);
      showAlert('Xatolik yuz berdi', 'error', 'Xatolik');
    }
  };

  const formatCurrency = (amount) => {
    if (!amount) return '-';
    return new Intl.NumberFormat('uz-UZ').format(amount) + ' so\'m';
  };

  const filteredStaff = staff.filter(member => {
    if (filterRole !== 'all' && member.role !== filterRole) return false;
    if (filterStatus === 'active' && !member.user_active) return false;
    if (filterStatus === 'inactive' && member.user_active) return false;
    return true;
  });

  if (loading) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="size-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">{t('common.loading')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white">Xodimlar boshqaruvi</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Jami: {staff.length} ta xodim</p>
        </div>
        {activeTab === 'xodimlar' && (
          <button
            onClick={() => openStaffModal()}
            className="px-4 py-2 sm:py-2.5 bg-primary text-white rounded-lg text-sm font-semibold hover:opacity-90 flex items-center gap-2"
          >
            <span className="material-symbols-outlined">add</span>
            Xodim qo'shish
          </button>
        )}
        {activeTab === 'maoshlar' && (
          <button
            onClick={handleCalculatePayroll}
            disabled={payrollCalcLoading}
            className="px-4 py-2 sm:py-2.5 bg-primary text-white rounded-lg text-sm font-semibold hover:opacity-90 flex items-center gap-2 disabled:opacity-50"
          >
            <span className="material-symbols-outlined">calculate</span>
            {payrollCalcLoading ? 'Hisoblanmoqda...' : 'Hisoblash'}
          </button>
        )}
      </div>

      {/* Tab buttons */}
      <div className="flex gap-2 bg-gray-100 dark:bg-gray-800 rounded-xl p-1 w-fit">
        {[
          { key: 'xodimlar', label: 'Xodimlar', icon: 'badge' },
          { key: 'maoshlar', label: 'Maoshlar', icon: 'payments' }
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
              activeTab === tab.key
                ? 'bg-white dark:bg-gray-700 text-primary shadow'
                : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            <span className="material-symbols-outlined text-base">{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── XODIMLAR TAB ── */}
      {activeTab === 'xodimlar' && (<>
      {/* Filters */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-3 sm:p-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Lavozim</label>
            <select
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
              className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm"
            >
              <option value="all">Barchasi</option>
              {roles.map(role => (
                <option key={role.id} value={role.name}>{role.display_name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Holat</label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm"
            >
              <option value="all">Barchasi</option>
              <option value="active">Faol</option>
              <option value="inactive">Nofaol</option>
            </select>
          </div>
        </div>
      </div>

      {/* Staff List */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800">
        {filteredStaff.length === 0 ? (
          <div className="p-12 text-center">
            <span className="material-symbols-outlined text-6xl text-gray-300 dark:text-gray-700 mb-4">
              group
            </span>
            <p className="text-gray-500 dark:text-gray-400">Xodimlar topilmadi</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {filteredStaff.map((member) => (
              <div key={member.id} className="p-3 sm:p-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 sm:gap-4 flex-1">
                    <div className="size-16 bg-primary/10 text-primary rounded-full flex items-center justify-center">
                      <span className="text-xl sm:text-2xl font-black">
                        {member.first_name[0]}{member.last_name[0]}
                      </span>
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-center gap-2 sm:gap-2 sm:gap-3">
                        <p className="font-bold text-gray-900 dark:text-white">
                          {member.first_name} {member.last_name} {member.middle_name}
                        </p>
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          member.user_active
                            ? 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400'
                            : 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400'
                        }`}>
                          {member.user_active ? 'Faol' : 'Nofaol'}
                        </span>
                      </div>
                      <p className="text-sm sm:text-sm sm:text-base text-gray-600 dark:text-gray-400">
                        {getRoleDisplayName(member.role)} {member.specialization && `• ${member.specialization}`}
                      </p>
                      <p className="text-sm sm:text-sm sm:text-base text-gray-500">
                        {member.phone} • {member.email}
                      </p>
                      {/* Login va parol */}
                      {member.username && (
                        <div className="mt-2 flex items-center gap-3 text-sm">
                          <div className="flex items-center gap-1 px-2 py-1 bg-blue-50 dark:bg-blue-900/20 rounded">
                            <span className="material-symbols-outlined text-sm text-blue-600">person</span>
                            <span className="font-mono font-semibold text-blue-700 dark:text-blue-300">{member.username}</span>
                          </div>
                          {member.password && (
                            <div className="flex items-center gap-1 px-2 py-1 bg-purple-50 dark:bg-purple-900/20 rounded">
                              <span className="material-symbols-outlined text-sm text-purple-600">key</span>
                              <span className="font-mono font-semibold text-purple-700 dark:text-purple-300">{member.password}</span>
                            </div>
                          )}
                        </div>
                      )}
                      {member.license_number && (
                        <p className="text-xs text-gray-500">
                          Litsenziya: {member.license_number}
                        </p>
                      )}
                      {member.access_code && (
                        <div className="mt-1 inline-flex items-center gap-2 sm:gap-2 sm:gap-3 px-3 py-1 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg sm:rounded-lg sm:rounded-xl">
                          <span className="material-symbols-outlined text-sm sm:text-sm sm:text-base text-blue-600 dark:text-blue-400">qr_code</span>
                          <span className="text-xs font-mono font-bold text-blue-700 dark:text-blue-300">
                            {member.access_code}
                          </span>
                          <span className="text-xs text-blue-600 dark:text-blue-400">Bot kodi</span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3 sm:gap-4">
                    {member.salary && (
                      <div className="text-right">
                        <p className="text-sm sm:text-sm sm:text-base text-gray-500">Maosh</p>
                        <p className="font-bold text-gray-900 dark:text-white">
                          {formatCurrency(member.salary)}
                        </p>
                      </div>
                    )}
                    
                    <div className="flex gap-2 sm:gap-2 sm:gap-3">
                      <button
                        onClick={() => handleToggleStatus(member)}
                        className={`px-3 py-2 sm:py-2.5 rounded-lg sm:rounded-lg sm:rounded-xl text-sm sm:text-sm sm:text-base font-semibold ${
                          member.user_active
                            ? 'bg-yellow-500 text-white hover:bg-yellow-600'
                            : 'bg-green-500 text-white hover:bg-green-600'
                        }`}
                        title={member.user_active ? 'Faolsizlantirish' : 'Faollashtirish'}
                      >
                        <span className="material-symbols-outlined text-base sm:text-lg">
                          {member.user_active ? 'block' : 'check_circle'}
                        </span>
                      </button>
                      <button
                        onClick={() => openStaffModal(member)}
                        className="px-3 py-2 sm:py-2.5 bg-green-500 text-white rounded-lg sm:rounded-lg sm:rounded-xl text-sm sm:text-sm sm:text-base font-semibold hover:bg-green-600"
                        title="Tahrirlash"
                      >
                        <span className="material-symbols-outlined text-base sm:text-lg">edit</span>
                      </button>
                      <button
                        onClick={() => handleDeleteStaff(member.id)}
                        className="px-3 py-2 sm:py-2.5 bg-red-500 text-white rounded-lg sm:rounded-lg sm:rounded-xl text-sm sm:text-sm sm:text-base font-semibold hover:bg-red-600"
                        title="O'chirish"
                      >
                        <span className="material-symbols-outlined text-base sm:text-lg">delete</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      </>)}

      {/* ── MAOSHLAR TAB ── */}
      {activeTab === 'maoshlar' && (
        <div className="space-y-4">
          {/* Month/year selector */}
          <div className="flex items-center gap-3 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-3">
            <span className="material-symbols-outlined text-gray-400">calendar_month</span>
            <select
              value={payrollMonth}
              onChange={e => setPayrollMonth(Number(e.target.value))}
              className="px-3 py-1.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm"
            >
              {['Yanvar','Fevral','Mart','Aprel','May','Iyun','Iyul','Avgust','Sentabr','Oktabr','Noyabr','Dekabr'].map((m, i) => (
                <option key={i+1} value={i+1}>{m}</option>
              ))}
            </select>
            <select
              value={payrollYear}
              onChange={e => setPayrollYear(Number(e.target.value))}
              className="px-3 py-1.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm"
            >
              {[2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
            </select>
            <span className="text-sm text-gray-400 ml-2">{monthlyPayroll.length} ta yozuv</span>
          </div>

          {/* Payroll table */}
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
            {payrollLoading ? (
              <div className="flex justify-center py-12">
                <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin" />
              </div>
            ) : monthlyPayroll.length === 0 ? (
              <div className="text-center py-16 text-gray-400">
                <span className="material-symbols-outlined text-5xl mb-3">payments</span>
                <p className="text-sm">Bu oy uchun maosh hisoblangan emas</p>
                <button
                  onClick={handleCalculatePayroll}
                  disabled={payrollCalcLoading}
                  className="mt-3 text-sm text-primary hover:underline disabled:opacity-50"
                >
                  Hisoblash tugmasini bosing
                </button>
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead className="bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-300 sticky top-0">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold">Xodim</th>
                    <th className="px-4 py-3 text-left font-semibold">Lavozim</th>
                    <th className="px-4 py-3 text-right font-semibold">Asosiy maosh</th>
                    <th className="px-4 py-3 text-right font-semibold">Bonus</th>
                    <th className="px-4 py-3 text-right font-semibold">Jarima</th>
                    <th className="px-4 py-3 text-right font-semibold">Jami</th>
                    <th className="px-4 py-3 text-center font-semibold">Holat</th>
                    <th className="px-4 py-3 text-center font-semibold">Amal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                  {monthlyPayroll.map(p => (
                    <tr key={p._id} className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                      <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">
                        {p.staff_id?.first_name} {p.staff_id?.last_name}
                      </td>
                      <td className="px-4 py-3 text-gray-500">{getRoleDisplayName(p.staff_id?.role)}</td>
                      <td className="px-4 py-3 text-right">{formatCurrency(p.base_salary)}</td>
                      <td className="px-4 py-3 text-right text-green-600">
                        {p.total_bonuses > 0 ? `+${formatCurrency(p.total_bonuses)}` : '—'}
                      </td>
                      <td className="px-4 py-3 text-right text-red-500">
                        {p.total_penalties > 0 ? `-${formatCurrency(p.total_penalties)}` : '—'}
                      </td>
                      <td className="px-4 py-3 text-right font-bold text-gray-900 dark:text-white">
                        {formatCurrency(p.net_salary)}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                          p.status === 'paid'
                            ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                            : p.status === 'approved'
                            ? 'bg-blue-100 text-blue-700'
                            : 'bg-yellow-100 text-yellow-700'
                        }`}>
                          {p.status === 'paid' ? 'To\'langan' : p.status === 'approved' ? 'Tasdiqlangan' : 'Kutilmoqda'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        {p.status !== 'paid' && (
                          <button
                            onClick={() => handlePayPayroll(p._id)}
                            className="px-3 py-1 bg-primary text-white rounded-lg text-xs font-semibold hover:opacity-90"
                          >
                            To'lash
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* Staff Modal */}
      <Modal 
        isOpen={showStaffModal} 
        onClose={() => setShowStaffModal(false)} 
        size="sm"
        title={editingStaff ? 'Xodimni tahrirlash' : 'Yangi xodim qo\'shish'}
      >
        <form onSubmit={handleStaffSubmit} className="space-y-2 sm:space-y-3">
          {/* Stepper Indicator - Only for new staff */}
          {!editingStaff && (
            <div className="flex items-center justify-center gap-2 sm:gap-2 sm:gap-3 -mt-2 mb-3">
                <div className={`size-9 rounded-lg sm:rounded-xl flex items-center justify-center font-bold transition-all ${
                  currentStep >= 1 
                    ? 'bg-primary text-white shadow-lg scale-110' 
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-400'
                }`}>
                  1
                </div>
                
                <div className={`h-1 w-16 rounded-full transition-all ${
                  currentStep >= 2 ? 'bg-primary' : 'bg-gray-200 dark:bg-gray-700'
                }`}></div>
                
                <div className={`size-9 rounded-lg sm:rounded-xl flex items-center justify-center font-bold transition-all ${
                  currentStep >= 2 
                    ? 'bg-primary text-white shadow-lg scale-110' 
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-400'
                }`}>
                  2
                </div>
                
                <div className={`h-1 w-16 rounded-full transition-all ${
                  currentStep >= 3 ? 'bg-primary' : 'bg-gray-200 dark:bg-gray-700'
                }`}></div>
                
                <div className={`size-9 rounded-lg sm:rounded-xl flex items-center justify-center font-bold transition-all ${
                  currentStep >= 3 
                    ? 'bg-primary text-white shadow-lg scale-110' 
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-400'
                }`}>
                  3
                </div>
              </div>
            )}
      

          {/* Step 1: Login ma'lumotlari - Only for new staff */}
          {!editingStaff && currentStep === 1 && (
            <div className="space-y-2 sm:space-y-3 animate-fadeIn">
              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg sm:rounded-lg sm:rounded-xl p-2">
                <div className="flex items-center gap-2 sm:gap-2 sm:gap-3 text-green-700 dark:text-green-400">
                  <span className="material-symbols-outlined text-sm sm:text-base">info</span>
                  <span className="text-xs font-semibold">Login ma'lumotlari</span>
                </div>
              </div>

              <div className="space-y-2 sm:space-y-3">
                <div className="group">
                  <label className="block text-sm sm:text-sm sm:text-base font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    <span className="flex items-center gap-2 sm:gap-2 sm:gap-3">
                      <span className="material-symbols-outlined text-sm sm:text-base">person</span>
                      Foydalanuvchi nomi <span className="text-red-500">*</span>
                    </span>
                  </label>
                  <input
                    type="text"
                    value={staffForm.username}
                    onChange={(e) => setStaffForm({ ...staffForm, username: e.target.value })}
                    className="w-full px-3 py-2 sm:py-2.5 bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-lg sm:rounded-xl focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all text-sm sm:text-sm sm:text-base"
                    placeholder="username"
                  />
                </div>

                <div className="group">
                  <label className="block text-sm sm:text-sm sm:text-base font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    <span className="flex items-center gap-2 sm:gap-2 sm:gap-3">
                      <span className="material-symbols-outlined text-sm sm:text-base">lock</span>
                      Parol <span className="text-red-500">*</span>
                    </span>
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={staffForm.password}
                      onChange={(e) => setStaffForm({ ...staffForm, password: e.target.value })}
                      className="w-full px-3 py-2 sm:py-2.5 pr-10 bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-lg sm:rounded-xl focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all text-sm sm:text-sm sm:text-base"
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
                    >
                      <span className="material-symbols-outlined text-xl">
                        {showPassword ? 'visibility_off' : 'visibility'}
                      </span>
                    </button>
                  </div>
                </div>
              </div>

              <div className="group">
                <label className="block text-sm sm:text-sm sm:text-base font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  <span className="flex items-center gap-2 sm:gap-2 sm:gap-3">
                    <span className="material-symbols-outlined text-sm sm:text-base">shield_person</span>
                    Tizim roli <span className="text-red-500">*</span>
                  </span>
                </label>
                <select
                  value={staffForm.role_id}
                  onChange={(e) => setStaffForm({ ...staffForm, role_id: e.target.value })}
                  className="w-full px-3 py-2 sm:py-2.5 bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-lg sm:rounded-xl focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all text-sm sm:text-sm sm:text-base"
                >
                  <option value="">Rolni tanlang</option>
                  {roles.map(role => (
                    <option key={role.id} value={role.id}>{role.display_name}</option>
                  ))}
                </select>
              </div>

              <div className="group">
                <label className="block text-sm sm:text-sm sm:text-base font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  <span className="flex items-center gap-2 sm:gap-2 sm:gap-3">
                    <span className="material-symbols-outlined text-sm sm:text-base">badge</span>
                    Lavozim nomi
                  </span>
                </label>
                <input
                  type="text"
                  value={staffForm.specialization}
                  onChange={(e) => setStaffForm({ ...staffForm, specialization: e.target.value })}
                  className="w-full px-3 py-2 sm:py-2.5 bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-lg sm:rounded-xl focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all text-sm sm:text-sm sm:text-base"
                  placeholder="Masalan: Pediatr, Nevropatolog..."
                />
              </div>
            </div>
          )}

          {/* Step 2: Shaxsiy ma'lumotlar */}
          {(!editingStaff && currentStep === 2) || editingStaff ? (
            <div className="space-y-2 sm:space-y-3 animate-fadeIn">
              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg sm:rounded-lg sm:rounded-xl p-2">
                <div className="flex items-center gap-2 sm:gap-2 sm:gap-3 text-green-700 dark:text-green-400">
                  <span className="material-symbols-outlined text-sm sm:text-base">account_circle</span>
                  <span className="text-xs font-semibold">Shaxsiy ma'lumotlar</span>
                </div>
              </div>

              <div className="space-y-2 sm:space-y-3">
                <div className="group">
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                    Ism <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={staffForm.first_name}
                    onChange={(e) => setStaffForm({ ...staffForm, first_name: e.target.value })}
                    className="w-full px-3 py-2 sm:py-2.5 bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-lg sm:rounded-xl focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all text-sm sm:text-sm sm:text-base"
                    placeholder="Ism"
                    required
                  />
                </div>

                <div className="group">
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                    Familiya <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={staffForm.last_name}
                    onChange={(e) => setStaffForm({ ...staffForm, last_name: e.target.value })}
                    className="w-full px-3 py-2 sm:py-2.5 bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-lg sm:rounded-xl focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all text-sm sm:text-sm sm:text-base"
                    placeholder="Familiya"
                    required
                  />
                </div>

                <div className="group">
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                    Otasining ismi
                  </label>
                  <input
                    type="text"
                    value={staffForm.middle_name}
                    onChange={(e) => setStaffForm({ ...staffForm, middle_name: e.target.value })}
                    className="w-full px-3 py-2 sm:py-2.5 bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-lg sm:rounded-xl focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all text-sm sm:text-sm sm:text-base"
                    placeholder="Otasining ismi"
                  />
                </div>
              </div>

              <div className="group">
                <label className="block text-sm sm:text-sm sm:text-base font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  <span className="flex items-center gap-2 sm:gap-2 sm:gap-3">
                    <span className="material-symbols-outlined text-sm sm:text-base">phone</span>
                    Telefon <span className="text-red-500">*</span>
                  </span>
                </label>
                <PhoneInput
                  value={staffForm.phone}
                  onChange={(e) => setStaffForm({ ...staffForm, phone: e.target.value })}
                  className="w-full px-3 py-2 sm:py-2.5 bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-lg sm:rounded-xl focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all text-sm sm:text-sm sm:text-base"
                  placeholder="+998 XX XXX XX XX"
                  required
                />
              </div>
            </div>
          ) : null}

          {/* Step 3: Qo'shimcha ma'lumotlar - Only for new staff */}
          {!editingStaff && currentStep === 3 && (
            <div className="space-y-2 sm:space-y-3 animate-fadeIn">
              <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg sm:rounded-lg sm:rounded-xl p-2">
                <div className="flex items-center gap-2 sm:gap-2 sm:gap-3 text-purple-700 dark:text-purple-400">
                  <span className="material-symbols-outlined text-sm sm:text-base">work</span>
                  <span className="text-xs font-semibold">Qo'shimcha ma'lumotlar</span>
                </div>
              </div>

              {/* Litsenziya raqami - faqat doctor uchun */}
              {(() => {
                const selectedRole = roles.find(r => r.id === parseInt(staffForm.role_id));
                const roleName = selectedRole?.name || '';
                return roleName === 'doctor' && (
                  <div className="group">
                    <label className="block text-sm sm:text-sm sm:text-base font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      <span className="flex items-center gap-2 sm:gap-2 sm:gap-3">
                        <span className="material-symbols-outlined text-sm sm:text-base">verified</span>
                        Litsenziya raqami <span className="text-red-500">*</span>
                      </span>
                    </label>
                    <input
                      type="text"
                      value={staffForm.license_number}
                      onChange={(e) => setStaffForm({ ...staffForm, license_number: e.target.value })}
                      className="w-full px-3 py-2 sm:py-2.5 bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-lg sm:rounded-xl focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all text-sm sm:text-sm sm:text-base"
                      placeholder="LIC-12345"
                      required
                    />
                  </div>
                );
              })()}

              <div className="group">
                <label className="block text-sm sm:text-sm sm:text-base font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  <span className="flex items-center gap-2 sm:gap-2 sm:gap-3">
                    <span className="material-symbols-outlined text-sm sm:text-base">calendar_today</span>
                    Ishga qabul qilingan sana <span className="text-red-500">*</span>
                  </span>
                </label>
                <DateInput
                  value={staffForm.hire_date}
                  onChange={(e) => setStaffForm({ ...staffForm, hire_date: e.target.value })}
                  className="w-full px-3 py-2 sm:py-2.5 bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-lg sm:rounded-xl focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all text-sm sm:text-sm sm:text-base"
                  required
                />
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2 sm:gap-2 sm:gap-3 pt-3 border-t border-gray-200 dark:border-gray-700">
            {/* Bekor qilish button - always visible */}
            <button
              type="button"
              onClick={() => setShowStaffModal(false)}
              className="px-5 py-2 sm:py-2.5 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg sm:rounded-xl font-semibold hover:bg-gray-200 dark:hover:bg-gray-700 transition-all flex items-center gap-2 sm:gap-2 sm:gap-3 text-sm sm:text-sm sm:text-base"
            >
              <span className="material-symbols-outlined text-sm sm:text-base">close</span>
              Bekor qilish
            </button>

            {/* Oldingi button - visible on steps 2 and 3 for new staff */}
            {!editingStaff && currentStep > 1 && (
              <button
                type="button"
                onClick={handlePrevStep}
                className="px-5 py-2 sm:py-2.5 bg-gray-500 text-white rounded-lg sm:rounded-xl font-semibold hover:bg-gray-600 transition-all flex items-center gap-2 sm:gap-2 sm:gap-3 shadow-lg hover:shadow-xl text-sm sm:text-sm sm:text-base"
              >
                <span className="material-symbols-outlined text-sm sm:text-base">arrow_back</span>
                Orqaga
              </button>
            )}

            {/* Keyingi button - visible on steps 1 and 2 for new staff */}
            {!editingStaff && currentStep < 3 && (
              <button
                type="button"
                onClick={handleNextStep}
                className="flex-1 px-5 py-2 sm:py-2.5 bg-gradient-to-r from-primary to-green-600 text-white rounded-lg sm:rounded-xl font-semibold hover:shadow-xl transition-all flex items-center justify-center gap-2 sm:gap-2 sm:gap-3 shadow-lg text-sm sm:text-sm sm:text-base"
              >
                Keyingi
                <span className="material-symbols-outlined text-sm sm:text-base">arrow_forward</span>
              </button>
            )}

            {/* Qo'shish/Saqlash button - visible on step 3 for new staff or always for editing */}
            {(editingStaff || currentStep === 3) && (
              <button
                type="submit"
                className="flex-1 px-5 py-2 sm:py-2.5 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg sm:rounded-xl font-semibold hover:shadow-xl transition-all flex items-center justify-center gap-2 sm:gap-2 sm:gap-3 shadow-lg text-sm sm:text-sm sm:text-base"
              >
                <span className="material-symbols-outlined text-sm sm:text-base">
                  {editingStaff ? 'save' : 'check_circle'}
                </span>
                {editingStaff ? 'Saqlash' : 'Qo\'shish'}
              </button>
            )}
          </div>
        </form>
      </Modal>

      {/* Alert Modal */}
      <AlertModal
        isOpen={alertModal.isOpen}
        onClose={() => setAlertModal({ ...alertModal, isOpen: false })}
        title={alertModal.title}
        message={alertModal.message}
        type={alertModal.type}
      />

      {/* Confirm Modal */}
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal({ ...confirmModal, isOpen: false })}
        onConfirm={confirmModal.onConfirm}
        title={confirmModal.title}
        message={confirmModal.message}
        type={confirmModal.type}
        confirmText={confirmModal.confirmText}
        cancelText={confirmModal.cancelText}
      />
    </div>
  );
};

export default StaffManagementAdvanced;

