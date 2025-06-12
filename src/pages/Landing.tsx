
import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Server, Shield, Bell, BarChart3, Check } from 'lucide-react';
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
                FlowServ
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
              Monitore seus servidores com{' '}
              <span className="text-blue-600 dark:text-blue-400">inteligência</span>
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-400 mb-8 max-w-3xl mx-auto">
              Tenha controle total sobre seus servidores na nuvem com alertas em tempo real, 
              métricas avançadas e notificações inteligentes.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/register">
                <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3">
                  Começar Grátis por 7 dias
                </Button>
              </Link>
              <Link to="/login">
                <Button size="lg" variant="outline" className="border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 px-8 py-3">
                  Fazer Login
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="py-20 bg-white dark:bg-gray-800">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h3 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
                Recursos Poderosos
              </h3>
              <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
                Tudo que você precisa para manter seus servidores funcionando perfeitamente
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              <Card className="bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600">
                <CardHeader>
                  <Server className="h-10 w-10 text-blue-600 dark:text-blue-400 mb-4" />
                  <CardTitle className="text-gray-900 dark:text-white">Monitoramento</CardTitle>
                  <CardDescription className="text-gray-600 dark:text-gray-400">
                    Acompanhe CPU, memória, disco e rede em tempo real
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card className="bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600">
                <CardHeader>
                  <Bell className="h-10 w-10 text-blue-600 dark:text-blue-400 mb-4" />
                  <CardTitle className="text-gray-900 dark:text-white">Alertas Inteligentes</CardTitle>
                  <CardDescription className="text-gray-600 dark:text-gray-400">
                    Receba notificações por email e WhatsApp quando necessário
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card className="bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600">
                <CardHeader>
                  <BarChart3 className="h-10 w-10 text-blue-600 dark:text-blue-400 mb-4" />
                  <CardTitle className="text-gray-900 dark:text-white">Relatórios</CardTitle>
                  <CardDescription className="text-gray-600 dark:text-gray-400">
                    Gráficos e métricas detalhadas para análise
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card className="bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600">
                <CardHeader>
                  <Shield className="h-10 w-10 text-blue-600 dark:text-blue-400 mb-4" />
                  <CardTitle className="text-gray-900 dark:text-white">Segurança</CardTitle>
                  <CardDescription className="text-gray-600 dark:text-gray-400">
                    Dados protegidos e conformidade garantida
                  </CardDescription>
                </CardHeader>
              </Card>
            </div>
          </div>
        </section>

        {/* Pricing */}
        <section className="py-20 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <h3 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
                Planos que se adaptam ao seu negócio
              </h3>
              <p className="text-lg text-gray-600 dark:text-gray-400">
                Comece grátis e escale conforme necessário
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
              {/* Free Plan */}
              <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                <CardHeader>
                  <CardTitle className="text-center text-gray-900 dark:text-white">Gratuito</CardTitle>
                  <div className="text-center">
                    <span className="text-3xl font-bold text-gray-900 dark:text-white">Grátis</span>
                    <p className="text-sm text-gray-600 dark:text-gray-400">por 7 dias</p>
                  </div>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3 mb-6">
                    <li className="flex items-center text-gray-700 dark:text-gray-300">
                      <Check className="h-4 w-4 text-green-500 mr-2" />
                      Até 1 servidor
                    </li>
                    <li className="flex items-center text-gray-700 dark:text-gray-300">
                      <Check className="h-4 w-4 text-green-500 mr-2" />
                      Métricas básicas
                    </li>
                    <li className="flex items-center text-gray-700 dark:text-gray-300">
                      <Check className="h-4 w-4 text-green-500 mr-2" />
                      Alertas por email
                    </li>
                  </ul>
                  <Link to="/register" className="block">
                    <Button className="w-full bg-gray-600 hover:bg-gray-700 text-white">
                      Começar Grátis
                    </Button>
                  </Link>
                </CardContent>
              </Card>

              {/* Pro Plan */}
              <Card className="relative bg-white dark:bg-gray-800 border-blue-500 dark:border-blue-400 shadow-lg">
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <span className="bg-blue-600 text-white px-4 py-1 rounded-full text-sm">
                    Mais Popular
                  </span>
                </div>
                <CardHeader>
                  <CardTitle className="text-center text-gray-900 dark:text-white">Profissional</CardTitle>
                  <div className="text-center">
                    <span className="text-3xl font-bold text-gray-900 dark:text-white">R$ 99</span>
                    <span className="text-gray-600 dark:text-gray-400">/mês</span>
                  </div>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3 mb-6">
                    <li className="flex items-center text-gray-700 dark:text-gray-300">
                      <Check className="h-4 w-4 text-green-500 mr-2" />
                      Até 2 servidores
                    </li>
                    <li className="flex items-center text-gray-700 dark:text-gray-300">
                      <Check className="h-4 w-4 text-green-500 mr-2" />
                      Métricas avançadas
                    </li>
                    <li className="flex items-center text-gray-700 dark:text-gray-300">
                      <Check className="h-4 w-4 text-green-500 mr-2" />
                      1 instância WhatsApp
                    </li>
                    <li className="flex items-center text-gray-700 dark:text-gray-300">
                      <Check className="h-4 w-4 text-green-500 mr-2" />
                      Suporte prioritário
                    </li>
                  </ul>
                  <Link to="/register" className="block">
                    <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white">
                      Escolher Plano
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
                  </div>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3 mb-6">
                    <li className="flex items-center text-gray-700 dark:text-gray-300">
                      <Check className="h-4 w-4 text-green-500 mr-2" />
                      Servidores ilimitados
                    </li>
                    <li className="flex items-center text-gray-700 dark:text-gray-300">
                      <Check className="h-4 w-4 text-green-500 mr-2" />
                      Recursos ilimitados
                    </li>
                    <li className="flex items-center text-gray-700 dark:text-gray-300">
                      <Check className="h-4 w-4 text-green-500 mr-2" />
                      1 instância WhatsApp
                    </li>
                    <li className="flex items-center text-gray-700 dark:text-gray-300">
                      <Check className="h-4 w-4 text-green-500 mr-2" />
                      Suporte dedicado
                    </li>
                    <li className="flex items-center text-gray-700 dark:text-gray-300">
                      <Check className="h-4 w-4 text-green-500 mr-2" />
                      SLA garantido
                    </li>
                  </ul>
                  <Link to="/register" className="block">
                    <Button className="w-full bg-purple-600 hover:bg-purple-700 text-white">
                      Escolher Plano
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Landing;
