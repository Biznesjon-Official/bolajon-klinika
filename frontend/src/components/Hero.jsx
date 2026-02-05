const Hero = () => {
  return (
    <section id="hero" className="max-w-[1200px] mx-auto px-4 sm:px-6 py-8 sm:py-12 md:py-16 lg:py-24">
      <div className="flex flex-col gap-8 lg:gap-10 lg:flex-row lg:items-center">
        <div className="flex flex-col gap-6 sm:gap-8 flex-1 order-2 lg:order-1">
          <div className="flex flex-col gap-3 sm:gap-4">
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold w-fit uppercase tracking-wider">
              <span className="material-symbols-outlined text-sm">verified</span>
              Premium Xizmat
            </span>
            
            <h1 className="text-[#111418] dark:text-white text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black leading-[1.1] tracking-tight">
              Zamonaviy <br />
              Tibbiy <br />
              <span className="text-primary">Yechimlar.</span>
            </h1>
            
            <p className="text-[#617589] dark:text-gray-400 text-base sm:text-lg md:text-xl max-w-[500px] leading-relaxed">
              Sizning sog'ligingiz uchun eng zamonaviy tibbiy xizmatlar va professional shifokorlar jamoasi.
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row flex-wrap gap-3 sm:gap-4 items-stretch sm:items-center">
            <a href="/login" className="flex min-w-[180px] cursor-pointer items-center justify-center rounded-xl h-12 sm:h-14 px-5 sm:px-6 bg-primary text-white text-sm sm:text-base font-bold shadow-lg shadow-primary/20 hover:translate-y-[-2px] transition-all active:scale-95">
              Kirish
            </a>
            
            <a href="/login" className="flex min-w-[140px] cursor-pointer items-center justify-center rounded-xl h-12 sm:h-14 px-5 sm:px-6 bg-white dark:bg-gray-800 border border-[#dbe0e6] dark:border-gray-700 text-[#111418] dark:text-white text-sm sm:text-base font-bold hover:bg-gray-50 dark:hover:bg-gray-700 transition-all">
              Tahlil Natijalari
            </a>
            
            <a href="/login" className="flex cursor-pointer items-center justify-center rounded-xl h-12 sm:h-14 px-5 sm:px-6 bg-transparent text-[#111418] dark:text-white gap-2 text-sm sm:text-base font-bold hover:bg-primary/5 transition-all">
              <span className="material-symbols-outlined text-primary">auto_awesome</span>
              AI Maslahatchi
            </a>
          </div>
        </div>
        
        <div className="w-full flex-1 order-1 lg:order-2">
          <div className="relative w-full aspect-square sm:aspect-[4/3] md:aspect-[4/5] rounded-2xl sm:rounded-3xl overflow-hidden shadow-2xl group">
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent z-10"></div>
            <img 
              src="https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=800&q=80" 
              alt="Zamonaviy tibbiy muassasa"
              className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-700"
            />
            
            <div className="absolute bottom-4 sm:bottom-8 left-4 sm:left-8 right-4 sm:right-8 z-20 bg-white/10 backdrop-blur-lg border border-white/20 p-4 sm:p-6 rounded-xl sm:rounded-2xl">
              <div className="flex items-center gap-3 sm:gap-4">
                <div className="flex -space-x-2 sm:-space-x-3">
                  <div className="size-8 sm:size-10 rounded-full border-2 border-white bg-gray-200 overflow-hidden">
                    <img src="https://i.pravatar.cc/150?img=1" alt="Bemor" className="w-full h-full object-cover" />
                  </div>
                  <div className="size-8 sm:size-10 rounded-full border-2 border-white bg-gray-200 overflow-hidden">
                    <img src="https://i.pravatar.cc/150?img=2" alt="Bemor" className="w-full h-full object-cover" />
                  </div>
                  <div className="size-8 sm:size-10 rounded-full border-2 border-white bg-gray-200 overflow-hidden">
                    <img src="https://i.pravatar.cc/150?img=3" alt="Bemor" className="w-full h-full object-cover" />
                  </div>
                </div>
                <p className="text-white text-xs sm:text-sm font-medium">
                  Bu oyda 10,000+ faol bemor qo'shildi
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
