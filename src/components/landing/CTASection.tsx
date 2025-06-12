
import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

const CTASection = () => {
  return (
    <section className="py-16 bg-gradient-to-r from-blue-600 to-purple-600">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-white">
        <h3 className="text-3xl font-bold mb-4">
          Pronto para nunca mais ser pego de surpresa?
        </h3>
        <p className="text-xl mb-8 text-blue-100">
          Junte-se a milhares de empresas que já protegem sua infraestrutura com DeskTools
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link to="/register">
            <Button size="lg" className="bg-white text-blue-600 hover:bg-gray-100 px-8 py-3 text-lg font-semibold">
              🚀 Começar Grátis por 7 Dias
            </Button>
          </Link>
          <Link to="/register">
            <Button size="lg" variant="outline" className="border-white text-white hover:bg-white hover:text-blue-600 px-8 py-3 text-lg">
              💬 Falar com Especialista
            </Button>
          </Link>
        </div>
        <p className="text-sm text-blue-200 mt-4">
          ✅ Sem cartão de crédito • ✅ Cancelamento a qualquer momento • ✅ Suporte em português
        </p>
      </div>
    </section>
  );
};

export default CTASection;
