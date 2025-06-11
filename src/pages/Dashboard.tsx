
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

const Dashboard = () => {
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [servers, setServers] = useState<any[]>([]);
  const [profile, setProfile] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

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

      // Carregar servidores do usuário
      const { data: serversData, error: serversError } = await supabase
        .from('servidores')
        .select('*')
        .eq('usuario_id', user.id)
        .order('data_criacao', { ascending: false });

      if (serversError) throw serversError;
      setServers(serversData || []);

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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <p className="text-gray-600 dark:text-gray-400">Carregando dashboard...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold text-blue-600 dark:text-blue-400">
                FlowServ
              </h1>
              <span className="ml-4 text-gray-600 dark:text-gray-400">Dashboard</span>
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
                className="text-gray-600 dark:text-gray-400"
              >
                <User className="h-4 w-4 mr-2" />
                Perfil
              </Button>
              
              {profile?.plano_ativo === 'admin' && (
                <Button 
                  variant="ghost" 
                  onClick={() => navigate('/admin')}
                  className="text-gray-600 dark:text-gray-400"
                >
                  <Settings className="h-4 w-4 mr-2" />
                  Admin
                </Button>
              )}
              
              <Button 
                variant="ghost" 
                onClick={handleSignOut}
                className="text-red-600 dark:text-red-400"
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
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Bem-vindo, {profile?.nome_completo || 'Usuário'}!
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Monitore e gerencie seus servidores em um só lugar
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
            <CardContent className="p-6">
              <div className="flex items-center">
                <Server className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Servidores</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{servers.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
            <CardContent className="p-6">
              <div className="flex items-center">
                <BarChart3 className="h-8 w-8 text-green-600 dark:text-green-400" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Online</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {servers.filter(s => s.status === 'ativo').length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
            <CardContent className="p-6">
              <div className="flex items-center">
                <Bell className="h-8 w-8 text-yellow-600 dark:text-yellow-400" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Alertas</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">0</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
            <CardContent className="p-6">
              <div className="flex items-center">
                <Settings className="h-8 w-8 text-purple-600 dark:text-purple-400" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Plano</p>
                  <p className="text-sm font-bold text-gray-900 dark:text-white">
                    {getPlanName(profile?.plano_ativo || 'free')}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Servers Section */}
        <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle className="text-gray-900 dark:text-white">Seus Servidores</CardTitle>
              <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                <Plus className="h-4 w-4 mr-2" />
                Adicionar Servidor
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {servers.length === 0 ? (
              <div className="text-center py-12">
                <Server className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  Nenhum servidor cadastrado
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  Comece adicionando seu primeiro servidor para monitoramento
                </p>
                <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar Primeiro Servidor
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {servers.map((server) => (
                  <Card key={server.id} className="bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600">
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-lg text-gray-900 dark:text-white">{server.nome}</CardTitle>
                          <p className="text-sm text-gray-600 dark:text-gray-400">{server.ip}</p>
                        </div>
                        <Badge 
                          variant={server.status === 'ativo' ? 'default' : 'secondary'}
                          className={server.status === 'ativo' ? 'bg-green-500' : 'bg-red-500'}
                        >
                          {server.status === 'ativo' ? 'Online' : 'Offline'}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600 dark:text-gray-400">{server.provedor}</span>
                        <div className="flex gap-2">
                          <Button variant="ghost" size="sm" className="text-blue-600 dark:text-blue-400">
                            <BarChart3 className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" className="text-gray-600 dark:text-gray-400">
                            <Settings className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>

      <Footer />
    </div>
  );
};

export default Dashboard;
