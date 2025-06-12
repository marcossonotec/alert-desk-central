
import React from 'react';
import Footer from '@/components/Footer';
import LandingHeader from '@/components/landing/LandingHeader';
import HeroSection from '@/components/landing/HeroSection';
import ProblemSection from '@/components/landing/ProblemSection';
import FeaturesSection from '@/components/landing/FeaturesSection';
import BenefitsSection from '@/components/landing/BenefitsSection';
import PricingSection from '@/components/landing/PricingSection';
import CTASection from '@/components/landing/CTASection';

const Landing = () => {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col">
      <LandingHeader />
      
      <main className="flex-1">
        <HeroSection />
        <ProblemSection />
        <FeaturesSection />
        <BenefitsSection />
        <PricingSection />
        <CTASection />
      </main>

      <Footer />
    </div>
  );
};

export default Landing;
