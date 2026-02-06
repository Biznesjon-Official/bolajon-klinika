import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Always staff login (no patient login from web)
      const result = await login(formData.username, formData.password, false);
      
      if (result.success) {
        // Redirect based on role
        const roleName = result.user?.role?.name || result.user?.role_name;
        
        if (roleName === 'admin') {
          navigate('/dashboard');
        } else if (roleName === 'doctor') {
          navigate('/doctor');
        } else if (roleName === 'nurse') {
          navigate('/nurse');
        } else if (roleName === 'laborant') {
          navigate('/lab');
        } else if (roleName === 'pharmacist') {
          navigate('/pharmacy');
        } else if (roleName === 'sanitar') {
          navigate('/sanitar');
        } else if (roleName === 'receptionist') {
          navigate('/reception');
        } else {
          navigate('/dashboard');
        }
      } else {
        setError(result.message || 'Login yoki parol noto\'g\'ri');
      }
    } catch (err) {
      console.error('Login error:', err);
      setError(
        err.response?.data?.message || 
        'Tizimga kirishda xatolik yuz berdi. Iltimos, qaytadan urinib ko\'ring.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 via-indigo-50 to-purple-50 dark:bg-gradient-to-br dark:from-gray-900 dark:via-blue-900 dark:to-purple-900 px-4 py-8">
      <div className="w-full max-w-md">
        {/* Logo va Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <img 
              src="/image.jpg?v=20250204"
              alt="Klinika Logo" 
              className="h-24 w-auto object-contain"
            />
          </div>
          <h1 className="text-3xl font-black text-gray-900 dark:text-white mb-2">
            Xush kelibsiz! 
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Tizimga kirish uchun ma'lumotlaringizni kiriting
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-white dark:bg-slate-700 rounded-3xl shadow-2xl p-8 backdrop-blur-sm border border-gray-100 dark:border-slate-600">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Username */}
            <div>
              <label htmlFor="username" className="block text-sm font-bold text-gray-700 dark:text-gray-200 mb-2">
                Login
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-300">
                  <span className="material-symbols-outlined text-xl">person</span>
                </span>
                <input
                  type="text"
                  id="username"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  required
                  autoFocus
                  className="w-full pl-12 pr-4 py-4 bg-gray-50 dark:bg-slate-600 border-2 border-gray-200 dark:border-slate-500 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary transition-all text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-300"
                  placeholder="Loginni kiriting"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-sm font-bold text-gray-700 dark:text-gray-200 mb-2">
                Parol
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-300">
                  <span className="material-symbols-outlined text-xl">lock</span>
                </span>
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  className="w-full pl-12 pr-12 py-4 bg-gray-50 dark:bg-slate-600 border-2 border-gray-200 dark:border-slate-500 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary transition-all text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-300"
                  placeholder="Parolni kiriting"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-300 hover:text-gray-600 dark:hover:text-gray-100 transition-colors"
                >
                  <span className="material-symbols-outlined text-xl">
                    {showPassword ? 'visibility_off' : 'visibility'}
                  </span>
                </button>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 border-2 border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-xl text-sm flex items-start gap-3">
                <span className="material-symbols-outlined text-lg mt-0.5">error</span>
                <span>{error}</span>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-primary to-green-600 hover:from-green-600 hover:to-primary text-white font-bold py-4 px-4 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-primary/30 hover:shadow-xl hover:shadow-primary/40 hover:scale-[1.02] active:scale-[0.98] transform"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Yuklanmoqda...
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  <span className="material-symbols-outlined text-xl">login</span>
                  Kirish
                </span>
              )}
            </button>
          </form>
        </div>

        {/* Back to Home */}
        <div className="mt-6 text-center">
          <Link 
            to="/" 
            className="inline-flex items-center gap-2 text-sm font-semibold text-gray-600 dark:text-gray-300 hover:text-primary dark:hover:text-primary transition-colors group"
          >
            <span className="material-symbols-outlined text-lg group-hover:-translate-x-1 transition-transform">arrow_back</span>
            Bosh sahifaga qaytish
          </Link>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-gray-500 dark:text-gray-400 mt-8">
          © 2024 Bolajon klinikasi. Barcha huquqlar himoyalangan.
        </p>
      </div>
    </div>
  );
};

export default Login;
