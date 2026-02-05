const Doctors = () => {
  const doctors = [
    {
      name: 'Dr. Aziza Karimova',
      specialty: 'Ichki kasalliklar va Jarrohlik',
      badge: 'Katta Jarroh',
      image: 'https://i.pravatar.cc/400?img=10'
    },
    {
      name: 'Dr. Bobur Rahimov',
      specialty: 'Profilaktik Kardiologiya',
      badge: 'Kardiolog',
      image: 'https://i.pravatar.cc/400?img=12'
    },
    {
      name: 'Dr. Dilnoza Alimova',
      specialty: 'Bolalar Salomatligi',
      badge: 'Pediatr',
      image: 'https://i.pravatar.cc/400?img=9'
    },
    {
      name: 'Dr. Jamshid Tursunov',
      specialty: 'Ilg\'or Nevrologiya',
      badge: 'Nevrolog',
      image: 'https://i.pravatar.cc/400?img=13'
    }
  ];

  return (
    <section id="doctors" className="max-w-[1200px] mx-auto px-4 sm:px-6 py-12 sm:py-16 md:py-24">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 sm:mb-12 gap-4 sm:gap-6">
        <div className="max-w-xl">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-black tracking-tight mb-3 sm:mb-4 text-[#111418] dark:text-white">
            Mutaxassislarimiz Bilan Tanishing
          </h2>
          <p className="text-[#617589] dark:text-gray-400 text-sm sm:text-base">
            Jahon darajasidagi shifokorlarimiz ko'p yillik klinik tajriba va bemorga g'amxo'rlik yondashuvini birlashtiradi.
          </p>
        </div>
        
        <div className="flex items-center gap-3 sm:gap-4">
          <button className="size-10 sm:size-12 rounded-full border border-[#dbe0e6] dark:border-gray-700 flex items-center justify-center hover:bg-white dark:hover:bg-gray-800 transition-colors shadow-sm">
            <span className="material-symbols-outlined text-xl sm:text-2xl">arrow_back</span>
          </button>
          <button className="size-10 sm:size-12 rounded-full border border-[#dbe0e6] dark:border-gray-700 flex items-center justify-center hover:bg-white dark:hover:bg-gray-800 transition-colors shadow-sm">
            <span className="material-symbols-outlined text-xl sm:text-2xl">arrow_forward</span>
          </button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {doctors.map((doctor, index) => (
          <div key={index} className="group">
            <div className="relative w-full aspect-[3/4] rounded-xl sm:rounded-2xl overflow-hidden bg-gray-100 mb-4 sm:mb-6">
              <img 
                src={doctor.image}
                alt={doctor.name}
                className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute top-3 sm:top-4 left-3 sm:left-4">
                <span className="bg-primary text-white text-[9px] sm:text-[10px] font-black uppercase tracking-widest px-2 sm:px-3 py-1 rounded-full">
                  {doctor.badge}
                </span>
              </div>
            </div>
            
            <div>
              <h5 className="text-lg sm:text-xl font-bold mb-1">{doctor.name}</h5>
              <p className="text-[#617589] dark:text-gray-400 text-xs sm:text-sm mb-3 sm:mb-4">{doctor.specialty}</p>
              <button className="w-full py-2.5 sm:py-3 rounded-lg sm:rounded-xl border border-primary/20 text-primary font-bold text-xs sm:text-sm hover:bg-primary hover:text-white transition-all">
                Profilni Ko'rish
              </button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default Doctors;
