
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Server, Plus, Settings, Bell, BarChart3, User, LogOut } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import ThemeToggle from '@/components/ThemeToggle';
import Footer from '@/components/Footer';
import AddServerModal from '@/components/AddServerModal';
import ServerCard from '@/components/ServerCard';

const Dashboard = () => {
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [servers, setServers] = useState<any[]>([]);
  const [profile, setProfile] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddServerModalOpen, setIsAddServerModalOpen] = useState(false);

  useEffect(() => {
    if (user) {
      loadUserData();
    }
  }, [user]);

  const loadUserData = async () => {
    if (!user) return;

    try {
      // Carregar perfil do usuário
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profileError) throw profileError;
      setProfile(profileData);

      // Carregar servidores do usuário com métricas mais recentes
      const { data: serversData, error: serversError } = await supabase
        .from('servidores')
        .select(`
          *,
          metricas (
            cpu_usage,
            memoria_usage,
            disco_usage,
            timestamp
          )
        `)
        .eq('usuario_id', user.id)
        .order('data_criacao', { ascending: false });

      if (serversError) throw serversError;

      // Ordenar métricas por timestamp descendente para cada servidor
      const serversWithSortedMetrics = (serversData || []).map(server => ({
        ...server,
        metricas: (server.metricas || []).sort((a: any, b: any) => 
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        )
      }));

      setServers(serversWithSortedMetrics);

    } catch (error: any) {
      console.error('Erro ao carregar dados:', error);
      toast({
        title: "Erro ao carregar dados",
        description: "Não foi possível carregar as informações do usuário.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddServer = (newServer: any) => {
    setServers(prev => [newServer, ...prev]);
    setIsAddServerModalOpen(false);
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const getPlanName = (plan: string) => {
    const plans = {
      free: 'Gratuito',
      profissional: 'Profissional', 
      empresarial: 'Empresarial',
      admin: 'Administrador'
    };
    return plans[plan as keyof typeof plans] || plan;
  };

  const getPlanColor = (plan: string) => {
    const colors = {
      free: 'bg-gray-500',
      profissional: 'bg-blue-500',
      empresarial: 'bg-purple-500', 
      admin: 'bg-red-500'
    };
    return colors[plan as keyof typeof colors] || 'bg-gray-500';
  };

  // Verificar se é admin pelo email ou pelo plano
  const isAdmin = user?.email === 'admin@flowserv.com.br' || profile?.plano_ativo === 'admin';

  // Calcular estatísticas
  const onlineServers = servers.filter(s => s.status === 'ativo').length;
  const serversWithAlerts = servers.filter(s => {
    const latestMetrics = s.metricas?.[0];
    return latestMetrics && (
      latestMetrics.cpu_usage > 80 || 
      latestMetrics.memoria_usage > 90 || 
      latestMetrics.disco_usage > 90
    );
  }).length;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Carregando dashboard...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="bg-card shadow-sm border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold text-primary">
                FlowServ
              </h1>
              <span className="ml-4 text-muted-foreground">Dashboard</span>
            </div>
            <div className="flex items-center space-x-4">
              <ThemeToggle />
              
              {profile && (
                <Badge className={`${getPlanColor(profile.plano_ativo)} text-white`}>
                  {getPlanName(profile.plano_ativo)}
                </Badge>
              )}
              
              <Button 
                variant="ghost" 
                onClick={() => navigate('/profile')}
                className="text-muted-foreground hover:text-foreground"
              >
                <User className="h-4 w-4 mr-2" />
                Perfil
              </Button>
              
              {isAdmin && (
                <Button 
                  variant="ghost" 
                  onClick={() => navigate('/admin')}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <Settings className="h-4 w-4 mr-2" />
                  Admin
                </Button>
              )}
              
              <Button 
                variant="ghost" 
                onClick={handleSignOut}
                className="text-destructive hover:text-destructive/90"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Sair
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-foreground mb-2">
            Bem-vindo, {profile?.nome_completo || 'Usuário'}!
          </h2>
          <p className="text-muted-foreground">
            Monitore e gerencie seus servidores em um só lugar
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="bg-card border-border">
            <CardContent className="p-6">
              <div className="flex items-center">
                <Server className="h-8 w-8 text-primary" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-muted-foreground">Servidores</p>
                  <p className="text-2xl font-bold text-foreground">{servers.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-card border-border">
            <CardContent className="p-6">
              <div className="flex items-center">
                <BarChart3 className="h-8 w-8 text-green-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-muted-foreground">Online</p>
                  <p className="text-2xl font-bold text-foreground">{onlineServers}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-card border-border">
            <CardContent className="p-6">
              <div className="flex items-center">
                <Bell className="h-8 w-8 text-yellow-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-muted-foreground">Alertas</p>
                  <p className="text-2xl font-bold text-foreground">{serversWithAlerts}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-card border-border">
            <CardContent className="p-6">
              <div className="flex items-center">
                <Settings className="h-8 w-8 text-purple-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-muted-foreground">Plano</p>
                  <p className="text-sm font-bold text-foreground">
                    {getPlanName(profile?.plano_ativo || 'free')}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Servers Section */}
        <Card className="bg-card border-border">
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle className="text-foreground">Seus Servidores</CardTitle>
              <Button 
                className="bg-primary hover:bg-primary/90 text-primary-foreground"
                onClick={() => setIsAddServerModalOpen(true)}
              >
                <Plus className="h-4 w-4 mr-2" />
                Adicionar Servidor
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {servers.length === 0 ? (
              <div className="text-center py-12">
                <Server className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium text-foreground mb-2">
                  Nenhum servidor cadastrado
                </h3>
                <p className="text-muted-foreground mb-6">
                  Comece adicionando seu primeiro servidor para monitoramento
                </p>
                <Button 
                  className="bg-primary hover:bg-primary/90 text-primary-foreground"
                  onClick={() => setIsAddServerModalOpen(true)}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar Primeiro Servidor
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {servers.map((server) => (
                  <ServerCard
                    key={server.id}
                    server={server}
                    onRefresh={loadUserData}
                  />
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>

      <Footer />

      {/* Add Server Modal */}
      <AddServerModal
        isOpen={isAddServerModalOpen}
        onClose={() => setIsAddServerModalOpen(false)}
        onAddServer={handleAddServer}
      />
    </div>
  );
};

export default Dashboard;
