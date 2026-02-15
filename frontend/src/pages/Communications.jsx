import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import communicationService from '../services/communicationService';
import patientService from '../services/patientService';
import notificationService from '../services/notificationService';
import toast, { Toaster } from 'react-hot-toast';

export default function Communications() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('send');
  const [logs, setLogs] = useState([]);
  const [stats, setStats] = useState({});
  
  // Bemorlar ro'yxati va qidirish
  const [patients, setPatients] = useState([]);
  const [filteredPatients, setFilteredPatients] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState(null);
  
  const [formData, setFormData] = useState({
    patient_id: '',
    recipient_phone: '',
    template_id: '',
    message: '',
    metadata: {}
  });

  useEffect(() => {
    loadData();
  }, [activeTab]);

  useEffect(() => {
    loadPatients();
  }, []);

  // Dropdown tashqarisiga bosilganda yopish
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showDropdown && !event.target.closest('.patient-search-container')) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showDropdown]);

  // Bemorlar ro'yxatini yuklash
  const loadPatients = async () => {
    try {
      const response = await patientService.getPatients();
      if (response.success) {
        setPatients(response.data);
        setFilteredPatients(response.data);
      }
    } catch (error) {
      console.error('Load patients error:', error);
    }
  };

  // Bemorlarni qidirish
  const handleSearchPatient = (query) => {
    setSearchQuery(query);
    setShowDropdown(true);
    
    if (!query.trim()) {
      setFilteredPatients(patients);
      return;
    }

    const filtered = patients.filter(patient => {
      const fullName = `${patient.first_name} ${patient.last_name}`.toLowerCase();
      const phone = patient.phone || '';
      const searchLower = query.toLowerCase();
      
      return fullName.includes(searchLower) || 
             phone.includes(searchLower) ||
             patient.patient_number?.toLowerCase().includes(searchLower);
    });
    
    setFilteredPatients(filtered);
  };

  // Bemorni tanlash
  const handleSelectPatient = (patient) => {
    setSelectedPatient(patient);
    setSearchQuery(`${patient.first_name} ${patient.last_name}`);
    setFormData({ 
      ...formData, 
      patient_id: patient.id || patient._id, // Backend id qaytaradi
      recipient_phone: patient.phone || ''
    });
    setShowDropdown(false);
  };

  const loadData = async () => {
    try {
      setLoading(true);
      
      if (activeTab === 'history') {
        const logsData = await communicationService.getLogs({ limit: 50 });
        if (logsData.success) {
          setLogs(logsData.data);
        }
      } else if (activeTab === 'stats') {
        const statsData = await communicationService.getStats();
        if (statsData.success) {
          setStats(statsData.data);
        }
      }
    } catch (error) {
      console.error('Load error:', error);
      toast.error(t('communications.errorOccurred') + ': ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    
    if (!selectedPatient) {
      toast.error(t('communications.selectPatient') || 'Iltimos, bemorni tanlang');
      return;
    }
    
    if (!formData.message.trim()) {
      toast.error('Iltimos, xabar matnini kiriting');
      return;
    }
    
    console.log('Sending SMS with data:', {
      patient_id: formData.patient_id,
      recipient_phone: formData.recipient_phone,
      message: formData.message,
      selectedPatient: selectedPatient
    });
    
    try {
      // SMS orqali yuborish (default)
      const result = await communicationService.sendSMS(formData);

      if (result.success) {
        toast.success(t('communications.messageSent'));
        setFormData({
          patient_id: '',
          recipient_phone: '',
          template_id: '',
          message: '',
          metadata: {}
        });
        setSelectedPatient(null);
        setSearchQuery('');
      }
    } catch (error) {
      console.error('Send message error:', error);
      console.error('Error response:', error.response?.data);
      toast.error(t('communications.errorOccurred') + ': ' + (error.response?.data?.message || error.message));
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      sent: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
      delivered: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
      pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
      failed: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
      read: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getStatusText = (status) => {
    const texts = {
      sent: t('communications.sent').toUpperCase(),
      delivered: t('communications.delivered').toUpperCase(),
      pending: t('communications.pending'),
      failed: t('communications.failed').toUpperCase(),
      read: t('communications.read')
    };
    return texts[status] || status.toUpperCase();
  };

  const getChannelIcon = (ch) => {
    const icons = {
      sms: 'sms',
      telegram: 'send',
      web: 'notifications',
      email: 'email'
    };
    return icons[ch] || 'message';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">{t('communications.loading')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-3 sm:p-4 lg:p-4 sm:p-6 lg:p-8 space-y-3 sm:space-y-4">
      <Toaster position="top-right" />
      
      <div className="flex flex-col sm:flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-3">
        <h1 className="text-2xl sm:text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2 sm:gap-2 sm:gap-3 sm:gap-2 sm:gap-3">
          <span className="material-symbols-outlined text-3xl sm:text-3xl sm:text-4xl flex-shrink-0">chat</span>
          <span className="break-words">{t('communications.pageTitle')}</span>
        </h1>
      </div>

      {/* Tabs */}
      <div className="bg-white dark:bg-gray-800 rounded-lg sm:rounded-xl shadow-sm overflow-hidden sm:block">
        <div className="border-b border-gray-200 dark:border-gray-700">
          <div className="flex gap-1 sm:gap-2 px-3 sm:px-4 sm:px-6 lg:px-4 sm:px-6 lg:px-8 overflow-x-auto">
            {[
              { id: 'send', label: t('communications.sendTab'), icon: 'send' },
              { id: 'history', label: t('communications.historyTab'), icon: 'history' },
              { id: 'stats', label: t('communications.statsTab'), icon: 'bar_chart' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 px-2 sm:px-3 py-2 sm:py-2.5 sm:py-2 sm:py-3 border-b-2 transition-colors whitespace-nowrap text-xs sm:text-sm ${
                  activeTab === tab.id
                    ? 'border-primary text-primary font-semibold'
                    : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900'
                }`}
              >
                <span className="material-symbols-outlined text-base sm:text-base sm:text-lg flex-shrink-0">{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="p-3 sm:p-4">
          {/* XABAR YUBORISH */}
          {activeTab === 'send' && (
            <div className="max-w-xl sm:max-w-2xl mx-auto">
              <div className="space-y-3 sm:space-y-4">
                <h2 className="text-lg sm:text-lg sm:text-xl font-bold">{t('communications.newMessage')}</h2>
                
                <form onSubmit={handleSendMessage} className="space-y-3 sm:space-y-4">
                  {/* Bemor tanlash */}
                  <div className="relative patient-search-container">
                    <label className="block text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      {t('communications.selectPatient')}
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        required
                        value={searchQuery}
                        onChange={(e) => handleSearchPatient(e.target.value)}
                        onFocus={() => setShowDropdown(true)}
                        className="w-full px-3 sm:px-4 lg:px-8 py-2 sm:py-2.5 sm:py-2 sm:py-3 border-2 border-gray-300 dark:border-gray-600 rounded-lg sm:rounded-lg sm:rounded-xl focus:border-primary focus:outline-none dark:bg-gray-700 dark:text-white text-sm sm:text-sm sm:text-base"
                        placeholder={t('communications.searchPatientPlaceholder')}
                      />
                      <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                        search
                      </span>
                    </div>
                    
                    {/* Dropdown ro'yxat */}
                    {showDropdown && filteredPatients.length > 0 && (
                      <div className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border-2 border-gray-300 dark:border-gray-600 rounded-lg sm:rounded-xl shadow-lg max-h-60 overflow-y-auto">
                        {filteredPatients.map((patient) => (
                          <button
                            key={patient.id || patient._id}
                            type="button"
                            onClick={() => handleSelectPatient(patient)}
                            className="w-full px-3 sm:px-4 py-2 sm:py-3 text-left hover:bg-gray-100 dark:hover:bg-gray-700 border-b border-gray-200 dark:border-gray-700 last:border-b-0 transition-colors"
                          >
                            <div className="flex items-center gap-2">
                              <span className="material-symbols-outlined text-primary">person</span>
                              <div className="flex-1 min-w-0">
                                <p className="font-semibold text-sm sm:text-base text-gray-900 dark:text-white truncate">
                                  {patient.first_name} {patient.last_name}
                                </p>
                                <p className="text-xs text-gray-500 truncate">
                                  {patient.phone} • {patient.patient_number}
                                </p>
                              </div>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                    
                    {showDropdown && filteredPatients.length === 0 && searchQuery && (
                      <div className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border-2 border-gray-300 dark:border-gray-600 rounded-lg sm:rounded-xl shadow-lg p-4 text-center">
                        <span className="material-symbols-outlined text-4xl text-gray-300 mb-2">person_off</span>
                        <p className="text-sm text-gray-500">{t('communications.noPatientFound')}</p>
                      </div>
                    )}
                    
                    {selectedPatient && (
                      <div className="mt-2 p-2 sm:p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="material-symbols-outlined text-green-600">check_circle</span>
                          <div>
                            <p className="text-sm font-semibold text-gray-900 dark:text-white">
                              {selectedPatient.first_name} {selectedPatient.last_name}
                            </p>
                            <p className="text-xs text-gray-500">{selectedPatient.phone}</p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedPatient(null);
                            setSearchQuery('');
                            setFormData({ ...formData, patient_id: '', recipient_phone: '' });
                          }}
                          className="text-red-600 hover:text-red-700"
                        >
                          <span className="material-symbols-outlined">close</span>
                        </button>
                      </div>
                    )}
                    
                    <p className="text-xs text-gray-500 mt-1">
                      {t('communications.searchPatientHelp')}
                    </p>
                  </div>

                  {/* Xabar */}
                  <div>
                    <label className="block text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      {t('communications.messageText')}
                    </label>
                    <textarea
                      required
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      rows="6"
                      className="w-full px-3 sm:px-4 lg:px-8 py-2 sm:py-2.5 sm:py-2 sm:py-3 border-2 border-gray-300 dark:border-gray-600 rounded-lg sm:rounded-lg sm:rounded-xl focus:border-primary focus:outline-none dark:bg-gray-700 dark:text-white resize-none text-sm sm:text-sm sm:text-base"
                      placeholder={t('communications.messageTextPlaceholder')}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      {formData.message.length} {t('communications.characters')}
                    </p>
                  </div>

                  <button
                    type="submit"
                    className="w-full px-4 sm:px-4 sm:px-6 lg:px-4 sm:px-6 lg:px-8 sm:px-4 sm:px-6 lg:px-4 sm:px-6 lg:px-8 py-2 sm:py-2.5 sm:py-2 sm:py-3 bg-primary text-white rounded-lg sm:rounded-lg sm:rounded-xl hover:bg-primary/90 font-semibold transition-colors flex items-center justify-center gap-2 sm:gap-2 sm:gap-3 text-sm sm:text-sm sm:text-base"
                  >
                    <span className="material-symbols-outlined flex-shrink-0">send</span>
                    <span>{t('communications.sendMessage')}</span>
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* TARIX */}
          {activeTab === 'history' && (
            <div className="space-y-3 sm:space-y-4">
              <div className="flex flex-col sm:flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-3">
                <h2 className="text-lg sm:text-lg sm:text-xl font-bold">{t('communications.messagesHistory')}</h2>
              </div>

              <div className="space-y-2 sm:space-y-3">
                {logs.length === 0 ? (
                  <div className="text-center py-4 sm:py-6 lg:py-8 sm:py-12 bg-gray-50 dark:bg-gray-900 rounded-lg sm:rounded-xl">
                    <span className="material-symbols-outlined text-5xl sm:text-6xl text-gray-300 mb-4">history</span>
                    <p className="text-sm sm:text-sm sm:text-base text-gray-500">{t('communications.noMessages')}</p>
                  </div>
                ) : (
                  logs.map((log) => (
                    <div key={log.id} className="p-3 sm:p-3 sm:p-4 bg-gray-50 dark:bg-gray-900 rounded-lg sm:rounded-lg sm:rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden sm:block">
                      <div className="flex flex-col sm:flex-col sm:flex-row items-start justify-between gap-2 sm:gap-3 mb-2">
                        <div className="flex items-center gap-2 sm:gap-2 sm:gap-3 sm:gap-2 sm:gap-3 min-w-0 flex-1">
                          <span className="material-symbols-outlined text-xl sm:text-xl sm:text-2xl text-gray-600 flex-shrink-0">
                            {getChannelIcon(log.channel)}
                          </span>
                          <div className="min-w-0 flex-1">
                            <p className="font-semibold text-sm sm:text-sm sm:text-base text-gray-900 dark:text-white break-words">{log.recipient_name}</p>
                            <p className="text-xs text-gray-500 break-words">{log.recipient_phone}</p>
                          </div>
                        </div>
                        <div className="flex flex-col items-start sm:items-end gap-1 flex-shrink-0">
                          <span className={`px-2 sm:px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap ${getStatusColor(log.status)}`}>
                            {getStatusText(log.status)}
                          </span>
                          <p className="text-xs text-gray-500 whitespace-nowrap">
                            {new Date(log.created_at).toLocaleString('uz-UZ', {
                              day: '2-digit',
                              month: '2-digit',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </p>
                        </div>
                      </div>
                      <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-2 break-words">{log.content}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* STATISTIKA */}
          {activeTab === 'stats' && (
            <div className="space-y-3 sm:space-y-4">
              <h2 className="text-lg sm:text-lg sm:text-xl font-bold">{t('communications.todayStats')}</h2>
              
              <div className="grid grid-cols-1 sm:grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2 sm:gap-3 sm:gap-3 sm:gap-4">
                <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg sm:rounded-xl p-3 sm:p-4 text-white">
                  <span className="material-symbols-outlined text-2xl sm:text-2xl mb-2 flex-shrink-0">message</span>
                  <p className="text-2xl sm:text-2xl font-bold">{stats.total || 0}</p>
                  <p className="text-xs sm:text-sm opacity-90 mt-1">{t('communications.totalMessages')}</p>
                </div>

                <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg sm:rounded-xl p-3 sm:p-4 text-white">
                  <span className="material-symbols-outlined text-2xl sm:text-2xl mb-2 flex-shrink-0">sms</span>
                  <p className="text-2xl sm:text-2xl font-bold">{stats.sms_count || 0}</p>
                  <p className="text-xs sm:text-sm opacity-90 mt-1">{t('communications.sms')}</p>
                </div>

                <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg sm:rounded-xl p-3 sm:p-4 text-white">
                  <span className="material-symbols-outlined text-2xl sm:text-2xl mb-2 flex-shrink-0">send</span>
                  <p className="text-2xl sm:text-2xl font-bold">{stats.telegram_count || 0}</p>
                  <p className="text-xs sm:text-sm opacity-90 mt-1">{t('communications.telegram')}</p>
                </div>

                <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg sm:rounded-xl p-3 sm:p-4 text-white">
                  <span className="material-symbols-outlined text-2xl sm:text-2xl mb-2 flex-shrink-0">check_circle</span>
                  <p className="text-2xl sm:text-2xl font-bold">{stats.sent_count || 0}</p>
                  <p className="text-xs sm:text-sm opacity-90 mt-1">{t('communications.sentCount')}</p>
                </div>

                <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-lg sm:rounded-xl p-3 sm:p-4 text-white sm:col-span-2 lg:col-span-1">
                  <span className="material-symbols-outlined text-2xl sm:text-2xl mb-2 flex-shrink-0">error</span>
                  <p className="text-2xl sm:text-2xl font-bold">{stats.failed_count || 0}</p>
                  <p className="text-xs sm:text-sm opacity-90 mt-1">{t('communications.error')}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


