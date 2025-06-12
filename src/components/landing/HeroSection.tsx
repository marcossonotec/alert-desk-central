
import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Shield, Clock, Zap } from 'lucide-react';

const HeroSection = () => {
  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto text-center">
        <h2 className="text-4xl md:text-6xl font-bold text-gray-900 dark:text-white mb-6">
          Monitore seus servidores e aplicações com{' '}
          <span className="text-blue-600 dark:text-blue-400">total autonomia</span>
        </h2>
        <p className="text-xl text-gray-600 dark:text-gray-400 mb-8 max-w-3xl mx-auto">
          Plataforma completa de monitoramento para servidores, aplicações e bancos de dados. 
          Alertas inteligentes via WhatsApp, métricas em tempo real e controle total da sua infraestrutura.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
          <Link to="/register">
            <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 text-lg">
              🚀 Começar Grátis - 7 Dias
            </Button>
          </Link>
          <Link to="/login">
            <Button size="lg" variant="outline" className="border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 px-8 py-3 text-lg">
              Fazer Login
            </Button>
          </Link>
        </div>
        
        {/* Trust badges */}
        <div className="flex flex-wrap justify-center items-center gap-8 text-sm text-gray-500 dark:text-gray-400">
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-green-500" />
            <span>100% Seguro</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-blue-500" />
            <span>Monitoramento 24/7</span>
          </div>
          <div className="flex items-center gap-2">
            <Zap className="h-4 w-4 text-yellow-500" />
            <span>Alertas Instantâneos</span>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
