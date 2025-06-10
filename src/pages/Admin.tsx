
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Users, Server, AlertTriangle, CreditCard } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import UserManagement from '@/components/admin/UserManagement';
import ServerManagement from '@/components/admin/ServerManagement';
import AlertsManagement from '@/components/admin/AlertsManagement';
import SubscriptionManagement from '@/components/admin/SubscriptionManagement';

const Admin = () => {
  const [activeTab, setActiveTab] = useState('users');
  const [user, setUser] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    checkAdminAccess();
  }, []);

  const checkAdminAccess = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        navigate('/login');
        return;
      }

      setUser(user);

      // Verificar se é administrador
      const { data: profile } = await supabase
        .from('profiles')
        .select('plano_ativo')
        .eq('id', user.id)
        .single();

      const adminAccess = profile?.plano_ativo === 'admin' || user.email === 'admin@desktools.com';
      
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

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center">
        <div className="text-center text-white">
          <h1 className="text-2xl font-bold mb-4">Carregando...</h1>
          <p>Verificando permissões de acesso...</p>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: 'users', label: 'Usuários', icon: Users },
    { id: 'servers', label: 'Servidores', icon: Server },
    { id: 'alerts', label: 'Alertas', icon: AlertTriangle },
    { id: 'subscriptions', label: 'Assinaturas', icon: CreditCard },
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
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            onClick={() => navigate('/dashboard')}
            className="border-slate-600 text-slate-300 hover:bg-slate-700"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-white">Painel Administrativo</h1>
            <p className="text-slate-300">Gerencie usuários, servidores e configurações do sistema</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex flex-wrap gap-2 border-b border-slate-700 pb-4">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <Button
                key={tab.id}
                variant={activeTab === tab.id ? 'default' : 'outline'}
                onClick={() => setActiveTab(tab.id)}
                className={
                  activeTab === tab.id
                    ? 'bg-blue-600 hover:bg-blue-700'
                    : 'border-slate-600 text-slate-300 hover:bg-slate-700'
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
