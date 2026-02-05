/**
 * Offline Mode Middleware
 * Provides fallback responses when database is unavailable
 */

export const handleOfflineError = (error, req, res, mockData = null) => {
  console.error('Route error (offline mode):', error.message);
  
  // Check if it's a database error
  if (error.message && error.message.includes('Database not available')) {
    // Return mock data or empty response
    const response = {
      success: true,
      data: mockData || [],
      offline: true,
      message: 'Tizim offline rejimda ishlayapti'
    };
    
    return res.json(response);
  }
  
  // For other errors, return 500
  return res.status(500).json({
    success: false,
    error: error.message || 'Server xatosi',
    offline: true
  });
};

export const offlineMockData = {
  patients: [
    {
      id: 1,
      patient_number: 'P001',
      first_name: 'Offline',
      last_name: 'Patient',
      middle_name: 'Test',
      phone: '+998901234567',
      birth_date: '1990-01-01',
      gender: 'male',
      current_balance: 0,
      is_blocked: false,
      created_at: new Date().toISOString()
    }
  ],
  
  staff: [
    {
      id: 1,
      user_id: 1,
      first_name: 'Offline',
      last_name: 'Doctor',
      specialization: 'General',
      phone: '+998901234567',
      is_active: true
    }
  ],
  
  queue: [],
  
  billing: [],
  
  services: [
    {
      id: 1,
      name: 'Offline Service',
      price: 100000,
      category: 'General',
      is_active: true
    }
  ]
};
