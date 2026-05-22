import Navbar from './Navbar';
import Hero from './Hero';
import HeroImage from './HeroImage';
import Features from './Features';
import Modules from './Modules';
import Workflow from './Workflow';
import Roles from './Roles';
import Pricing from './Pricing';
import TechStack from './TechStack';
import CTA from './CTA';
import Footer from './Footer';

const LandingPage = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">
      <Navbar />
      <Hero />
      <HeroImage />
      <Features />
      <Modules />
      <Workflow />
      <Roles />
      <Pricing />
      <TechStack />
      <CTA />
      <Footer />
    </div>
  );
};

export default LandingPage;
