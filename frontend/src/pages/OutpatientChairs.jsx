import { useState, useEffect } from 'react';
import StatusBadge from '../components/dashboard/StatusBadge';

const OutpatientChairs = () => {
  const [showNotification, setShowNotification] = useState(false);
  const [selectedChair, setSelectedChair] = useState(null);

  // Mock data for chairs/beds
  const chairs = [
    { id: 1, number: 'C-01', status: 'occupied', patient: 'Aziza K.', treatment: 'IV Drip', startTime: '10:00', duration: 45, elapsed: 30, payment: 'paid' },
    { id: 2, number: 'C-02', status: 'available', patient: null, treatment: null, startTime: null, duration: 0, elapsed: 0, payment: null },
    { id: 3, number: 'C-03', status: 'occupied', patient: 'Bobur T.', treatment: 'Injection', startTime: '10:15', duration: 15, elapsed: 10, payment: 'paid' },
    { id: 4, number: 'C-04', status: 'reserved', patient: 'Dilnoza S.', treatment: 'Blood Draw', startTime: null, duration: 10, elapsed: 0, payment: 'pending' },
    { id: 5, number: 'C-05', status: 'available', patient: null, treatment: null, startTime: null, duration: 0, elapsed: 0, payment: null },
    { id: 6, number: 'C-06', status: 'occupied', patient: 'Jamshid A.', treatment: 'IV Drip', startTime: '09:45', duration: 60, elapsed: 50, payment: 'paid' },
  ];

  const getChairColor = (status, payment) => {
    if (status === 'available') return 'bg-green-100 dark:bg-green-900/30 border-green-300 dark:border-green-700 hover:border-green-500';
    if (status === 'reserved' && payment === 'pending') return 'bg-orange-100 dark:bg-orange-900/30 border-orange-300 dark:border-orange-700';
    if (status === 'occupied') return 'bg-green-100 dark:bg-green-900/30 border-green-300 dark:border-green-700';
    return 'bg-gray-100 dark:bg-gray-800 border-gray-300 dark:border-gray-700';
  };

  const getNextAvailableTime = () => {
    const occupiedChairs = chairs.filter(c => c.status === 'occupied');
    if (occupiedChairs.length === 0) return 'Now';
    
    const minRemaining = Math.min(...occupiedChairs.map(c => c.duration - c.elapsed));
    return `~${minRemaining} min`;
  };

  const availableCount = chairs.filter(c => c.status === 'available').length;
  const occupiedCount = chairs.filter(c => c.status === 'occupied').length;

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white">Outpatient Chairs</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Real-time treatment chair management</p>
        </div>
        <div className="flex gap-2 sm:gap-3">
          <div className="px-4 sm:px-4 sm:px-6 lg:px-4 sm:px-6 lg:px-8 py-2 sm:py-2.5 bg-green-100 dark:bg-green-900/30 border border-green-300 dark:border-green-700 rounded-lg sm:rounded-lg sm:rounded-xl">
            <p className="text-sm sm:text-sm sm:text-base text-gray-600 dark:text-gray-400">Next Available</p>
            <p className="text-xl sm:text-2xl font-black text-green-600">{getNextAvailableTime()}</p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
        <div className="bg-white dark:bg-gray-900 rounded-lg sm:rounded-xl border border-gray-200 dark:border-gray-800 p-4 sm:p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm sm:text-sm sm:text-base text-gray-600 dark:text-gray-400 mb-1">Total Chairs</p>
              <p className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white">{chairs.length}</p>
            </div>
            <div className="size-12 bg-primary/10 text-primary rounded-lg sm:rounded-lg sm:rounded-xl flex items-center justify-center">
              <span className="material-symbols-outlined text-xl sm:text-2xl">event_seat</span>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-lg sm:rounded-xl border border-gray-200 dark:border-gray-800 p-4 sm:p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm sm:text-sm sm:text-base text-gray-600 dark:text-gray-400 mb-1">Available</p>
              <p className="text-2xl sm:text-3xl font-black text-green-600">{availableCount}</p>
            </div>
            <div className="size-12 bg-green-100 dark:bg-green-900/30 text-green-600 rounded-lg sm:rounded-lg sm:rounded-xl flex items-center justify-center">
              <span className="material-symbols-outlined text-xl sm:text-2xl">check_circle</span>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-lg sm:rounded-xl border border-gray-200 dark:border-gray-800 p-4 sm:p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm sm:text-sm sm:text-base text-gray-600 dark:text-gray-400 mb-1">Occupied</p>
              <p className="text-2xl sm:text-3xl font-black text-green-600">{occupiedCount}</p>
            </div>
            <div className="size-12 bg-green-100 dark:bg-green-900/30 text-green-600 rounded-lg sm:rounded-lg sm:rounded-xl flex items-center justify-center">
              <span className="material-symbols-outlined text-xl sm:text-2xl">person</span>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-lg sm:rounded-xl border border-gray-200 dark:border-gray-800 p-4 sm:p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm sm:text-sm sm:text-base text-gray-600 dark:text-gray-400 mb-1">Avg Treatment</p>
              <p className="text-2xl sm:text-3xl font-black text-primary">32min</p>
            </div>
            <div className="size-12 bg-primary/10 text-primary rounded-lg sm:rounded-lg sm:rounded-xl flex items-center justify-center">
              <span className="material-symbols-outlined text-xl sm:text-2xl">schedule</span>
            </div>
          </div>
        </div>
      </div>

      {/* Visual Seat Map */}
      <div className="bg-white dark:bg-gray-900 rounded-lg sm:rounded-xl border border-gray-200 dark:border-gray-800 p-4 sm:p-6">
        <h2 className="text-lg sm:text-xl font-bold mb-6">Chair Map</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 lg:grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3 sm:gap-4">
          {chairs.map((chair) => (
            <button
              key={chair.id}
              onClick={() => setSelectedChair(chair)}
              className={`p-4 sm:p-6 rounded-lg sm:rounded-xl border-2 transition-all hover:shadow-lg ${getChairColor(chair.status, chair.payment)}`}
            >
              <div className="flex items-center justify-between mb-3">
                <span className="material-symbols-outlined text-2xl sm:text-3xl">event_seat</span>
                <span className="text-xs font-bold">{chair.number}</span>
              </div>
              
              {chair.status === 'occupied' && (
                <>
                  <p className="text-sm sm:text-sm sm:text-base font-bold mb-1 truncate">{chair.patient}</p>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">{chair.treatment}</p>
                  
                  {/* Timer Progress */}
                  <div className="mb-2">
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div
                        className="bg-green-600 h-2 rounded-full transition-all"
                        style={{ width: `${(chair.elapsed / chair.duration) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                  <p className="text-xs font-semibold text-green-600">
                    {chair.elapsed}/{chair.duration} min
                  </p>
                </>
              )}
              
              {chair.status === 'reserved' && (
                <>
                  <p className="text-sm sm:text-sm sm:text-base font-bold mb-1 truncate">{chair.patient}</p>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">{chair.treatment}</p>
                  {chair.payment === 'pending' && (
                    <StatusBadge status="warning" text="PENDING" />
                  )}
                </>
              )}
              
              {chair.status === 'available' && (
                <p className="text-sm sm:text-sm sm:text-base font-semibold text-green-600">Available</p>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Detailed List */}
      <div className="bg-white dark:bg-gray-900 rounded-lg sm:rounded-xl border border-gray-200 dark:border-gray-800 p-4 sm:p-6">
        <h2 className="text-lg sm:text-xl font-bold mb-6">Active Treatments</h2>
        <div className="space-y-2 sm:space-y-3">
          {chairs.filter(c => c.status === 'occupied').map((chair) => (
            <div key={chair.id} className="flex items-center justify-between p-3 sm:p-4 bg-gray-50 dark:bg-gray-800 rounded-lg sm:rounded-lg sm:rounded-xl">
              <div className="flex items-center gap-3 sm:gap-4">
                <div className="size-12 bg-green-100 dark:bg-green-900/30 text-green-600 rounded-lg sm:rounded-lg sm:rounded-xl flex items-center justify-center font-bold">
                  {chair.number}
                </div>
                <div>
                  <p className="font-semibold text-gray-900 dark:text-white">{chair.patient}</p>
                  <p className="text-sm sm:text-sm sm:text-base text-gray-600 dark:text-gray-400">{chair.treatment} • Started {chair.startTime}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3 sm:gap-4">
                <div className="text-right">
                  <p className="text-sm sm:text-sm sm:text-base text-gray-600 dark:text-gray-400">Time Remaining</p>
                  <p className="text-base sm:text-lg font-bold text-primary">{chair.duration - chair.elapsed} min</p>
                </div>
                <button
                  onClick={() => setShowNotification(true)}
                  className="px-4 sm:px-4 sm:px-6 lg:px-4 sm:px-6 lg:px-8 py-2 sm:py-2.5 bg-green-600 text-white rounded-lg sm:rounded-lg sm:rounded-xl text-sm sm:text-sm sm:text-base font-semibold hover:opacity-90 flex items-center gap-2 sm:gap-2 sm:gap-3"
                >
                  <span className="material-symbols-outlined">notifications</span>
                  Notify Doctor
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Doctor Notification Popup */}
      {showNotification && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white dark:bg-gray-900 rounded-xl sm:rounded-2xl max-w-sm sm:max-w-md w-full animate-bounce">
            <div className="p-4 sm:p-6 bg-green-600 rounded-t-2xl text-white text-center">
              <span className="material-symbols-outlined text-6xl mb-2">check_circle</span>
              <h2 className="text-xl sm:text-2xl font-black">Patient Ready!</h2>
            </div>
            <div className="p-4 sm:p-6 text-center">
              <p className="text-base sm:text-lg font-semibold mb-2">Chair C-01</p>
              <p className="text-gray-600 dark:text-gray-400 mb-4">Aziza Karimova</p>
              <p className="text-sm sm:text-sm sm:text-base text-gray-500 mb-6">Treatment completed. Patient ready for doctor consultation.</p>
              <button
                onClick={() => setShowNotification(false)}
                className="w-full px-4 sm:px-6 lg:px-4 sm:px-6 lg:px-8 py-2 sm:py-3 bg-primary text-white rounded-lg sm:rounded-lg sm:rounded-xl font-bold hover:opacity-90"
              >
                Acknowledge
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Chair Detail Modal */}
      {selectedChair && (
        <ChairDetailModal chair={selectedChair} onClose={() => setSelectedChair(null)} />
      )}
    </div>
  );
};

const ChairDetailModal = ({ chair, onClose }) => {
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white dark:bg-gray-900 rounded-xl sm:rounded-2xl max-w-sm sm:max-w-md w-full">
        <div className="p-4 sm:p-6 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <h2 className="text-xl sm:text-2xl font-black">Chair {chair.number}</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg sm:rounded-lg sm:rounded-xl">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>
        
        <div className="p-4 sm:p-6 space-y-3 sm:space-y-4">
          {chair.status === 'occupied' && (
            <>
              <div>
                <p className="text-sm sm:text-sm sm:text-base text-gray-600 dark:text-gray-400 mb-1">Patient</p>
                <p className="text-base sm:text-lg font-bold">{chair.patient}</p>
              </div>
              <div>
                <p className="text-sm sm:text-sm sm:text-base text-gray-600 dark:text-gray-400 mb-1">Treatment</p>
                <p className="text-base sm:text-lg font-bold">{chair.treatment}</p>
              </div>
              <div>
                <p className="text-sm sm:text-sm sm:text-base text-gray-600 dark:text-gray-400 mb-1">Progress</p>
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                    <div
                      className="bg-primary h-3 rounded-full transition-all"
                      style={{ width: `${(chair.elapsed / chair.duration) * 100}%` }}
                    ></div>
                  </div>
                  <span className="text-sm sm:text-sm sm:text-base font-bold">{Math.round((chair.elapsed / chair.duration) * 100)}%</span>
                </div>
                <p className="text-sm sm:text-sm sm:text-base text-gray-600 dark:text-gray-400 mt-2">
                  {chair.elapsed} of {chair.duration} minutes
                </p>
              </div>
              <button className="w-full px-4 sm:px-4 sm:px-6 lg:px-4 sm:px-6 lg:px-8 py-2 sm:py-3 bg-red-600 text-white rounded-lg sm:rounded-lg sm:rounded-xl font-semibold hover:opacity-90">
                End Treatment
              </button>
            </>
          )}
          
          {chair.status === 'available' && (
            <div className="text-center py-4 sm:py-6 lg:py-8">
              <span className="material-symbols-outlined text-6xl text-green-600 mb-4">check_circle</span>
              <p className="text-base sm:text-lg font-bold text-green-600">Chair Available</p>
              <button className="mt-6 w-full px-4 sm:px-4 sm:px-6 lg:px-4 sm:px-6 lg:px-8 py-2 sm:py-3 bg-primary text-white rounded-lg sm:rounded-lg sm:rounded-xl font-semibold hover:opacity-90">
                Assign Patient
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default OutpatientChairs;
