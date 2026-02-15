const Staff = () => {
  const staff = [
    { id: 1, name: 'Dr. Rahimov', role: 'Cardiologist', salary: 5000000, percentage: 30, status: 'active' },
    { id: 2, name: 'Dr. Alimova', role: 'Pediatrician', salary: 4500000, percentage: 30, status: 'active' },
    { id: 3, name: 'Nurse Karimova', role: 'Head Nurse', salary: 2000000, percentage: 10, status: 'active' },
  ];

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-black text-gray-900 dark:text-white">Staff Management</h1>
        <button className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-semibold flex items-center gap-2">
          <span className="material-symbols-outlined">add</span>
          Add Staff
        </button>
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 dark:bg-gray-800">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-bold text-gray-600 dark:text-gray-400 uppercase">Name</th>
              <th className="px-6 py-3 text-left text-xs font-bold text-gray-600 dark:text-gray-400 uppercase">Role</th>
              <th className="px-6 py-3 text-left text-xs font-bold text-gray-600 dark:text-gray-400 uppercase">Salary</th>
              <th className="px-6 py-3 text-left text-xs font-bold text-gray-600 dark:text-gray-400 uppercase">Commission</th>
              <th className="px-6 py-3 text-left text-xs font-bold text-gray-600 dark:text-gray-400 uppercase">Status</th>
              <th className="px-6 py-3 text-right text-xs font-bold text-gray-600 dark:text-gray-400 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {staff.map((person) => (
              <tr key={person.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                <td className="px-6 py-4 font-semibold">{person.name}</td>
                <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">{person.role}</td>
                <td className="px-6 py-4 font-semibold">₸ {person.salary.toLocaleString()}</td>
                <td className="px-6 py-4 text-primary font-bold">{person.percentage}%</td>
                <td className="px-6 py-4">
                  <span className="px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full text-xs font-bold uppercase">
                    {person.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <button className="text-primary hover:text-green-700">
                    <span className="material-symbols-outlined">edit</span>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Staff;

