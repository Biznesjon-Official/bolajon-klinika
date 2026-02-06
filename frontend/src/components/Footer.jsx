const Footer = () => {
  return (
    <footer className="bg-white dark:bg-background-dark py-12 sm:py-16 border-t border-[#dbe0e6] dark:border-gray-800">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 sm:gap-10 lg:gap-12 mb-8 sm:mb-12">
          <div className="col-span-1 sm:col-span-2 lg:col-span-1 flex flex-col gap-4 sm:gap-6">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="text-primary">
                <svg className="size-5 sm:size-6" fill="currentColor" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
                  <path d="M24 45.8096C19.6865 45.8096 15.4698 44.5305 11.8832 42.134C8.29667 39.7376 5.50128 36.3314 3.85056 32.3462C2.19985 28.361 1.76794 23.9758 2.60947 19.7452C3.451 15.5145 5.52816 11.6284 8.57829 8.5783C11.6284 5.52817 15.5145 3.45101 19.7452 2.60948C23.9758 1.76795 28.361 2.19986 32.3462 3.85057C36.3314 5.50129 39.7376 8.29668 42.134 11.8833C44.5305 15.4698 45.8096 19.6865 45.8096 24L24 24L24 45.8096Z"></path>
                </svg>
              </div>
              <h2 className="text-base sm:text-lg font-black tracking-tight">Bolajon klinikasi</h2>
            </div>
            <p className="text-xs sm:text-sm text-[#617589] dark:text-gray-400 leading-relaxed">
              Eng zamonaviy texnologiya va tajriba bilan yuqori sifatli, bemorga yo'naltirilgan tibbiy xizmat ko'rsatishga bag'ishlangan.
            </p>
          </div>
          
          <div>
            <h6 className="font-bold mb-4 sm:mb-6 text-sm sm:text-base">Tezkor Havolalar</h6>
            <ul className="flex flex-col gap-2 sm:gap-3 text-xs sm:text-sm text-[#617589] dark:text-gray-400">
              <li><a className="hover:text-primary transition-colors" href="#hero">Bosh sahifa</a></li>
              <li><a className="hover:text-primary transition-colors" href="#services">Xizmatlar</a></li>
              <li><a className="hover:text-primary transition-colors" href="#doctors">Shifokorlar</a></li>
              <li><a className="hover:text-primary transition-colors" href="/login">Bemor Portali</a></li>
            </ul>
          </div>
          
          <div>
            <h6 className="font-bold mb-4 sm:mb-6 text-sm sm:text-base">Resurslar</h6>
            <ul className="flex flex-col gap-2 sm:gap-3 text-xs sm:text-sm text-[#617589] dark:text-gray-400">
              <li><a className="hover:text-primary transition-colors" href="#">Tahlil Natijalari</a></li>
              <li><a className="hover:text-primary transition-colors" href="#">AI Yordamchi</a></li>
              <li><a className="hover:text-primary transition-colors" href="#">Maxfiylik Siyosati</a></li>
              <li><a className="hover:text-primary transition-colors" href="#">Yordam Markazi</a></li>
            </ul>
          </div>
          
          <div>
            <h6 className="font-bold mb-4 sm:mb-6 text-sm sm:text-base">Aloqa</h6>
            <ul className="flex flex-col gap-2 sm:gap-3 text-xs sm:text-sm text-[#617589] dark:text-gray-400">
              <li className="flex items-center gap-2">
                <span className="material-symbols-outlined text-base">call</span>
                +998 (71) 123-45-67
              </li>
              <li className="flex items-center gap-2">
                <span className="material-symbols-outlined text-base">mail</span>
                info@bolajon.uz
              </li>
              <li className="flex items-start gap-2">
                <span className="material-symbols-outlined text-base mt-0.5">location_on</span>
                <span>Toshkent sh., Amir Temur ko'chasi 123</span>
              </li>
            </ul>
          </div>
        </div>
        
        <div className="pt-6 sm:pt-8 border-t border-[#dbe0e6] dark:border-gray-800 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-[10px] sm:text-xs text-[#617589] dark:text-gray-500 text-center sm:text-left">
            © 2024 Bolajon klinikasi. Barcha huquqlar himoyalangan.
          </p>
          <div className="flex gap-4 sm:gap-6">
            <a className="text-[#617589] hover:text-primary transition-colors" href="#" aria-label="Website">
              <span className="material-symbols-outlined text-xl sm:text-2xl">public</span>
            </a>
            <a className="text-[#617589] hover:text-primary transition-colors" href="#" aria-label="Email">
              <span className="material-symbols-outlined text-xl sm:text-2xl">alternate_email</span>
            </a>
            <a className="text-[#617589] hover:text-primary transition-colors" href="#" aria-label="Phone">
              <span className="material-symbols-outlined text-xl sm:text-2xl">smartphone</span>
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
