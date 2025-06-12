
import React from 'react';

const BenefitsSection = () => {
  return (
    <section className="py-16 bg-blue-600">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-white">
        <h3 className="text-3xl font-bold mb-8">
          Por que mais de 1.000+ empresas confiam no DeskTools?
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <div className="text-4xl font-bold mb-2">99.9%</div>
            <div className="text-blue-100">Uptime garantido</div>
          </div>
          <div>
            <div className="text-4xl font-bold mb-2">30s</div>
            <div className="text-blue-100">Tempo de resposta dos alertas</div>
          </div>
          <div>
            <div className="text-4xl font-bold mb-2">24/7</div>
            <div className="text-blue-100">Suporte especializado</div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default BenefitsSection;
