
import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Server, Code, Database, Smartphone, Bell, TrendingUp } from 'lucide-react';

const FeaturesSection = () => {
  return (
    <section className="py-20 bg-white dark:bg-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h3 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
            Todos os recursos que você precisa em uma só plataforma
          </h3>
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Monitoramento completo para toda sua infraestrutura com alertas inteligentes
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border-blue-200 dark:border-blue-700">
            <CardHeader>
              <Server className="h-10 w-10 text-blue-600 dark:text-blue-400 mb-4" />
              <CardTitle className="text-gray-900 dark:text-white">🖥️ Monitoramento de Servidores</CardTitle>
              <CardDescription className="text-gray-600 dark:text-gray-400">
                CPU, RAM, disco, rede e processos em tempo real. Nunca mais seja pego de surpresa!
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 border-green-200 dark:border-green-700">
            <CardHeader>
              <Code className="h-10 w-10 text-green-600 dark:text-green-400 mb-4" />
              <CardTitle className="text-gray-900 dark:text-white">⚡ Monitoramento de Aplicações</CardTitle>
              <CardDescription className="text-gray-600 dark:text-gray-400">
                Node.js, WordPress, PHP, Docker e mais. Monitore logs, erros e performance das suas apps.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 border-purple-200 dark:border-purple-700">
            <CardHeader>
              <Database className="h-10 w-10 text-purple-600 dark:text-purple-400 mb-4" />
              <CardTitle className="text-gray-900 dark:text-white">🗄️ Monitoramento de Banco de Dados</CardTitle>
              <CardDescription className="text-gray-600 dark:text-gray-400">
                Conexões ativas, queries lentas, espaço em disco. Mantenha seus dados sempre disponíveis.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-900/20 dark:to-yellow-800/20 border-yellow-200 dark:border-yellow-700">
            <CardHeader>
              <Smartphone className="h-10 w-10 text-yellow-600 dark:text-yellow-400 mb-4" />
              <CardTitle className="text-gray-900 dark:text-white">📱 Alertas via WhatsApp</CardTitle>
              <CardDescription className="text-gray-600 dark:text-gray-400">
                Receba notificações instantâneas no WhatsApp quando algo der errado. Resposta rápida garantida!
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20 border-red-200 dark:border-red-700">
            <CardHeader>
              <Bell className="h-10 w-10 text-red-600 dark:text-red-400 mb-4" />
              <CardTitle className="text-gray-900 dark:text-white">🚨 Alertas Inteligentes</CardTitle>
              <CardDescription className="text-gray-600 dark:text-gray-400">
                Configuração flexível de alertas por email e WhatsApp. Apenas o que importa, quando importa.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="bg-gradient-to-br from-indigo-50 to-indigo-100 dark:from-indigo-900/20 dark:to-indigo-800/20 border-indigo-200 dark:border-indigo-700">
            <CardHeader>
              <TrendingUp className="h-10 w-10 text-indigo-600 dark:text-indigo-400 mb-4" />
              <CardTitle className="text-gray-900 dark:text-white">📊 Relatórios e Análises</CardTitle>
              <CardDescription className="text-gray-600 dark:text-gray-400">
                Gráficos detalhados, histórico de performance e insights para otimizar sua infraestrutura.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
