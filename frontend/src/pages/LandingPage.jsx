import Header from '../components/Header';
import Hero from '../components/Hero';
import Services from '../components/Services';
import Doctors from '../components/Doctors';
import Footer from '../components/Footer';
import AIChatbot from '../components/AIChatbot';

const LandingPage = () => {
  return (
    <div className="bg-background-light dark:bg-background-dark text-[#111418] dark:text-white min-h-screen">
      <div className="relative flex flex-col w-full overflow-x-hidden">
        <Header />
        <main className="flex-1">
          <Hero />
          <Services />
          <Doctors />
        </main>
        <Footer />
        <AIChatbot />
      </div>
    </div>
  );
};

export default LandingPage;
