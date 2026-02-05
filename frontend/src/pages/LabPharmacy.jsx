import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import labPharmacyService from '../services/labPharmacyService';
import toast, { Toaster } from 'react-hot-toast';

export default function LabPharmacy() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('reagents');
  
  // States
  const [reagents, setReagents] = useState([]);
  const [stats, setStats] = useState({});
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAddRequestModal, setShowAddRequestModal] = useState(false);
  const [showAddSupplierModal, setShowAddSupplierModal] = useState(false);
  const [editingReagent, setEditingReagent] = useState(null);
  const [suppliers, setSuppliers] = useState([]);
  const [requests, setRequests] = useState([]);
  
  const [newReagent, setNewReagent] = useState({
    name: '',
    category: 'reagent',
    unit: 'ml',
    quantity: 0,
    unit_price: 0,
    reorder_level: 10,
    expiry_date: '',
    storage_condition: 'room_temperature',
    manufacturer: '',
    lot_number: '',
    notes: ''
  });

  const [newRequest, setNewRequest] = useState({
    reagent_name: '',
    quantity: 1,
    unit: 'piece',
    supplier_id: '',
    urgency: 'normal',
    notes: ''
  });

  const [newSupplier, setNewSupplier] = useState({
    name: '',
    contact_person: '',
    phone: '',
    email: '',
    address: '',
    notes: ''
  });

  useEffect(() => {
    loadData();
  }, [activeTab, searchQuery]);

  const loadData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'reagents' || activeTab === 'dashboard') {
        const [reagentsData, statsData] = await Promise.all([
          labPharmacyService.getReagents({ search: searchQuery }),
          labPharmacyService.getStats()
        ]);
        
        if (reagentsData.success) setReagents(reagentsData.data);
        if (statsData.success) setStats(statsData.data);
      } else if (activeTab === 'out-of-stock') {
        const data = await labPharmacyService.getReagents({ status: 'out_of_stock' });
        if (data.success) setReagents(data.data);
      } else if (activeTab === 'requests') {
        const data = await labPharmacyService.getRequests();
        if (data.success) setRequests(data.data);
      } else if (activeTab === 'suppliers') {
        const data = await labPharmacyService.getSuppliers();
        if (data.success) setSuppliers(data.data);
      }
    } catch (error) {
      toast.error('Ma\'lumotlarni yuklashda xatolik');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddReagent = async () => {
    try {
      const response = await labPharmacyService.createReagent(newReagent);
      if (response.success) {
        toast.success('Reagent qo\'shildi');
        setShowAddModal(false);
        setNewReagent({
          name: '',
          category: 'reagent',
          unit: 'ml',
          quantity: 0,
          unit_price: 0,
          reorder_level: 10,
          expiry_date: '',
          storage_condition: 'room_temperature',
          manufacturer: '',
          lot_number: '',
          notes: ''
        });
        loadData();
      }
    } catch (error) {
      toast.error('Reagent qo\'shishda xatolik');
    }
  };

  const handleEditReagent = async () => {
    try {
      const response = await labPharmacyService.updateReagent(editingReagent.id, editingReagent);
      if (response.success) {
        toast.success('Reagent yangilandi');
        setShowEditModal(false);
        setEditingReagent(null);
        loadData();
      }
    } catch (error) {
      toast.error('Reagent yangilashda xatolik');
    }
  };

  const handleDeleteReagent = async (id) => {
    if (!confirm('Reagentni o\'chirmoqchimisiz?')) return;
    
    try {
      const response = await labPharmacyService.deleteReagent(id);
      if (response.success) {
        toast.success('Reagent o\'chirildi');
        loadData();
      }
    } catch (error) {
      toast.error('Reagent o\'chirishda xatolik');
    }
  };

  const handleAddRequest = async () => {
    try {
      const response = await labPharmacyService.createRequest(newRequest);
      if (response.success) {
        toast.success('Buyurtma yaratildi');
        setShowAddRequestModal(false);
        setNewRequest({
          reagent_name: '',
          quantity: 1,
          unit: 'piece',
          supplier_id: '',
          urgency: 'normal',
          notes: ''
        });
        loadData();
      }
    } catch (error) {
      toast.error('Buyurtma yaratishda xatolik');
    }
  };

  const handleAddSupplier = async () => {
    try {
      const response = await labPharmacyService.createSupplier(newSupplier);
      if (response.success) {
        toast.success('Yetkazib beruvchi qo\'shildi');
        setShowAddSupplierModal(false);
        setNewSupplier({
          name: '',
          contact_person: '',
          phone: '',
          email: '',
          address: '',
          notes: ''
        });
        loadData();
      }
    } catch (error) {
      toast.error('Yetkazib beruvchi qo\'shishda xatolik');
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      in_stock: 'bg-green-100 text-green-800',
      low_stock: 'bg-yellow-100 text-yellow-800',
      out_of_stock: 'bg-red-100 text-red-800',
      expired: 'bg-gray-100 text-gray-800'
    };
    const labels = {
      in_stock: 'Mavjud',
      low_stock: 'Kam qoldi',
      out_of_stock: 'Tugadi',
      expired: 'Muddati o\'tgan'
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${badges[status]}`}>
        {labels[status]}
      </span>
    );
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
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      <Toaster position="top-right" />
      
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-500 to-green-600 rounded-2xl p-6 text-white shadow-xl">
        <div className="flex items-center gap-4">
          <span className="material-symbols-outlined text-5xl">science</span>
          <div>
            <h1 className="text-3xl font-black">LABORATORIYA DORIXONASI</h1>
            <p className="text-lg opacity-90">Reagentlar va laboratoriya materiallari</p>
          </div>
        </div>
      </div>

      {/* Stats */}
      {activeTab === 'dashboard' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-6 text-white">
            <span className="material-symbols-outlined text-3xl mb-2">inventory_2</span>
            <p className="text-4xl font-black">{stats.total_reagents || 0}</p>
            <p className="text-sm opacity-90">Jami reagentlar</p>
          </div>
          <div className="bg-gradient-to-br from-yellow-500 to-orange-600 rounded-xl p-6 text-white">
            <span className="material-symbols-outlined text-3xl mb-2">warning</span>
            <p className="text-4xl font-black">{stats.low_stock || 0}</p>
            <p className="text-sm opacity-90">Kam qolgan</p>
          </div>
          <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-xl p-6 text-white">
            <span className="material-symbols-outlined text-3xl mb-2">remove_shopping_cart</span>
            <p className="text-4xl font-black">{stats.out_of_stock || 0}</p>
            <p className="text-sm opacity-90">Tugagan</p>
          </div>
          <div className="bg-gradient-to-br from-gray-500 to-gray-600 rounded-xl p-6 text-white">
            <span className="material-symbols-outlined text-3xl mb-2">event_busy</span>
            <p className="text-4xl font-black">{stats.expired || 0}</p>
            <p className="text-sm opacity-90">Muddati o'tgan</p>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm">
        <div className="border-b border-gray-200 dark:border-gray-700">
          <div className="flex gap-2 px-4 overflow-x-auto">
            {[
              { id: 'reagents', label: 'Reagentlar', icon: 'science' },
              { id: 'out-of-stock', label: 'Tugaganlar', icon: 'remove_shopping_cart' },
              { id: 'requests', label: 'Buyurtmalar', icon: 'shopping_cart' },
              { id: 'suppliers', label: 'Yetkazib beruvchilar', icon: 'local_shipping' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-4 border-b-2 transition-colors whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'border-primary text-primary font-semibold'
                    : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900'
                }`}
              >
                <span className="material-symbols-outlined text-lg">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="p-6">
          {/* Reagents Tab */}
          {activeTab === 'reagents' && (
            <div className="space-y-4">
              {/* Search and Add */}
              <div className="flex gap-4">
                <div className="flex-1 relative">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                    search
                  </span>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Reagent qidirish..."
                    className="w-full pl-10 pr-4 py-3 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                  />
                </div>
                <button
                  onClick={() => setShowAddModal(true)}
                  className="px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 font-semibold flex items-center gap-2"
                >
                  <span className="material-symbols-outlined">add</span>
                  Qo'shish
                </button>
              </div>

              {/* Reagents List */}
              {reagents.length === 0 ? (
                <div className="text-center py-12">
                  <span className="material-symbols-outlined text-6xl text-gray-300 mb-4">science</span>
                  <p className="text-gray-600 dark:text-gray-400">Reagentlar yo'q</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {reagents.map(reagent => (
                    <div key={reagent.id} className="bg-gray-50 dark:bg-gray-900 rounded-xl p-4 hover:shadow-md transition-shadow">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <h3 className="font-bold text-lg">{reagent.name}</h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400">{reagent.category}</p>
                        </div>
                        {getStatusBadge(reagent.status)}
                      </div>
                      
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">Miqdor:</span>
                          <span className="font-semibold">{reagent.quantity} {reagent.unit}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">Narx:</span>
                          <span className="font-semibold">{reagent.unit_price?.toLocaleString()} so'm</span>
                        </div>
                        {reagent.expiry_date && (
                          <div className="flex justify-between">
                            <span className="text-gray-600 dark:text-gray-400">Muddat:</span>
                            <span className="font-semibold">{new Date(reagent.expiry_date).toLocaleDateString('uz-UZ')}</span>
                          </div>
                        )}
                      </div>

                      <div className="flex gap-2 mt-4">
                        <button
                          onClick={() => {
                            setEditingReagent(reagent);
                            setShowEditModal(true);
                          }}
                          className="flex-1 px-3 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 text-sm"
                        >
                          Tahrirlash
                        </button>
                        <button
                          onClick={() => handleDeleteReagent(reagent.id)}
                          className="px-3 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
                        >
                          <span className="material-symbols-outlined text-lg">delete</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Out of Stock Tab */}
          {activeTab === 'out-of-stock' && (
            <div className="space-y-4">
              <h3 className="text-xl font-bold">Tugagan Reagentlar</h3>
              {reagents.length === 0 ? (
                <div className="text-center py-12">
                  <span className="material-symbols-outlined text-6xl text-green-300 mb-4">check_circle</span>
                  <p className="text-gray-600 dark:text-gray-400">Barcha reagentlar mavjud</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {reagents.map(reagent => (
                    <div key={reagent.id} className="bg-red-50 dark:bg-red-900/20 border-2 border-red-200 dark:border-red-800 rounded-xl p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-bold text-lg">{reagent.name}</h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400">{reagent.category}</p>
                        </div>
                        <button
                          onClick={() => setShowAddModal(true)}
                          className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 text-sm"
                        >
                          Buyurtma berish
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Requests Tab */}
          {activeTab === 'requests' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold">Buyurtmalar</h3>
                <button
                  onClick={() => setShowAddRequestModal(true)}
                  className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 font-semibold flex items-center gap-2"
                >
                  <span className="material-symbols-outlined">add</span>
                  Yangi buyurtma
                </button>
              </div>
              <div className="text-center py-12">
                <span className="material-symbols-outlined text-6xl text-gray-300 mb-4">shopping_cart</span>
                <p className="text-gray-600 dark:text-gray-400">Buyurtmalar yo'q</p>
              </div>
            </div>
          )}

          {/* Suppliers Tab */}
          {activeTab === 'suppliers' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold">Yetkazib Beruvchilar</h3>
                <button
                  onClick={() => setShowAddSupplierModal(true)}
                  className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 font-semibold flex items-center gap-2"
                >
                  <span className="material-symbols-outlined">add</span>
                  Qo'shish
                </button>
              </div>
              <div className="text-center py-12">
                <span className="material-symbols-outlined text-6xl text-gray-300 mb-4">local_shipping</span>
                <p className="text-gray-600 dark:text-gray-400">Yetkazib beruvchilar yo'q</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Add Reagent Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6">
            <h3 className="text-2xl font-bold mb-6">Yangi Reagent Qo'shish</h3>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold mb-2">Nomi *</label>
                  <input
                    type="text"
                    value={newReagent.name}
                    onChange={(e) => setNewReagent({...newReagent, name: e.target.value})}
                    className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                    placeholder="Reagent nomi"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2">Kategoriya</label>
                  <select
                    value={newReagent.category}
                    onChange={(e) => setNewReagent({...newReagent, category: e.target.value})}
                    className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                  >
                    <option value="reagent">Reagent</option>
                    <option value="consumable">Consumable</option>
                    <option value="equipment">Equipment</option>
                    <option value="chemical">Chemical</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-semibold mb-2">Miqdor</label>
                  <input
                    type="number"
                    value={newReagent.quantity}
                    onChange={(e) => setNewReagent({...newReagent, quantity: Number(e.target.value)})}
                    className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2">Birlik</label>
                  <select
                    value={newReagent.unit}
                    onChange={(e) => setNewReagent({...newReagent, unit: e.target.value})}
                    className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                  >
                    <option value="ml">ml</option>
                    <option value="l">l</option>
                    <option value="mg">mg</option>
                    <option value="g">g</option>
                    <option value="kg">kg</option>
                    <option value="piece">dona</option>
                    <option value="box">quti</option>
                    <option value="pack">paket</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2">Narx (so'm)</label>
                  <input
                    type="number"
                    value={newReagent.unit_price}
                    onChange={(e) => setNewReagent({...newReagent, unit_price: Number(e.target.value)})}
                    className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold mb-2">Yaroqlilik muddati</label>
                  <input
                    type="date"
                    value={newReagent.expiry_date}
                    onChange={(e) => setNewReagent({...newReagent, expiry_date: e.target.value})}
                    className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2">Saqlash sharoiti</label>
                  <select
                    value={newReagent.storage_condition}
                    onChange={(e) => setNewReagent({...newReagent, storage_condition: e.target.value})}
                    className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                  >
                    <option value="room_temperature">Xona harorati</option>
                    <option value="refrigerated">Sovutgich (2-8°C)</option>
                    <option value="frozen">Muzlatgich (-20°C)</option>
                    <option value="dark">Qorong'i joy</option>
                    <option value="special">Maxsus sharoit</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2">Izohlar</label>
                <textarea
                  value={newReagent.notes}
                  onChange={(e) => setNewReagent({...newReagent, notes: e.target.value})}
                  className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                  rows="3"
                  placeholder="Qo'shimcha ma'lumotlar..."
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowAddModal(false)}
                className="flex-1 px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Bekor qilish
              </button>
              <button
                onClick={handleAddReagent}
                className="flex-1 px-4 py-3 bg-primary text-white rounded-lg hover:bg-primary/90"
              >
                Saqlash
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal - similar to Add Modal */}
      {showEditModal && editingReagent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-2xl w-full p-6">
            <h3 className="text-2xl font-bold mb-6">Reagentni Tahrirlash</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold mb-2">Nomi</label>
                <input
                  type="text"
                  value={editingReagent.name}
                  onChange={(e) => setEditingReagent({...editingReagent, name: e.target.value})}
                  className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold mb-2">Miqdor</label>
                  <input
                    type="number"
                    value={editingReagent.quantity}
                    onChange={(e) => setEditingReagent({...editingReagent, quantity: Number(e.target.value)})}
                    className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2">Narx</label>
                  <input
                    type="number"
                    value={editingReagent.unit_price}
                    onChange={(e) => setEditingReagent({...editingReagent, unit_price: Number(e.target.value)})}
                    className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                  />
                </div>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setEditingReagent(null);
                }}
                className="flex-1 px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Bekor qilish
              </button>
              <button
                onClick={handleEditReagent}
                className="flex-1 px-4 py-3 bg-primary text-white rounded-lg hover:bg-primary/90"
              >
                Saqlash
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
