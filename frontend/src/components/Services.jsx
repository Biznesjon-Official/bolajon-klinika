const Services = () => {
  const services = [
    {
      icon: 'favorite',
      title: 'Kardiologiya',
      description: 'Yurak salomatligi monitoringi, diagnostika va barcha yoshdagi bemorlar uchun individual davolash rejalari.'
    },
    {
      icon: 'biotech',
      title: 'Ultratovush',
      description: 'Aniq klinik natijalar uchun eng zamonaviy texnologiya yordamida yuqori aniqlikdagi diagnostik tasvirlash.'
    },
    {
      icon: 'science',
      title: 'Laboratoriya Tahlillari',
      description: 'Tez va keng qamrovli klinik laboratoriya diagnostikasi raqamli natijalarni uzatish bilan.'
    }
  ];

  return (
    <section id="services" className="bg-white dark:bg-[#15212d] py-12 sm:py-16 md:py-20 border-y border-[#dbe0e6] dark:border-gray-800">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-4 sm:px-6 lg:px-4 sm:px-6 lg:px-8 sm:px-4 sm:px-6 lg:px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-col sm:flex-row md:items-end justify-between mb-8 sm:mb-12 gap-3 sm:gap-4">
          <div className="flex flex-col gap-2 sm:gap-2 sm:gap-3">
            <h2 className="text-primary font-bold uppercase tracking-widest text-xs">Bizning Tajribamiz</h2>
            <h3 className="text-2xl sm:text-2xl sm:text-3xl md:text-3xl sm:text-4xl font-black tracking-tight">Maxsus Xizmatlar</h3>
          </div>
          <a className="text-primary font-bold text-sm sm:text-sm sm:text-base flex items-center gap-1 hover:underline underline-offset-4 w-fit" href="#">
            Barcha Xizmatlar
            <span className="material-symbols-outlined text-sm sm:text-sm sm:text-base">arrow_forward</span>
          </a>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 sm:gap-4 sm:gap-6 md:gap-4 sm:gap-6 lg:gap-8">
          {services.map((service, index) => (
            <div key={index} className="group flex flex-col gap-3 sm:gap-4 sm:gap-4 sm:gap-6 rounded-lg sm:rounded-xl sm:rounded-xl sm:rounded-2xl border border-[#dbe0e6] dark:border-gray-700 bg-background-light dark:bg-background-dark p-4 sm:p-6 sm:p-4 sm:p-6 lg:p-8 hover:border-primary/50 hover:shadow-xl hover:shadow-primary/5 transition-all">
              <div className="size-12 sm:size-14 rounded-lg sm:rounded-xl bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-colors">
                <span className="material-symbols-outlined text-2xl sm:text-2xl sm:text-3xl">{service.icon}</span>
              </div>
              
              <div className="flex flex-col gap-2 sm:gap-2 sm:gap-3 sm:gap-2 sm:gap-3">
                <h4 className="text-lg sm:text-lg sm:text-xl font-bold">{service.title}</h4>
                <p className="text-[#617589] dark:text-gray-400 text-sm sm:text-sm sm:text-base leading-relaxed">
                  {service.description}
                </p>
              </div>
              
              <div className="pt-2 sm:pt-4 mt-auto">
                <button className="text-sm sm:text-sm sm:text-base font-bold flex items-center gap-2 sm:gap-2 sm:gap-3 group-hover:text-primary transition-colors">
                  Batafsil
                  <span className="material-symbols-outlined text-sm sm:text-base">chevron_right</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Services;
