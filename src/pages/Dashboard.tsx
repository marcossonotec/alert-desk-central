
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Server, 
  Plus, 
  Activity, 
  AlertTriangle, 
  TrendingUp,
  MessageSquare,
  LogOut,
  Settings
} from 'lucide-react';
import ServerCard from '@/components/ServerCard';
import AddServerModal from '@/components/AddServerModal';
import EvolutionInstanceModal from '@/components/EvolutionInstanceModal';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';

const Dashboard = () => {
  const [servers, setServers] = useState<any[]>([]);
  const [metrics, setMetrics] = useState<any[]>([]);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showWhatsAppModal, setShowWhatsAppModal] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);
      
      // Buscar usuário atual
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      setUser(currentUser);

      if (!currentUser) return;

      // Buscar servidores do usuário
      const { data: serversData, error: serversError } = await supabase
        .from('servidores')
        .select('*')
        .eq('usuario_id', currentUser.id)
        .order('data_criacao', { ascending: false });

      if (serversError) throw serversError;

      // Buscar métricas mais recentes
      const { data: metricsData, error: metricsError } = await supabase
        .from('metricas')
        .select('*')
        .in('servidor_id', (serversData || []).map(s => s.id))
        .order('timestamp', { ascending: false });

      if (metricsError) throw metricsError;

      // Buscar alertas ativos
      const { data: alertsData, error: alertsError } = await supabase
        .from('alertas')
        .select('*, servidores(nome)')
        .eq('usuario_id', currentUser.id)
        .eq('ativo', true);

      if (alertsError) throw alertsError;

      setServers(serversData || []);
      setMetrics(metricsData || []);
      setAlerts(alertsData || []);
    } catch (error: any) {
      console.error('Erro ao carregar dados:', error);
      toast({
        title: "Erro ao carregar dados",
        description: "Não foi possível carregar os dados do dashboard.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getLatestMetricForServer = (serverId: string) => {
    return metrics
      .filter(m => m.servidor_id === serverId)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0];
  };

  const getServerStats = () => {
    const total = servers.length;
    const online = servers.filter(s => s.status === 'ativo').length;
    const offline = total - online;
    const alerts_count = alerts.length;

    return { total, online, offline, alerts_count };
  };

  const getAverageMetrics = () => {
    if (metrics.length === 0) return { cpu: 0, memoria: 0, disco: 0 };

    const latest = {};
    servers.forEach(server => {
      const metric = getLatestMetricForServer(server.id);
      if (metric) {
        latest[server.id] = metric;
      }
    });

    const values = Object.values(latest) as any[];
    if (values.length === 0) return { cpu: 0, memoria: 0, disco: 0 };

    const cpu = values.reduce((sum, m) => sum + (m.cpu_usage || 0), 0) / values.length;
    const memoria = values.reduce((sum, m) => sum + (m.memoria_usage || 0), 0) / values.length;
    const disco = values.reduce((sum, m) => sum + (m.disco_usage || 0), 0) / values.length;

    return { cpu, memoria, disco };
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  const goToAdmin = () => {
    navigate('/admin');
  };

  const stats = getServerStats();
  const avgMetrics = getAverageMetrics();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 space-y-8">
        {/* Header com navegação */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
            <p className="text-muted-foreground">Gerencie seus servidores e monitoramento</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button 
              onClick={() => setShowWhatsAppModal(true)}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              <MessageSquare className="h-4 w-4 mr-2" />
              WhatsApp
            </Button>
            <Button 
              onClick={() => setShowAddModal(true)}
              className="bg-primary hover:bg-primary/90"
            >
              <Plus className="h-4 w-4 mr-2" />
              Adicionar
            </Button>
            <Button
              onClick={goToAdmin}
              variant="outline"
              className="border-border hover:bg-accent"
            >
              <Settings className="h-4 w-4 mr-2" />
              Admin
            </Button>
            <Button
              onClick={handleLogout}
              variant="outline"
              className="border-border hover:bg-accent text-red-600 hover:text-red-700"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Sair
            </Button>
          </div>
        </div>

        {/* Cards de estatísticas - Layout melhorado */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-card border-border">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-muted-foreground">Servidores</p>
                  <p className="text-xl font-bold text-foreground">{stats.total}</p>
                </div>
                <Server className="h-6 w-6 text-primary" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-muted-foreground">Online</p>
                  <p className="text-xl font-bold text-green-600">{stats.online}</p>
                </div>
                <Activity className="h-6 w-6 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-muted-foreground">Alertas</p>
                  <p className="text-xl font-bold text-orange-600">{stats.alerts_count}</p>
                </div>
                <AlertTriangle className="h-6 w-6 text-orange-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-muted-foreground">CPU Média</p>
                  <p className="text-xl font-bold text-blue-600">{avgMetrics.cpu.toFixed(1)}%</p>
                </div>
                <TrendingUp className="h-6 w-6 text-blue-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Lista de servidores */}
        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-foreground">Seus Servidores</h2>
            <Badge variant="secondary" className="text-sm">
              {servers.length} servidor{servers.length !== 1 ? 'es' : ''}
            </Badge>
          </div>

          {servers.length === 0 ? (
            <Card className="bg-card border-border">
              <CardContent className="py-12 text-center">
                <Server className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium text-foreground mb-2">
                  Nenhum servidor cadastrado
                </h3>
                <p className="text-muted-foreground mb-6">
                  Adicione seu primeiro servidor para começar o monitoramento.
                </p>
                <Button onClick={() => setShowAddModal(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar Primeiro Servidor
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
              {servers.map((server) => (
                <ServerCard
                  key={server.id}
                  server={server}
                  onUpdate={loadData}
                />
              ))}
            </div>
          )}
        </div>

        {/* Alertas recentes - Layout compacto */}
        {alerts.length > 0 && (
          <div>
            <h2 className="text-xl font-bold text-foreground mb-4">Alertas Ativos</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {alerts.slice(0, 6).map((alert) => (
                <Card key={alert.id} className="bg-yellow-50 border-yellow-200">
                  <CardContent className="p-3">
                    <div className="flex items-center space-x-2 mb-1">
                      <AlertTriangle className="h-3 w-3 text-yellow-600" />
                      <span className="font-medium text-yellow-800 capitalize text-sm">
                        {alert.tipo_alerta}
                      </span>
                    </div>
                    <p className="text-xs text-yellow-700">
                      {alert.servidores?.nome} - Limite: {alert.limite_valor}%
                    </p>
                    <div className="mt-1 text-xs text-yellow-600">
                      Canais: {alert.canal_notificacao?.join(', ')}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Modais */}
      <AddServerModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onUpdate={loadData}
      />

      <EvolutionInstanceModal
        isOpen={showWhatsAppModal}
        onClose={() => setShowWhatsAppModal(false)}
      />
    </div>
  );
};

export default Dashboard;
