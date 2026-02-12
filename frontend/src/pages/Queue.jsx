import StatusBadge from '../components/dashboard/StatusBadge';

const Queue = () => {
  const queue = [
    { id: 1, patient: 'Aziza Karimova', patientId: '#8821', doctor: 'Dr. Rahimov', time: '10:30', status: 'waiting' },
    { id: 2, patient: 'Bobur Tursunov', patientId: '#8822', doctor: 'Dr. Alimova', time: '11:00', status: 'in-progress' },
    { id: 3, patient: 'Dilnoza Saidova', patientId: '#8823', doctor: 'Dr. Karimov', time: '11:30', status: 'waiting' },
  ];

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-4 sm:space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white">Queue Management</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Today's appointments and waiting list</p>
        </div>
        <button className="px-4 sm:px-4 sm:px-6 lg:px-4 sm:px-6 lg:px-8 py-2 sm:py-2.5 bg-primary text-white rounded-lg sm:rounded-lg sm:rounded-xl text-sm sm:text-sm sm:text-base font-semibold hover:opacity-90 flex items-center gap-2 sm:gap-2 sm:gap-3">
          <span className="material-symbols-outlined">add</span>
          Book Appointment
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
        {[
          { label: 'Waiting', count: 12, color: 'bg-green-500' },
          { label: 'In Progress', count: 3, color: 'bg-orange-500' },
          { label: 'Completed', count: 28, color: 'bg-green-500' },
          { label: 'Cancelled', count: 2, color: 'bg-red-500' },
        ].map((stat, i) => (
          <div key={i} className="bg-white dark:bg-gray-900 rounded-lg sm:rounded-xl border border-gray-200 dark:border-gray-800 p-4 sm:p-6">
            <div className={`size-12 ${stat.color} rounded-lg sm:rounded-lg sm:rounded-xl flex items-center justify-center text-white mb-3`}>
              <span className="text-xl sm:text-2xl font-bold">{stat.count}</span>
            </div>
            <p className="text-sm sm:text-sm sm:text-base text-gray-600 dark:text-gray-400">{stat.label}</p>
          </div>
        ))}
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-lg sm:rounded-xl border border-gray-200 dark:border-gray-800 p-4 sm:p-6">
        <h2 className="text-lg sm:text-xl font-bold mb-6">Current Queue</h2>
        <div className="space-y-3 sm:space-y-4">
          {queue.map((item) => (
            <div key={item.id} className="flex items-center justify-between p-3 sm:p-4 bg-gray-50 dark:bg-gray-800 rounded-lg sm:rounded-lg sm:rounded-xl">
              <div className="flex items-center gap-3 sm:gap-4">
                <div className="size-12 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold">
                  {item.id}
                </div>
                <div>
                  <p className="font-semibold text-gray-900 dark:text-white">{item.patient}</p>
                  <p className="text-sm sm:text-sm sm:text-base text-gray-600 dark:text-gray-400">{item.patientId} • {item.doctor}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 sm:gap-4">
                <span className="text-sm sm:text-sm sm:text-base font-semibold">{item.time}</span>
                <StatusBadge status={item.status === 'in-progress' ? 'warning' : 'info'} text={item.status} />
                <button className="px-4 sm:px-4 sm:px-6 lg:px-4 sm:px-6 lg:px-8 py-2 sm:py-2.5 bg-primary text-white rounded-lg sm:rounded-lg sm:rounded-xl text-sm sm:text-sm sm:text-base font-semibold">Call Next</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Queue;
