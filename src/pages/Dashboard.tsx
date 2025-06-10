
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Monitor, Plus, Settings, LogOut, Server, Activity, AlertCircle, CheckCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import ServerCard from '@/components/ServerCard';
import AddServerModal from '@/components/AddServerModal';

const Dashboard = () => {
  const [isAddServerModalOpen, setIsAddServerModalOpen] = useState(false);
  const [servers, setServers] = useState([
    {
      id: '1',
      name: 'Web Server 01',
      ip: '192.168.1.10',
      status: 'online',
      uptime: '15 dias',
      cpu: 45,
      memory: 68,
      lastUpdate: '2 min atrás'
    },
    {
      id: '2',
      name: 'Database Server',
      ip: '192.168.1.20',
      status: 'warning',
      uptime: '8 dias',
      cpu: 78,
      memory: 85,
      lastUpdate: '1 min atrás'
    },
    {
      id: '3',
      name: 'API Server',
      ip: '192.168.1.30',
      status: 'offline',
      uptime: '0 dias',
      cpu: 0,
      memory: 0,
      lastUpdate: '30 min atrás'
    }
  ]);

  const stats = {
    totalServers: servers.length,
    onlineServers: servers.filter(s => s.status === 'online').length,
    warningServers: servers.filter(s => s.status === 'warning').length,
    offlineServers: servers.filter(s => s.status === 'offline').length
  };

  const handleAddServer = (serverData: any) => {
    const newServer = {
      id: Date.now().toString(),
      ...serverData,
      status: 'online',
      uptime: '0 dias',
      cpu: Math.floor(Math.random() * 100),
      memory: Math.floor(Math.random() * 100),
      lastUpdate: 'Agora'
    };
    setServers([...servers, newServer]);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      {/* Header */}
      <header className="border-b border-slate-700/50 bg-slate-900/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <Monitor className="h-8 w-8 text-blue-400" />
            <span className="text-2xl font-bold text-white">DeskTools</span>
          </div>
          <nav className="flex items-center space-x-4">
            <Button variant="ghost" className="text-slate-300 hover:text-white">
              <Settings className="h-4 w-4 mr-2" />
              Configurações
            </Button>
            <Link to="/">
              <Button variant="ghost" className="text-slate-300 hover:text-white">
                <LogOut className="h-4 w-4 mr-2" />
                Sair
              </Button>
            </Link>
          </nav>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm">Total de Servidores</p>
                  <p className="text-2xl font-bold text-white">{stats.totalServers}</p>
                </div>
                <Server className="h-8 w-8 text-blue-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm">Online</p>
                  <p className="text-2xl font-bold text-green-400">{stats.onlineServers}</p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm">Alertas</p>
                  <p className="text-2xl font-bold text-yellow-400">{stats.warningServers}</p>
                </div>
                <Activity className="h-8 w-8 text-yellow-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm">Offline</p>
                  <p className="text-2xl font-bold text-red-400">{stats.offlineServers}</p>
                </div>
                <AlertCircle className="h-8 w-8 text-red-400" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Servers Section */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-white">Seus Servidores</h2>
          <Button 
            onClick={() => setIsAddServerModalOpen(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            <Plus className="h-4 w-4 mr-2" />
            Adicionar Servidor
          </Button>
        </div>

        {/* Servers Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {servers.map((server) => (
            <ServerCard key={server.id} server={server} />
          ))}
        </div>

        {servers.length === 0 && (
          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="p-12 text-center">
              <Server className="h-16 w-16 text-slate-500 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">Nenhum servidor adicionado</h3>
              <p className="text-slate-400 mb-6">
                Comece adicionando seu primeiro servidor para monitoramento
              </p>
              <Button 
                onClick={() => setIsAddServerModalOpen(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Plus className="h-4 w-4 mr-2" />
                Adicionar Primeiro Servidor
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      <AddServerModal
        isOpen={isAddServerModalOpen}
        onClose={() => setIsAddServerModalOpen(false)}
        onAddServer={handleAddServer}
      />
    </div>
  );
};

export default Dashboard;
