const Nurse = () => {
  const treatments = [
    { id: 1, patient: 'Aziza Karimova', room: 101, treatment: 'Injection - Antibiotic', time: '10:00', status: 'pending' },
    { id: 2, patient: 'Bobur Tursunov', room: 102, treatment: 'IV Drip', time: '10:30', status: 'completed' },
    { id: 3, patient: 'Dilnoza Saidova', room: 103, treatment: 'Wound Dressing', time: '11:00', status: 'pending' },
  ];

  return (
    <div className="p-8 space-y-6">
      <h1 className="text-3xl font-black text-gray-900 dark:text-white">Nurse Treatment Panel</h1>
      
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6">
        <h2 className="text-xl font-bold mb-6">Today's Schedule</h2>
        <div className="space-y-4">
          {treatments.map((item) => (
            <div key={item.id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <div className="flex-1">
                <p className="font-semibold text-gray-900 dark:text-white">{item.patient}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Room {item.room} • {item.treatment}</p>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-sm font-semibold">{item.time}</span>
                {item.status === 'completed' ? (
                  <span className="px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full text-xs font-bold">
                    ✓ Completed
                  </span>
                ) : (
                  <button className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-semibold">
                    Mark Complete
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Nurse;
