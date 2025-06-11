
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Monitor, Shield, Zap, Users, ArrowRight, CheckCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

const Landing = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      {/* Header */}
      <header className="border-b border-slate-700 bg-slate-800/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-2">
              <Monitor className="h-8 w-8 text-blue-400" />
              <span className="text-2xl font-bold text-white">FlowServ</span>
            </div>
            <div className="flex items-center space-x-4">
              <Link to="/login">
                <Button variant="outline" className="border-slate-600 text-slate-300 hover:bg-slate-700">
                  Entrar
                </Button>
              </Link>
              <Link to="/register">
                <Button className="bg-blue-600 hover:bg-blue-700">
                  Começar Agora
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-4xl sm:text-6xl font-bold text-white mb-6">
            Monitore seus servidores
            <span className="block text-blue-400">em tempo real</span>
          </h1>
          <p className="text-xl text-slate-300 mb-8 max-w-3xl mx-auto">
            Plataforma completa de monitoramento de servidores com alertas inteligentes, 
            métricas em tempo real e integração com principais provedores de cloud.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/register">
              <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-lg px-8 py-3">
                Começar Gratuitamente
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link to="/login">
              <Button size="lg" variant="outline" className="border-slate-600 text-slate-300 hover:bg-slate-700 text-lg px-8 py-3">
                Demo Admin
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-white mb-4">Recursos Principais</h2>
            <p className="text-slate-300 text-lg">Tudo que você precisa para monitorar sua infraestrutura</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <Monitor className="h-12 w-12 text-blue-400 mb-4" />
                <CardTitle className="text-white">Monitoramento em Tempo Real</CardTitle>
                <CardDescription className="text-slate-400">
                  Acompanhe CPU, memória, disco e rede dos seus servidores 24/7
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <Shield className="h-12 w-12 text-green-400 mb-4" />
                <CardTitle className="text-white">Alertas Inteligentes</CardTitle>
                <CardDescription className="text-slate-400">
                  Receba notificações por email e WhatsApp quando algo não estiver certo
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <Zap className="h-12 w-12 text-yellow-400 mb-4" />
                <CardTitle className="text-white">Integração Cloud</CardTitle>
                <CardDescription className="text-slate-400">
                  Suporte para Hetzner, AWS, DigitalOcean e outros provedores
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <Users className="h-12 w-12 text-purple-400 mb-4" />
                <CardTitle className="text-white">Multi-tenant</CardTitle>
                <CardDescription className="text-slate-400">
                  Perfeito para agências que gerenciam múltiplos clientes
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CheckCircle className="h-12 w-12 text-blue-400 mb-4" />
                <CardTitle className="text-white">Dashboard Completo</CardTitle>
                <CardDescription className="text-slate-400">
                  Interface intuitiva com métricas e gráficos em tempo real
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <Shield className="h-12 w-12 text-red-400 mb-4" />
                <CardTitle className="text-white">Segurança Avançada</CardTitle>
                <CardDescription className="text-slate-400">
                  Dados criptografados e acesso controlado por usuário
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-white mb-4">Planos e Preços</h2>
            <p className="text-slate-300 text-lg">Escolha o plano ideal para suas necessidades</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white text-2xl">Gratuito</CardTitle>
                <CardDescription className="text-slate-400">Perfeito para começar</CardDescription>
                <div className="text-3xl font-bold text-white mt-4">
                  R$ 0<span className="text-lg font-normal text-slate-400">/mês</span>
                </div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3 text-slate-300">
                  <li className="flex items-center">
                    <CheckCircle className="h-5 w-5 text-green-400 mr-2" />
                    Até 3 servidores
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-5 w-5 text-green-400 mr-2" />
                    Métricas básicas
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-5 w-5 text-green-400 mr-2" />
                    Alertas por email
                  </li>
                </ul>
                <Link to="/register" className="block mt-6">
                  <Button className="w-full bg-blue-600 hover:bg-blue-700">
                    Começar Grátis
                  </Button>
                </Link>
              </CardContent>
            </Card>

            <Card className="bg-slate-800/50 border-blue-500 border-2 relative">
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-blue-500 text-white px-4 py-1 rounded-full text-sm">
                Mais Popular
              </div>
              <CardHeader>
                <CardTitle className="text-white text-2xl">Profissional</CardTitle>
                <CardDescription className="text-slate-400">Para empresas em crescimento</CardDescription>
                <div className="text-3xl font-bold text-white mt-4">
                  R$ 29<span className="text-lg font-normal text-slate-400">/mês</span>
                </div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3 text-slate-300">
                  <li className="flex items-center">
                    <CheckCircle className="h-5 w-5 text-green-400 mr-2" />
                    Até 20 servidores
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-5 w-5 text-green-400 mr-2" />
                    Métricas avançadas
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-5 w-5 text-green-400 mr-2" />
                    Alertas WhatsApp
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-5 w-5 text-green-400 mr-2" />
                    Suporte prioritário
                  </li>
                </ul>
                <Link to="/register" className="block mt-6">
                  <Button className="w-full bg-blue-600 hover:bg-blue-700">
                    Assinar Agora
                  </Button>
                </Link>
              </CardContent>
            </Card>

            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white text-2xl">Empresarial</CardTitle>
                <CardDescription className="text-slate-400">Para grandes organizações</CardDescription>
                <div className="text-3xl font-bold text-white mt-4">
                  R$ 99<span className="text-lg font-normal text-slate-400">/mês</span>
                </div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3 text-slate-300">
                  <li className="flex items-center">
                    <CheckCircle className="h-5 w-5 text-green-400 mr-2" />
                    Servidores ilimitados
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-5 w-5 text-green-400 mr-2" />
                    API completa
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-5 w-5 text-green-400 mr-2" />
                    Multi-tenant
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-5 w-5 text-green-400 mr-2" />
                    Suporte 24/7
                  </li>
                </ul>
                <Link to="/register" className="block mt-6">
                  <Button className="w-full bg-blue-600 hover:bg-blue-700">
                    Falar com Vendas
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-800/50 border-t border-slate-700 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="flex items-center justify-center space-x-2 mb-4">
              <Monitor className="h-8 w-8 text-blue-400" />
              <span className="text-2xl font-bold text-white">FlowServ</span>
            </div>
            <p className="text-slate-400">
              © 2024 FlowServ. Todos os direitos reservados.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
