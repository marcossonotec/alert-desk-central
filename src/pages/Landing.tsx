
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Monitor, AlertTriangle, Zap, Shield, BarChart3, Globe } from 'lucide-react';
import { Link } from 'react-router-dom';

const Landing = () => {
  const features = [
    {
      icon: <Monitor className="h-8 w-8 text-blue-500" />,
      title: "Monitoramento Multi-Servidor",
      description: "Monitore quantos servidores precisar com IPs personalizados"
    },
    {
      icon: <AlertTriangle className="h-8 w-8 text-orange-500" />,
      title: "Alertas Inteligentes",
      description: "Receba notificações via email e WhatsApp quando algo der errado"
    },
    {
      icon: <Zap className="h-8 w-8 text-yellow-500" />,
      title: "Webhooks Flexíveis",
      description: "Configure webhooks personalizados para cada servidor"
    },
    {
      icon: <Shield className="h-8 w-8 text-green-500" />,
      title: "Segurança Avançada",
      description: "API keys seguras e isolamento completo entre clientes"
    },
    {
      icon: <BarChart3 className="h-8 w-8 text-purple-500" />,
      title: "Métricas Detalhadas",
      description: "Inspirado no Prometheus e Grafana para máxima precisão"
    },
    {
      icon: <Globe className="h-8 w-8 text-cyan-500" />,
      title: "Multi-Cloud",
      description: "Suporte para Hetzner Cloud, Digital Ocean e mais"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      {/* Header */}
      <header className="border-b border-slate-700/50 bg-slate-900/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <Monitor className="h-8 w-8 text-blue-400" />
            <span className="text-2xl font-bold text-white">DeskTools</span>
          </div>
          <nav className="flex items-center space-x-6">
            <Link to="/login" className="text-slate-300 hover:text-white transition-colors">
              Login
            </Link>
            <Link to="/register">
              <Button variant="outline" className="border-blue-500 text-blue-400 hover:bg-blue-500 hover:text-white">
                Cadastrar
              </Button>
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 text-center">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-5xl md:text-6xl font-bold text-white mb-6 leading-tight">
            Monitore Seus Servidores com
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400"> Inteligência</span>
          </h1>
          <p className="text-xl text-slate-300 mb-8 leading-relaxed">
            Plataforma SaaS completa para monitoramento de infraestrutura. 
            Alertas em tempo real, webhooks customizáveis e métricas precisas para seus servidores.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/register">
              <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 text-lg">
                Começar Gratuitamente
              </Button>
            </Link>
            <Button size="lg" variant="outline" className="border-slate-600 text-slate-300 hover:bg-slate-800 px-8 py-3 text-lg">
              Ver Demonstração
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Recursos Poderosos para Profissionais
          </h2>
          <p className="text-slate-400 text-lg max-w-2xl mx-auto">
            Tudo que você precisa para manter seus servidores funcionando perfeitamente
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <Card key={index} className="bg-slate-800/50 border-slate-700 hover:bg-slate-800/70 transition-all duration-300 hover:scale-105">
              <CardHeader>
                <div className="flex items-center space-x-3">
                  {feature.icon}
                  <CardTitle className="text-white">{feature.title}</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-slate-400">
                  {feature.description}
                </CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-16">
        <Card className="bg-gradient-to-r from-blue-900/50 to-cyan-900/50 border-blue-700/50">
          <CardContent className="text-center py-12">
            <h3 className="text-3xl font-bold text-white mb-4">
              Pronto para Transformar seu Monitoramento?
            </h3>
            <p className="text-slate-300 mb-8 max-w-2xl mx-auto">
              Junte-se a centenas de profissionais que já confiam no DeskTools 
              para manter seus servidores sempre online e seguros.
            </p>
            <Link to="/register">
              <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 text-lg">
                Criar Conta Gratuita
              </Button>
            </Link>
          </CardContent>
        </Card>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-700/50 bg-slate-900/80 py-8">
        <div className="container mx-auto px-4 text-center">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <Monitor className="h-6 w-6 text-blue-400" />
            <span className="text-xl font-bold text-white">DeskTools</span>
          </div>
          <p className="text-slate-400">
            © 2024 DeskTools. Monitoramento inteligente para sua infraestrutura.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
