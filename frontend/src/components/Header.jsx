import { Link } from 'react-router-dom';
import { useState } from 'react';

const Header = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-background-light/80 dark:bg-background-dark/80 backdrop-blur-md border-b border-[#dbe0e6] dark:border-gray-800">
      <div className="max-w-[1200px] mx-auto flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4">
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="text-primary">
            <svg className="size-7 sm:size-8" fill="currentColor" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
              <path d="M24 45.8096C19.6865 45.8096 15.4698 44.5305 11.8832 42.134C8.29667 39.7376 5.50128 36.3314 3.85056 32.3462C2.19985 28.361 1.76794 23.9758 2.60947 19.7452C3.451 15.5145 5.52816 11.6284 8.57829 8.5783C11.6284 5.52817 15.5145 3.45101 19.7452 2.60948C23.9758 1.76795 28.361 2.19986 32.3462 3.85057C36.3314 5.50129 39.7376 8.29668 42.134 11.8833C44.5305 15.4698 45.8096 19.6865 45.8096 24L24 24L24 45.8096Z"></path>
            </svg>
          </div>
          <h2 className="text-lg sm:text-xl font-black tracking-tight">Bolajon klinikasi</h2>
        </div>
        
        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-6 lg:gap-8">
          <a className="text-sm font-semibold hover:text-primary transition-colors" href="#hero">Bosh sahifa</a>
          <a className="text-sm font-semibold hover:text-primary transition-colors" href="#services">Xizmatlar</a>
          <a className="text-sm font-semibold hover:text-primary transition-colors" href="#doctors">Shifokorlar</a>
          <Link to="/login" className="text-sm font-semibold hover:text-primary transition-colors">Portal</Link>
        </nav>
        
        <div className="flex items-center gap-2 sm:gap-4">
          <Link to="/login" className="bg-primary text-white text-xs sm:text-sm font-bold px-3 sm:px-5 py-2 sm:py-2.5 rounded-lg hover:opacity-90 transition-all">
            Kirish
          </Link>
          
          {/* Mobile Menu Button */}
          <button 
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
          >
            <span className="material-symbols-outlined text-2xl">
              {mobileMenuOpen ? 'close' : 'menu'}
            </span>
          </button>
        </div>
      </div>
      
      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden absolute top-full left-0 right-0 border-t border-[#dbe0e6] dark:border-gray-800 bg-background-light/95 dark:bg-background-dark/95 backdrop-blur-md shadow-lg">
          <nav className="flex flex-col px-4 py-4 gap-2">
            <a 
              className="text-sm font-semibold hover:text-primary transition-colors py-3 px-4 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg" 
              href="#hero"
              onClick={() => setMobileMenuOpen(false)}
            >
              Bosh sahifa
            </a>
            <a 
              className="text-sm font-semibold hover:text-primary transition-colors py-3 px-4 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg" 
              href="#services"
              onClick={() => setMobileMenuOpen(false)}
            >
              Xizmatlar
            </a>
            <a 
              className="text-sm font-semibold hover:text-primary transition-colors py-3 px-4 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg" 
              href="#doctors"
              onClick={() => setMobileMenuOpen(false)}
            >
              Shifokorlar
            </a>
            <Link 
              to="/login" 
              className="text-sm font-semibold hover:text-primary transition-colors py-3 px-4 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg"
              onClick={() => setMobileMenuOpen(false)}
            >
              Portal
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
};

export default Header;
