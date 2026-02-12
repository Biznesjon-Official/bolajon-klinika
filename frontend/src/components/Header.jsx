import { Link } from 'react-router-dom';
import { useState } from 'react';

const Header = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-background-light/80 dark:bg-background-dark/80 backdrop-blur-md border-b border-[#dbe0e6] dark:border-gray-800">
      <div className="max-w-[1200px] mx-auto flex items-center justify-between px-4 sm:px-4 sm:px-6 lg:px-4 sm:px-6 lg:px-8 sm:px-4 sm:px-6 lg:px-4 sm:px-6 lg:px-8 py-2 sm:py-3 sm:py-3 sm:py-4">
        <div className="flex items-center gap-2 sm:gap-2 sm:gap-3 sm:gap-2 sm:gap-3">
          <img 
            src="/image.jpg" 
            alt="Bolajon Klinika Logo" 
            className="size-8 sm:size-10 rounded-lg sm:rounded-lg sm:rounded-xl object-cover shadow-sm"
          />
          <h2 className="text-lg sm:text-lg sm:text-xl font-black tracking-tight">Bolajon klinikasi</h2>
        </div>
        
        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-4 sm:gap-6 lg:gap-4 sm:gap-6 lg:gap-8">
          <a className="text-sm sm:text-sm sm:text-base font-semibold hover:text-primary transition-colors" href="#hero">Bosh sahifa</a>
          <a className="text-sm sm:text-sm sm:text-base font-semibold hover:text-primary transition-colors" href="#services">Xizmatlar</a>
          <a className="text-sm sm:text-sm sm:text-base font-semibold hover:text-primary transition-colors" href="#doctors">Shifokorlar</a>
          <Link to="/login" className="text-sm sm:text-sm sm:text-base font-semibold hover:text-primary transition-colors">Portal</Link>
        </nav>
        
        <div className="flex items-center gap-2 sm:gap-2 sm:gap-3 sm:gap-3 sm:gap-4">
          <Link to="/login" className="bg-primary text-white text-xs sm:text-sm sm:text-sm sm:text-base font-bold px-3 sm:px-5 py-2 sm:py-2.5 sm:py-2 sm:py-2.5.5 rounded-lg sm:rounded-lg sm:rounded-xl hover:opacity-90 transition-all">
            Kirish
          </Link>
          
          {/* Mobile Menu Button */}
          <button 
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden sm:block p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg sm:rounded-lg sm:rounded-xl transition-colors"
          >
            <span className="material-symbols-outlined text-xl sm:text-2xl">
              {mobileMenuOpen ? 'close' : 'menu'}
            </span>
          </button>
        </div>
      </div>
      
      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden sm:block absolute top-full left-0 right-0 border-t border-[#dbe0e6] dark:border-gray-800 bg-background-light/95 dark:bg-background-dark/95 backdrop-blur-md shadow-lg">
          <nav className="flex flex-col px-4 sm:px-4 sm:px-6 lg:px-4 sm:px-6 lg:px-8 py-3 sm:py-4 gap-2 sm:gap-2 sm:gap-3">
            <a 
              className="text-sm sm:text-sm sm:text-base font-semibold hover:text-primary transition-colors py-2 sm:py-3 px-4 sm:px-4 sm:px-6 lg:px-4 sm:px-6 lg:px-8 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg sm:rounded-lg sm:rounded-xl" 
              href="#hero"
              onClick={() => setMobileMenuOpen(false)}
            >
              Bosh sahifa
            </a>
            <a 
              className="text-sm sm:text-sm sm:text-base font-semibold hover:text-primary transition-colors py-2 sm:py-3 px-4 sm:px-4 sm:px-6 lg:px-4 sm:px-6 lg:px-8 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg sm:rounded-lg sm:rounded-xl" 
              href="#services"
              onClick={() => setMobileMenuOpen(false)}
            >
              Xizmatlar
            </a>
            <a 
              className="text-sm sm:text-sm sm:text-base font-semibold hover:text-primary transition-colors py-2 sm:py-3 px-4 sm:px-4 sm:px-6 lg:px-4 sm:px-6 lg:px-8 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg sm:rounded-lg sm:rounded-xl" 
              href="#doctors"
              onClick={() => setMobileMenuOpen(false)}
            >
              Shifokorlar
            </a>
            <Link 
              to="/login" 
              className="text-sm sm:text-sm sm:text-base font-semibold hover:text-primary transition-colors py-2 sm:py-3 px-4 sm:px-4 sm:px-6 lg:px-4 sm:px-6 lg:px-8 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg sm:rounded-lg sm:rounded-xl"
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
