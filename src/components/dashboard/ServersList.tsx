
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Server, Plus, Settings, Activity, Wifi, WifiOff, AlertTriangle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import AddServerModal from '@/components/AddServerModal';
import ServerConfigModal from '@/components/ServerConfigModal';
import ServerMetricsModal from '@/components/ServerMetricsModal';
import AlertConfigModal from '@/components/AlertConfigModal';
import RealDataBadge from '@/components/RealDataBadge';

interface Server {
  id: string;
  nome: string;
  ip: string;
  provedor?: string;
  status?: string;
  provider_token_id?: string;
  api_key?: string;
  webhook_url?: string;
}

interface ServersListProps {
  servers: Server[];
  onUpdate: () => void;
  onAddServer: () => void;
}

const ServersList: React.FC<ServersListProps> = ({ servers: propServers, onUpdate, onAddServer }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [servers, setServers] = useState<Server[]>(propServers || []);
  const [metrics, setMetrics] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedServer, setSelectedServer] = useState<Server | null>(null);
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [showMetricsModal, setShowMetricsModal] = useState(false);
  const [showAlertModal, setShowAlertModal] = useState(false);

  // Sincronizar com props quando mudarem
  useEffect(() => {
    if (propServers) {
      setServers(propServers);
    }
  }, [propServers]);

  const fetchData = async () => {
    if (!user) return;

    try {
      setLoading(true);
      
      // Buscar servidores se não foram passados via props
      if (!propServers || propServers.length === 0) {
        const { data: serversData, error: serversError } = await supabase
          .from('servidores')
          .select('*')
          .eq('usuario_id', user.id)
          .order('data_criacao', { ascending: false });

        if (serversError) throw serversError;
        setServers(serversData || []);
      }

      // Buscar métricas para todos os servidores
      const serverIds = (propServers || servers).map(s => s.id);
      if (serverIds.length > 0) {
        const { data: metricsData, error: metricsError } = await supabase
          .from('metricas')
          .select('*')
          .in('servidor_id', serverIds)
          .order('timestamp', { ascending: false });

        if (metricsError) throw metricsError;
        setMetrics(metricsData || []);
      }
    } catch (error: any) {
      console.error('Erro ao buscar dados:', error);
      toast({
        title: "Erro ao carregar dados",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [user, propServers]);

  const getLatestMetricForServer = (serverId: string) => {
    return metrics
      .filter(m => m.servidor_id === serverId)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0];
  };

  const handleAddServer = (serverData: Server) => {
    setServers(prev => [serverData, ...prev]);
    setShowAddModal(false);
    toast({ title: "Servidor adicionado com sucesso!" });
    if (onUpdate) onUpdate();
  };

  const handleConfigServer = (server: Server) => {
    setSelectedServer(server);
    setShowConfigModal(true);
  };

  const handleViewMetrics = (server: Server) => {
    setSelectedServer(server);
    setShowMetricsModal(true);
  };

  const handleViewAlerts = (server: Server) => {
    setSelectedServer(server);
    setShowAlertModal(true);
  };

  const handleUpdateServer = () => {
    fetchData();
    setShowConfigModal(false);
    setSelectedServer(null);
    if (onUpdate) onUpdate();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ativo': return 'bg-green-500';
      case 'inativo': return 'bg-gray-500';
      case 'erro': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getProviderIcon = (server: Server) => {
    const hasApiConnection = server.provider_token_id && server.provedor !== 'outros';
    return hasApiConnection ? (
      <Wifi className="h-4 w-4 text-green-600" />
    ) : (
      <WifiOff className="h-4 w-4 text-orange-600" />
    );
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <span className="ml-2">Carregando servidores...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center space-x-2">
              <Server className="h-5 w-5" />
              <span>Meus Servidores</span>
            </CardTitle>
            <Button onClick={onAddServer || (() => setShowAddModal(true))} size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Adicionar Servidor
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {servers.length === 0 ? (
            <div className="text-center py-8">
              <Server className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Nenhum servidor cadastrado</h3>
              <p className="text-muted-foreground mb-4">
                Adicione seu primeiro servidor para começar o monitoramento
              </p>
              <Button onClick={onAddServer || (() => setShowAddModal(true))}>
                <Plus className="h-4 w-4 mr-2" />
                Adicionar Primeiro Servidor
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {servers.map((server) => {
                const latestMetric = getLatestMetricForServer(server.id);
                return (
                  <Card key={server.id} className="relative">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <div className={`h-2 w-2 rounded-full ${getStatusColor(server.status || 'ativo')}`} />
                          <h3 className="font-semibold text-sm">{server.nome}</h3>
                        </div>
                        <div className="flex items-center gap-1">
                          {getProviderIcon(server)}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="space-y-1 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">IP:</span>
                          <span className="font-mono">{server.ip}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Provedor:</span>
                          <span className="capitalize">{server.provedor || 'outros'}</span>
                        </div>
                      </div>

                      <div className="flex justify-center">
                        <RealDataBadge metricas={latestMetric} />
                      </div>

                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewMetrics(server)}
                          className="flex-1"
                        >
                          <Activity className="h-4 w-4 mr-1" />
                          Métricas
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewAlerts(server)}
                          className="flex-1"
                        >
                          <AlertTriangle className="h-4 w-4 mr-1" />
                          Alertas
                        </Button>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleConfigServer(server)}
                          className="flex-1"
                        >
                          <Settings className="h-4 w-4 mr-1" />
                          Configurar
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <AddServerModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onAddServer={handleAddServer}
      />

      {selectedServer && (
        <>
          <ServerConfigModal
            server={selectedServer}
            isOpen={showConfigModal}
            onClose={() => {
              setShowConfigModal(false);
              setSelectedServer(null);
            }}
            onUpdate={handleUpdateServer}
          />

          <ServerMetricsModal
            serverId={selectedServer.id}
            serverName={selectedServer.nome}
            isOpen={showMetricsModal}
            onClose={() => {
              setShowMetricsModal(false);
              setSelectedServer(null);
            }}
          />

          <AlertConfigModal
            server={{ id: selectedServer.id, name: selectedServer.nome }}
            isOpen={showAlertModal}
            onClose={() => {
              setShowAlertModal(false);
              setSelectedServer(null);
            }}
            onUpdate={handleUpdateServer}
          />
        </>
      )}
    </>
  );
};

export default ServersList;
