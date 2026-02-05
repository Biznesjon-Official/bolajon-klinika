import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import useKeyboardShortcuts from '../hooks/useKeyboardShortcuts';

export default function QuickSearch() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef(null);
  const navigate = useNavigate();

  // Quick actions and pages
  const quickActions = [
    { id: 'dashboard', title: 'Dashboard', icon: 'dashboard', path: '/dashboard', keywords: ['asosiy', 'bosh sahifa'] },
    { id: 'patients', title: 'Bemorlar', icon: 'people', path: '/patients', keywords: ['bemor', 'patient'] },
    { id: 'queue', title: 'Navbat', icon: 'format_list_numbered', path: '/queue', keywords: ['navbat', 'queue'] },
    { id: 'doctor', title: 'Shifokor Panel', icon: 'medical_services', path: '/doctor-panel', keywords: ['shifokor', 'doctor'] },
    { id: 'nurse', title: 'Hamshira Panel', icon: 'medication', path: '/nurse-panel', keywords: ['hamshira', 'nurse'] },
    { id: 'pharmacy', title: 'Dorixona', icon: 'local_pharmacy', path: '/pharmacy', keywords: ['dorixona', 'dori', 'pharmacy'] },
    { id: 'laboratory', title: 'Laboratoriya', icon: 'science', path: '/laboratory', keywords: ['laboratoriya', 'tahlil', 'lab'] },
    { id: 'sanitar', title: 'Tozalovchi', icon: 'cleaning_services', path: '/sanitar', keywords: ['tozalovchi', 'sanitar'] },
    { id: 'staff', title: 'Xodimlar', icon: 'badge', path: '/staff', keywords: ['xodim', 'staff'] },
    { id: 'payroll', title: 'Maoshlar', icon: 'payments', path: '/payroll', keywords: ['maosh', 'payroll', 'salary'] },
    { id: 'reports', title: 'Hisobotlar', icon: 'assessment', path: '/reports', keywords: ['hisobot', 'report'] },
    { id: 'settings', title: 'Sozlamalar', icon: 'settings', path: '/settings', keywords: ['sozlama', 'settings'] },
  ];

  // Keyboard shortcuts
  useKeyboardShortcuts({
    'ctrl+k': () => {
      setIsOpen(true);
      setTimeout(() => inputRef.current?.focus(), 100);
    },
    'esc': () => {
      if (isOpen) {
        setIsOpen(false);
        setQuery('');
        setResults([]);
      }
    }
  });

  // Search logic
  useEffect(() => {
    if (!query.trim()) {
      setResults(quickActions.slice(0, 8));
      return;
    }

    const searchTerm = query.toLowerCase();
    const filtered = quickActions.filter(action => 
      action.title.toLowerCase().includes(searchTerm) ||
      action.keywords.some(keyword => keyword.includes(searchTerm))
    );

    setResults(filtered.slice(0, 8));
    setSelectedIndex(0);
  }, [query]);

  // Handle navigation
  const handleSelect = (action) => {
    navigate(action.path);
    setIsOpen(false);
    setQuery('');
  };

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(prev => (prev + 1) % results.length);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(prev => (prev - 1 + results.length) % results.length);
      } else if (e.key === 'Enter' && results[selectedIndex]) {
        e.preventDefault();
        handleSelect(results[selectedIndex]);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, results, selectedIndex]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 bg-black/50 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden animate-slideDown">
        {/* Search Input */}
        <div className="flex items-center gap-3 p-4 border-b border-gray-200 dark:border-gray-700">
          <span className="material-symbols-outlined text-gray-400 dark:text-gray-500 text-2xl">search</span>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Qidirish... (Ctrl+K)"
            className="flex-1 bg-transparent text-lg text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 outline-none"
            autoFocus
          />
          <kbd className="hidden sm:block px-2 py-1 text-xs font-semibold text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 rounded">ESC</kbd>
        </div>

        {/* Results */}
        <div className="max-h-96 overflow-y-auto">
          {results.length === 0 ? (
            <div className="p-8 text-center text-gray-500 dark:text-gray-400">
              <span className="material-symbols-outlined text-4xl mb-2">search_off</span>
              <p>Hech narsa topilmadi</p>
            </div>
          ) : (
            <div className="p-2">
              {results.map((action, index) => (
                <button
                  key={action.id}
                  onClick={() => handleSelect(action)}
                  className={`w-full flex items-center gap-4 p-3 rounded-lg transition-all ${
                    index === selectedIndex
                      ? 'bg-primary text-white'
                      : 'text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  <span className={`material-symbols-outlined text-2xl ${
                    index === selectedIndex ? 'text-white' : 'text-gray-400 dark:text-gray-500'
                  }`}>
                    {action.icon}
                  </span>
                  <div className="flex-1 text-left">
                    <p className="font-semibold">{action.title}</p>
                    <p className={`text-sm ${
                      index === selectedIndex ? 'text-white/80' : 'text-gray-500 dark:text-gray-400'
                    }`}>
                      {action.path}
                    </p>
                  </div>
                  {index === selectedIndex && (
                    <kbd className="px-2 py-1 text-xs font-semibold bg-white/20 rounded">↵</kbd>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-3 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 text-xs text-gray-500 dark:text-gray-400">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-white dark:bg-gray-700 rounded">↑</kbd>
              <kbd className="px-1.5 py-0.5 bg-white dark:bg-gray-700 rounded">↓</kbd>
              Tanlash
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-white dark:bg-gray-700 rounded">↵</kbd>
              Ochish
            </span>
          </div>
          <span className="flex items-center gap-1">
            <kbd className="px-1.5 py-0.5 bg-white dark:bg-gray-700 rounded">ESC</kbd>
            Yopish
          </span>
        </div>
      </div>
    </div>
  );
}
