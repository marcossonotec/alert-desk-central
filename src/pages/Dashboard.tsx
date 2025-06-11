
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, RefreshCw, Search, LogOut, Settings, User } from 'lucide-react';
import { Input } from '@/components/ui/input';
import ServerCard from '@/components/ServerCard';
import AddServerModal from '@/components/AddServerModal';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

// Tipo para definir o status do servidor
type ServerStatus = 'online' | 'warning' | 'offline';

interface Server {
  id: string;
  name: string;
  ip: string;
  status: ServerStatus;
  uptime: string;
  cpu: number;
  memory: number;
  lastUpdate: string;
  provedor?: string;
}

const Dashboard = () => {
  const [servers, setServers] = useState<Server[]>([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | ServerStatus>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [userProfile, setUserProfile] = useState<any>(null);
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  // Carregar dados do usuário
  useEffect(() => {
    if (user) {
      loadUserProfile();
      loadServers();
    }
  }, [user]);

  const loadUserProfile = async () => {
    if (!user) return;
    
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      
      setUserProfile(profile);
    } catch (error) {
      console.error('Erro ao carregar perfil:', error);
    }
  };

  const loadServers = async () => {
    if (!user) return;
    
    try {
      setIsLoading(true);

      const { data: servidores, error } = await supabase
        .from('servidores')
        .select(`
          *,
          metricas (
            cpu_usage,
            memoria_usage,
            uptime,
            timestamp
          )
        `)
        .eq('usuario_id', user.id)
        .order('data_criacao', { ascending: false });

      if (error) {
        throw error;
      }

      const transformedServers: Server[] = servidores?.map(servidor => {
        const latestMetrics = servidor.metricas?.[0];
        
        return {
          id: servidor.id,
          name: servidor.nome,
          ip: servidor.ip,
          status: determineServerStatus(latestMetrics),
          uptime: latestMetrics?.uptime || '0d 0h 0m',
          cpu: latestMetrics?.cpu_usage || 0,
          memory: latestMetrics?.memoria_usage || 0,
          lastUpdate: latestMetrics?.timestamp 
            ? formatLastUpdate(latestMetrics.timestamp)
            : 'Nunca',
          provedor: servidor.provedor
        };
      }) || [];

      setServers(transformedServers);
    } catch (error: any) {
      console.error('Erro ao carregar servidores:', error);
      toast({
        title: "Erro ao carregar servidores",
        description: "Carregando dados de demonstração.",
        variant: "destructive"
      });
      loadMockServers();
    } finally {
      setIsLoading(false);
    }
  };

  const loadMockServers = () => {
    const mockServers: Server[] = [
      {
        id: '1',
        name: 'Servidor Web Principal',
        ip: '192.168.1.100',
        status: 'online',
        uptime: '15d 8h 23m',
        cpu: 45,
        memory: 72,
        lastUpdate: '2 min atrás',
      },
      {
        id: '2',
        name: 'Servidor de Banco de Dados',
        ip: '192.168.1.101',
        status: 'warning',
        uptime: '7d 12h 45m',
        cpu: 78,
        memory: 89,
        lastUpdate: '1 min atrás',
      },
      {
        id: '3',
        name: 'Servidor de Cache',
        ip: '192.168.1.102',
        status: 'offline',
        uptime: '0d 0h 0m',
        cpu: 0,
        memory: 0,
        lastUpdate: '5 min atrás',
      },
    ];
    setServers(mockServers);
  };

  const determineServerStatus = (metrics: any): ServerStatus => {
    if (!metrics) return 'offline';
    
    const cpuUsage = metrics.cpu_usage || 0;
    const memoryUsage = metrics.memoria_usage || 0;
    
    if (cpuUsage > 80 || memoryUsage > 90) return 'warning';
    return 'online';
  };

  const formatLastUpdate = (timestamp: string): string => {
    const now = new Date();
    const updateTime = new Date(timestamp);
    const diffMs = now.getTime() - updateTime.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    
    if (diffMins < 1) return 'Agora';
    if (diffMins < 60) return `${diffMins} min atrás`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h atrás`;
    
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d atrás`;
  };

  const filteredServers = servers.filter(server => {
    const matchesSearch = server.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         server.ip.includes(searchTerm);
    const matchesStatus = statusFilter === 'all' || server.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const statusCounts = {
    total: servers.length,
    online: servers.filter(s => s.status === 'online').length,
    warning: servers.filter(s => s.status === 'warning').length,
    offline: servers.filter(s => s.status === 'offline').length,
  };

  const handleAddServer = (serverData: any) => {
    loadServers();
  };

  const refreshServers = () => {
    loadServers();
    toast({
      title: "Servidores atualizados",
      description: "Lista de servidores foi atualizada com sucesso.",
    });
  };

  const handleLogout = async () => {
    try {
      await signOut();
      toast({
        title: "Logout realizado",
        description: "Você foi desconectado com sucesso.",
      });
      navigate('/');
    } catch (error) {
      toast({
        title: "Erro ao sair",
        description: "Não foi possível fazer logout.",
        variant: "destructive"
      });
    }
  };

  const isAdmin = userProfile?.plano_ativo === 'admin' || user?.email === 'admin@flowserv.com.br';

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white">Dashboard</h1>
            <p className="text-slate-300">Monitore seus servidores em tempo real</p>
            {userProfile && (
              <p className="text-slate-400 text-sm">
                Bem-vindo, {userProfile.nome_completo || user?.email}
              </p>
            )}
          </div>
          <div className="flex gap-3 items-center">
            <Button
              onClick={refreshServers}
              variant="outline"
              className="border-slate-600 text-slate-300 hover:bg-slate-700"
              disabled={isLoading}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Atualizar
            </Button>
            <Button
              onClick={() => setIsAddModalOpen(true)}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              Adicionar Servidor
            </Button>
            
            {/* Menu do usuário */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="border-slate-600 text-slate-300 hover:bg-slate-700">
                  <User className="h-4 w-4 mr-2" />
                  Menu
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="bg-slate-800 border-slate-700">
                <DropdownMenuItem 
                  onClick={() => navigate('/profile')}
                  className="text-slate-300 hover:bg-slate-700 cursor-pointer"
                >
                  <Settings className="h-4 w-4 mr-2" />
                  Configurações
                </DropdownMenuItem>
                {isAdmin && (
                  <DropdownMenuItem 
                    onClick={() => navigate('/admin')}
                    className="text-slate-300 hover:bg-slate-700 cursor-pointer"
                  >
                    <Settings className="h-4 w-4 mr-2" />
                    Administração
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem 
                  onClick={handleLogout}
                  className="text-red-400 hover:bg-slate-700 cursor-pointer"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Sair
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Estatísticas */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm">Total</p>
                  <p className="text-2xl font-bold text-white">{statusCounts.total}</p>
                </div>
                <div className="h-12 w-12 bg-blue-500/20 rounded-lg flex items-center justify-center">
                  <div className="h-6 w-6 bg-blue-500 rounded"></div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm">Online</p>
                  <p className="text-2xl font-bold text-green-400">{statusCounts.online}</p>
                </div>
                <div className="h-12 w-12 bg-green-500/20 rounded-lg flex items-center justify-center">
                  <div className="h-6 w-6 bg-green-500 rounded"></div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm">Alerta</p>
                  <p className="text-2xl font-bold text-yellow-400">{statusCounts.warning}</p>
                </div>
                <div className="h-12 w-12 bg-yellow-500/20 rounded-lg flex items-center justify-center">
                  <div className="h-6 w-6 bg-yellow-500 rounded"></div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm">Offline</p>
                  <p className="text-2xl font-bold text-red-400">{statusCounts.offline}</p>
                </div>
                <div className="h-12 w-12 bg-red-500/20 rounded-lg flex items-center justify-center">
                  <div className="h-6 w-6 bg-red-500 rounded"></div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filtros e Busca */}
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
                <Input
                  placeholder="Buscar por nome ou IP..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-slate-700 border-slate-600 text-white placeholder-slate-400"
                />
              </div>
              <div className="flex gap-2">
                <Button
                  variant={statusFilter === 'all' ? 'default' : 'outline'}
                  onClick={() => setStatusFilter('all')}
                  className={statusFilter === 'all' ? 'bg-blue-600' : 'border-slate-600 text-slate-300'}
                >
                  Todos
                </Button>
                <Button
                  variant={statusFilter === 'online' ? 'default' : 'outline'}
                  onClick={() => setStatusFilter('online')}
                  className={statusFilter === 'online' ? 'bg-green-600' : 'border-slate-600 text-slate-300'}
                >
                  Online
                </Button>
                <Button
                  variant={statusFilter === 'warning' ? 'default' : 'outline'}
                  onClick={() => setStatusFilter('warning')}
                  className={statusFilter === 'warning' ? 'bg-yellow-600' : 'border-slate-600 text-slate-300'}
                >
                  Alerta
                </Button>
                <Button
                  variant={statusFilter === 'offline' ? 'default' : 'outline'}
                  onClick={() => setStatusFilter('offline')}
                  className={statusFilter === 'offline' ? 'bg-red-600' : 'border-slate-600 text-slate-300'}
                >
                  Offline
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Lista de Servidores */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="bg-slate-800/50 border-slate-700">
                <CardContent className="p-6">
                  <div className="animate-pulse space-y-4">
                    <div className="h-6 bg-slate-700 rounded"></div>
                    <div className="h-4 bg-slate-700 rounded w-2/3"></div>
                    <div className="h-4 bg-slate-700 rounded w-1/2"></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredServers.map((server) => (
              <ServerCard key={server.id} server={server} onRefresh={loadServers} />
            ))}
          </div>
        )}

        {filteredServers.length === 0 && !isLoading && (
          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="p-12 text-center">
              <p className="text-slate-400 text-lg">Nenhum servidor encontrado</p>
              <p className="text-slate-500 text-sm mt-2">
                Tente ajustar os filtros ou adicionar um novo servidor
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      <AddServerModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAddServer={handleAddServer}
      />
    </div>
  );
};

export default Dashboard;
