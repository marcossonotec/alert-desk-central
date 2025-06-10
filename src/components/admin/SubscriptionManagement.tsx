
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search, CreditCard, TrendingUp, DollarSign } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const SubscriptionManagement = () => {
  const [subscriptions, setSubscriptions] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({
    totalRevenue: 0,
    activeSubscriptions: 0,
    monthlyGrowth: 0
  });
  const { toast } = useToast();

  useEffect(() => {
    loadSubscriptionsData();
  }, []);

  const loadSubscriptionsData = async () => {
    try {
      setIsLoading(true);
      
      const { data, error } = await supabase
        .from('assinaturas')
        .select(`
          *,
          profiles!inner(
            email,
            nome_completo,
            empresa
          )
        `)
        .order('data_criacao', { ascending: false });

      if (error) throw error;

      setSubscriptions(data || []);
      
      // Calcular estatísticas
      const activeSubscriptions = data?.filter(s => s.status === 'ativa') || [];
      const totalRevenue = activeSubscriptions.reduce((sum, s) => sum + (s.preco_mensal || 0), 0);
      
      setStats({
        totalRevenue,
        activeSubscriptions: activeSubscriptions.length,
        monthlyGrowth: 15 // Placeholder para crescimento mensal
      });

    } catch (error: any) {
      console.error('Erro ao carregar assinaturas:', error);
      toast({
        title: "Erro ao carregar assinaturas",
        description: "Não foi possível carregar os dados de assinaturas.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const filteredSubscriptions = subscriptions.filter(subscription =>
    subscription.profiles?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    subscription.profiles?.nome_completo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    subscription.plano?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusColor = (status: string) => {
    const colors = {
      ativa: 'bg-green-500',
      cancelada: 'bg-red-500',
      suspensa: 'bg-yellow-500'
    };
    return colors[status as keyof typeof colors] || 'bg-gray-500';
  };

  const getPlanColor = (plano: string) => {
    const colors = {
      basic: 'bg-blue-500',
      pro: 'bg-purple-500',
      enterprise: 'bg-gold-500'
    };
    return colors[plano as keyof typeof colors] || 'bg-gray-500';
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  return (
    <div className="space-y-6">
      {/* Estatísticas de receita */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm">Receita Mensal</p>
                <p className="text-2xl font-bold text-green-400">
                  {formatCurrency(stats.totalRevenue)}
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-green-400" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm">Assinaturas Ativas</p>
                <p className="text-2xl font-bold text-blue-400">
                  {stats.activeSubscriptions}
                </p>
              </div>
              <CreditCard className="h-8 w-8 text-blue-400" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm">Crescimento Mensal</p>
                <p className="text-2xl font-bold text-purple-400">
                  +{stats.monthlyGrowth}%
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-purple-400" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm">Total de Clientes</p>
                <p className="text-2xl font-bold text-white">
                  {subscriptions.length}
                </p>
              </div>
              <CreditCard className="h-8 w-8 text-slate-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros e busca */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardContent className="p-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
            <Input
              placeholder="Buscar por cliente, email ou plano..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-slate-700 border-slate-600 text-white placeholder-slate-400"
            />
          </div>
        </CardContent>
      </Card>

      {/* Lista de assinaturas */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Assinaturas e Pagamentos
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">
              <p className="text-slate-400">Carregando assinaturas...</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-slate-300">
                <thead>
                  <tr className="border-b border-slate-700">
                    <th className="text-left py-3">Cliente</th>
                    <th className="text-left py-3">Plano</th>
                    <th className="text-left py-3">Valor Mensal</th>
                    <th className="text-left py-3">Status</th>
                    <th className="text-left py-3">Provedor</th>
                    <th className="text-left py-3">Data Início</th>
                    <th className="text-left py-3">Data Fim</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSubscriptions.map((subscription) => (
                    <tr key={subscription.id} className="border-b border-slate-700/50">
                      <td className="py-3">
                        <div>
                          <p className="font-medium">{subscription.profiles?.nome_completo || 'N/A'}</p>
                          <p className="text-sm text-slate-500">{subscription.profiles?.email}</p>
                          {subscription.profiles?.empresa && (
                            <p className="text-xs text-slate-600">{subscription.profiles.empresa}</p>
                          )}
                        </div>
                      </td>
                      <td className="py-3">
                        <Badge className={`${getPlanColor(subscription.plano)} text-white`}>
                          {subscription.plano.toUpperCase()}
                        </Badge>
                      </td>
                      <td className="py-3 font-medium">
                        {formatCurrency(subscription.preco_mensal)}
                      </td>
                      <td className="py-3">
                        <Badge className={`${getStatusColor(subscription.status)} text-white`}>
                          {subscription.status.toUpperCase()}
                        </Badge>
                      </td>
                      <td className="py-3 capitalize">
                        {subscription.provedor_pagamento}
                      </td>
                      <td className="py-3">
                        {new Date(subscription.data_inicio).toLocaleDateString('pt-BR')}
                      </td>
                      <td className="py-3">
                        {subscription.data_fim 
                          ? new Date(subscription.data_fim).toLocaleDateString('pt-BR')
                          : '-'
                        }
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default SubscriptionManagement;
