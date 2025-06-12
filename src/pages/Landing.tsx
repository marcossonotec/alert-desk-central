
import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Server, Shield, Bell, BarChart3, Check, Code, Database, Globe, Smartphone, Zap, Clock, TrendingUp } from 'lucide-react';
import ThemeToggle from '@/components/ThemeToggle';
import Footer from '@/components/Footer';

const Landing = () => {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                DeskTools
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <ThemeToggle />
              <Link to="/login">
                <Button variant="ghost" className="text-gray-600 dark:text-gray-400">
                  Entrar
                </Button>
              </Link>
              <Link to="/register">
                <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                  Começar Grátis
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">
        {/* Hero Section */}
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

        {/* Problem/Solution Section */}
        <section className="py-16 bg-red-50 dark:bg-red-900/20">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h3 className="text-3xl font-bold text-red-600 dark:text-red-400 mb-6">
              ⚠️ Pare de perder dinheiro com servidores fora do ar!
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm">
                <h4 className="font-bold text-gray-900 dark:text-white mb-2">💸 Prejuízo por Downtime</h4>
                <p className="text-gray-600 dark:text-gray-400">Cada minuto offline = vendas perdidas</p>
              </div>
              <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm">
                <h4 className="font-bold text-gray-900 dark:text-white mb-2">😰 Stress Desnecessário</h4>
                <p className="text-gray-600 dark:text-gray-400">Descobrir problemas pelos clientes</p>
              </div>
              <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm">
                <h4 className="font-bold text-gray-900 dark:text-white mb-2">🔍 Falta de Visibilidade</h4>
                <p className="text-gray-600 dark:text-gray-400">Não saber o que está acontecendo</p>
              </div>
            </div>
            <div className="bg-green-100 dark:bg-green-900/30 p-6 rounded-lg">
              <h4 className="text-2xl font-bold text-green-700 dark:text-green-400 mb-2">
                ✅ DeskTools resolve tudo isso!
              </h4>
              <p className="text-green-600 dark:text-green-300">
                Seja o primeiro a saber quando algo der errado e resolva antes que afete seus clientes.
              </p>
            </div>
          </div>
        </section>

        {/* Features */}
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

        {/* Benefits Section */}
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

        {/* Pricing */}
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

        {/* CTA Section */}
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
      </main>

      <Footer />
    </div>
  );
};

export default Landing;
