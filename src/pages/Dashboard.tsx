
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { SidebarProvider } from '@/components/ui/sidebar';
import DashboardHeader from '@/components/dashboard/DashboardHeader';
import DashboardStats from '@/components/dashboard/DashboardStats';
import ServersList from '@/components/dashboard/ServersList';
import ActiveAlerts from '@/components/dashboard/ActiveAlerts';
import DashboardSidebar from '@/components/dashboard/DashboardSidebar';
import AddServerModal from '@/components/AddServerModal';
import EvolutionInstanceModal from '@/components/EvolutionInstanceModal';
import ApplicationsList from '@/components/ApplicationsList';
import ThemeToggle from '@/components/ThemeToggle';

const Dashboard = () => {
  const [servers, setServers] = useState<any[]>([]);
  const [metrics, setMetrics] = useState<any[]>([]);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showWhatsAppModal, setShowWhatsAppModal] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);
      
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      setUser(currentUser);

      if (!currentUser) return;

      // Buscar perfil do usuário
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', currentUser.id)
        .single();

      if (profileData) {
        setUserProfile(profileData);
      }

      const { data: serversData, error: serversError } = await supabase
        .from('servidores')
        .select('*')
        .eq('usuario_id', currentUser.id)
        .order('data_criacao', { ascending: false });

      if (serversError) throw serversError;

      const { data: metricsData, error: metricsError } = await supabase
        .from('metricas')
        .select('*')
        .in('servidor_id', (serversData || []).map(s => s.id))
        .order('timestamp', { ascending: false });

      if (metricsError) throw metricsError;

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

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  const goToAdmin = () => {
    navigate('/admin');
  };

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
    <SidebarProvider>
      <div className="min-h-screen bg-background flex w-full">
        <div className="flex-1 flex flex-col">
          {/* Header com toggle de tema */}
          <div className="border-b border-border bg-card">
            <div className="container mx-auto px-4 py-4 flex justify-between items-center">
              <h1 className="text-2xl font-bold">Dashboard</h1>
              <ThemeToggle />
            </div>
          </div>

          <div className="container mx-auto px-4 py-8 space-y-8">
            <DashboardHeader
              onAddServer={() => setShowAddModal(true)}
              onOpenWhatsApp={() => setShowWhatsAppModal(true)}
              onGoToAdmin={goToAdmin}
              onLogout={handleLogout}
            />

            <DashboardStats 
              servers={servers}
              metrics={metrics}
              alerts={alerts}
              getLatestMetricForServer={getLatestMetricForServer}
            />

            <ServersList 
              servers={servers}
              onUpdate={loadData}
              onAddServer={() => setShowAddModal(true)}
            />

            <ApplicationsList 
              servers={servers}
              onUpdate={loadData}
            />

            <ActiveAlerts alerts={alerts} />
          </div>
        </div>

        <DashboardSidebar 
          userProfile={userProfile}
          servers={servers}
          onOpenWhatsApp={() => setShowWhatsAppModal(true)}
        />

        <AddServerModal
          isOpen={showAddModal}
          onClose={() => setShowAddModal(false)}
          onAddServer={loadData}
        />

        <EvolutionInstanceModal
          isOpen={showWhatsAppModal}
          onClose={() => setShowWhatsAppModal(false)}
          onInstanceUpdate={loadData}
        />
      </div>
    </SidebarProvider>
  );
};

export default Dashboard;
