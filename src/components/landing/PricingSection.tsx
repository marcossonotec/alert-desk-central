
import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Check } from 'lucide-react';

const PricingSection = () => {
  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h3 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
            Planos que se pagam sozinhos
          </h3>
          <p className="text-lg text-gray-600 dark:text-gray-400 mb-4">
            Evite uma única hora de downtime e o plano já valeu a pena
          </p>
          <div className="inline-flex items-center gap-2 bg-green-100 dark:bg-green-900/30 px-4 py-2 rounded-lg text-green-700 dark:text-green-400">
            <span className="font-semibold">💰 ROI comprovado:</span> 
            <span>Economize até 90% em custos de downtime</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {/* Free Plan */}
          <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
            <CardHeader>
              <CardTitle className="text-center text-gray-900 dark:text-white">Teste Grátis</CardTitle>
              <div className="text-center">
                <span className="text-3xl font-bold text-gray-900 dark:text-white">Grátis</span>
                <p className="text-sm text-gray-600 dark:text-gray-400">por 7 dias completos</p>
              </div>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3 mb-6">
                <li className="flex items-center text-gray-700 dark:text-gray-300">
                  <Check className="h-4 w-4 text-green-500 mr-2" />
                  1 servidor monitorado
                </li>
                <li className="flex items-center text-gray-700 dark:text-gray-300">
                  <Check className="h-4 w-4 text-green-500 mr-2" />
                  Métricas básicas em tempo real
                </li>
                <li className="flex items-center text-gray-700 dark:text-gray-300">
                  <Check className="h-4 w-4 text-green-500 mr-2" />
                  Alertas por email
                </li>
                <li className="flex items-center text-gray-700 dark:text-gray-300">
                  <Check className="h-4 w-4 text-green-500 mr-2" />
                  Suporte por email
                </li>
              </ul>
              <Link to="/register" className="block">
                <Button className="w-full bg-gray-600 hover:bg-gray-700 text-white">
                  Começar Grátis Agora
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Pro Plan */}
          <Card className="relative bg-white dark:bg-gray-800 border-blue-500 dark:border-blue-400 shadow-lg transform scale-105">
            <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
              <span className="bg-blue-600 text-white px-4 py-1 rounded-full text-sm font-semibold">
                🔥 Mais Escolhido
              </span>
            </div>
            <CardHeader>
              <CardTitle className="text-center text-gray-900 dark:text-white">Profissional</CardTitle>
              <div className="text-center">
                <span className="text-3xl font-bold text-gray-900 dark:text-white">R$ 99</span>
                <span className="text-gray-600 dark:text-gray-400">/mês</span>
                <p className="text-sm text-green-600 dark:text-green-400 font-semibold">
                  💡 Economize R$ 1.000+ em downtime
                </p>
              </div>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3 mb-6">
                <li className="flex items-center text-gray-700 dark:text-gray-300">
                  <Check className="h-4 w-4 text-green-500 mr-2" />
                  Até 2 servidores + 3 aplicações
                </li>
                <li className="flex items-center text-gray-700 dark:text-gray-300">
                  <Check className="h-4 w-4 text-green-500 mr-2" />
                  Métricas avançadas e histórico
                </li>
                <li className="flex items-center text-gray-700 dark:text-gray-300">
                  <Check className="h-4 w-4 text-green-500 mr-2" />
                  Alertas WhatsApp (1 instância)
                </li>
                <li className="flex items-center text-gray-700 dark:text-gray-300">
                  <Check className="h-4 w-4 text-green-500 mr-2" />
                  Monitoramento de aplicações
                </li>
                <li className="flex items-center text-gray-700 dark:text-gray-300">
                  <Check className="h-4 w-4 text-green-500 mr-2" />
                  Suporte prioritário
                </li>
              </ul>
              <Link to="/register" className="block">
                <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white">
                  Escolher Profissional
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Enterprise Plan */}
          <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
            <CardHeader>
              <CardTitle className="text-center text-gray-900 dark:text-white">Empresarial</CardTitle>
              <div className="text-center">
                <span className="text-3xl font-bold text-gray-900 dark:text-white">R$ 497</span>
                <span className="text-gray-600 dark:text-gray-400">/mês</span>
                <p className="text-sm text-purple-600 dark:text-purple-400 font-semibold">
                  🚀 Para infraestruturas críticas
                </p>
              </div>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3 mb-6">
                <li className="flex items-center text-gray-700 dark:text-gray-300">
                  <Check className="h-4 w-4 text-green-500 mr-2" />
                  Servidores e aplicações ilimitados
                </li>
                <li className="flex items-center text-gray-700 dark:text-gray-300">
                  <Check className="h-4 w-4 text-green-500 mr-2" />
                  Todos os recursos premium
                </li>
                <li className="flex items-center text-gray-700 dark:text-gray-300">
                  <Check className="h-4 w-4 text-green-500 mr-2" />
                  WhatsApp + integração personalizada
                </li>
                <li className="flex items-center text-gray-700 dark:text-gray-300">
                  <Check className="h-4 w-4 text-green-500 mr-2" />
                  Suporte dedicado 24/7
                </li>
                <li className="flex items-center text-gray-700 dark:text-gray-300">
                  <Check className="h-4 w-4 text-green-500 mr-2" />
                  SLA 99.9% garantido
                </li>
              </ul>
              <Link to="/register" className="block">
                <Button className="w-full bg-purple-600 hover:bg-purple-700 text-white">
                  Escolher Empresarial
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
};

export default PricingSection;
