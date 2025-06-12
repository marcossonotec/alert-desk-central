
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Users, Server, AlertTriangle, CreditCard, Settings, Mail } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import UserManagement from '@/components/admin/UserManagement';
import ServerManagement from '@/components/admin/ServerManagement';
import AlertsManagement from '@/components/admin/AlertsManagement';
import SubscriptionManagement from '@/components/admin/SubscriptionManagement';
import PaymentSettings from '@/components/admin/PaymentSettings';
import NotificationSettings from '@/components/admin/NotificationSettings';

const Admin = () => {
  const [activeTab, setActiveTab] = useState('users');
  const [isAdmin, setIsAdmin] = useState(false);
  const [userProfile, setUserProfile] = useState<any>(null);
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      checkAdminAccess();
    }
  }, [user]);

  const checkAdminAccess = async () => {
    if (!user) {
      navigate('/login');
      return;
    }

    try {
      // Verificar se é administrador
      const { data: profile } = await supabase
        .from('profiles')
        .select('plano_ativo')
        .eq('id', user.id)
        .single();

      setUserProfile(profile);

      const adminAccess = profile?.plano_ativo === 'admin' || user.email === 'admin@flowserv.com.br';
      
      if (!adminAccess) {
        toast({
          title: "Acesso negado",
          description: "Você não tem permissão para acessar esta área.",
          variant: "destructive"
        });
        navigate('/dashboard');
        return;
      }

      setIsAdmin(true);
    } catch (error: any) {
      console.error('Erro ao verificar acesso:', error);
      navigate('/dashboard');
    }
  };

  if (!user || !isAdmin) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Carregando...</h1>
          <p className="text-muted-foreground">Verificando permissões de acesso...</p>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: 'users', label: 'Usuários', icon: Users },
    { id: 'servers', label: 'Servidores', icon: Server },
    { id: 'alerts', label: 'Alertas', icon: AlertTriangle },
    { id: 'subscriptions', label: 'Assinaturas', icon: CreditCard },
    { id: 'payments', label: 'Pagamentos', icon: Settings },
    { id: 'notifications', label: 'Notificações', icon: Mail },
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'users':
        return <UserManagement />;
      case 'servers':
        return <ServerManagement />;
      case 'alerts':
        return <AlertsManagement />;
      case 'subscriptions':
        return <SubscriptionManagement />;
      case 'payments':
        return <PaymentSettings />;
      case 'notifications':
        return <NotificationSettings />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            onClick={() => navigate('/dashboard')}
            className="border-border hover:bg-accent"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Painel Administrativo</h1>
            <p className="text-muted-foreground">Gerencie usuários, servidores e configurações do sistema</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex flex-wrap gap-2 border-b border-border pb-4">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <Button
                key={tab.id}
                variant={activeTab === tab.id ? 'default' : 'outline'}
                onClick={() => setActiveTab(tab.id)}
                className={
                  activeTab === tab.id
                    ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                    : 'border-border hover:bg-accent'
                }
              >
                <Icon className="h-4 w-4 mr-2" />
                {tab.label}
              </Button>
            );
          })}
        </div>

        {/* Tab Content */}
        <div className="min-h-[600px]">
          {renderTabContent()}
        </div>
      </div>
    </div>
  );
};

export default Admin;
