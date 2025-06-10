
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, RefreshCw, Search, Filter } from 'lucide-react';
import { Input } from '@/components/ui/input';
import ServerCard from '@/components/ServerCard';
import AddServerModal from '@/components/AddServerModal';

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
}

const Dashboard = () => {
  const [servers, setServers] = useState<Server[]>([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | ServerStatus>('all');

  // Dados mockados para demonstração
  useEffect(() => {
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
  }, []);

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
    const newServer: Server = {
      id: Date.now().toString(),
      name: serverData.name,
      ip: serverData.ip,
      status: 'online',
      uptime: '0d 0h 0m',
      cpu: 0,
      memory: 0,
      lastUpdate: 'Agora',
    };
    setServers([...servers, newServer]);
    setIsAddModalOpen(false);
  };

  const refreshServers = () => {
    // Implementar lógica de refresh aqui
    console.log('Atualizando servidores...');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white">Dashboard</h1>
            <p className="text-slate-300">Monitore seus servidores em tempo real</p>
          </div>
          <div className="flex gap-3">
            <Button
              onClick={refreshServers}
              variant="outline"
              className="border-slate-600 text-slate-300 hover:bg-slate-700"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Atualizar
            </Button>
            <Button
              onClick={() => setIsAddModalOpen(true)}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              Adicionar Servidor
            </Button>
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredServers.map((server) => (
            <ServerCard key={server.id} server={server} />
          ))}
        </div>

        {filteredServers.length === 0 && (
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
        onSave={handleAddServer}
      />
    </div>
  );
};

export default Dashboard;
