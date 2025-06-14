
import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import UserManagement from './UserManagement';
import ServerManagement from './ServerManagement';
import AlertsManagement from './AlertsManagement';
import NotificationSettings from './NotificationSettings';
import PaymentSettings from './PaymentSettings';
import SubscriptionManagement from './SubscriptionManagement';
import NotificationTestPanel from './NotificationTestPanel';
import SimpleMonitoringGuide from './SimpleMonitoringGuide';
import ProviderTokenManager from './ProviderTokenManager';
import { Users, Server, Bell, CreditCard, UserCheck, Settings, BookOpen, Key } from 'lucide-react';

const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeServers: 0,
    alertsSent: 0,
    activeSubscriptions: 0
  });

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      // Carregar estatísticas básicas
      const { data: users } = await supabase
        .from('profiles')
        .select('id');

      const { data: servers } = await supabase
        .from('servidores')
        .select('id')
        .eq('status', 'ativo');

      const { data: notifications } = await supabase
        .from('notificacoes')
        .select('id')
        .gte('data_envio', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

      const { data: subscriptions } = await supabase
        .from('assinaturas')
        .select('id')
        .eq('status', 'ativa');

      setStats({
        totalUsers: users?.length || 0,
        activeServers: servers?.length || 0,
        alertsSent: notifications?.length || 0,
        activeSubscriptions: subscriptions?.length || 0
      });
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error);
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/dashboard')}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar ao Dashboard
          </Button>
          <h1 className="text-3xl font-bold text-foreground">Painel Administrativo</h1>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-8 bg-muted">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Visão Geral
          </TabsTrigger>
          <TabsTrigger value="users" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Usuários
          </TabsTrigger>
          <TabsTrigger value="servers" className="flex items-center gap-2">
            <Server className="h-4 w-4" />
            Servidores
          </TabsTrigger>
          <TabsTrigger value="tokens" className="flex items-center gap-2">
            <Key className="h-4 w-4" />
            Tokens
          </TabsTrigger>
          <TabsTrigger value="alerts" className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            Alertas
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            Notificações
          </TabsTrigger>
          <TabsTrigger value="payments" className="flex items-center gap-2">
            <CreditCard className="h-4 w-4" />
            Pagamentos
          </TabsTrigger>
          <TabsTrigger value="guide" className="flex items-center gap-2">
            <BookOpen className="h-4 w-4" />
            Guia
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total de Usuários</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalUsers}</div>
                <p className="text-xs text-muted-foreground">Usuários cadastrados</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Servidores Ativos</CardTitle>
                <Server className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.activeServers}</div>
                <p className="text-xs text-muted-foreground">Em monitoramento</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Alertas Enviados</CardTitle>
                <Bell className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.alertsSent}</div>
                <p className="text-xs text-muted-foreground">Últimas 24h</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Assinaturas Ativas</CardTitle>
                <UserCheck className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.activeSubscriptions}</div>
                <p className="text-xs text-muted-foreground">Planos pagos</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="users">
          <UserManagement />
        </TabsContent>

        <TabsContent value="servers">
          <ServerManagement />
        </TabsContent>

        <TabsContent value="tokens">
          <ProviderTokenManager />
        </TabsContent>

        <TabsContent value="alerts">
          <AlertsManagement />
        </TabsContent>

        <TabsContent value="notifications" className="space-y-6">
          <NotificationSettings />
          <NotificationTestPanel />
        </TabsContent>

        <TabsContent value="payments" className="space-y-6">
          <PaymentSettings />
          <SubscriptionManagement />
        </TabsContent>

        <TabsContent value="guide">
          <SimpleMonitoringGuide />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminDashboard;
