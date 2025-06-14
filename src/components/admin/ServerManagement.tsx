
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search, Edit, Trash2, Server, Activity, RefreshCw, Eye } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import ServerMetrics from '@/components/ServerMetrics';
import ServerConfigModal from '@/components/ServerConfigModal';

const ServerManagement = () => {
  const [servers, setServers] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedServer, setSelectedServer] = useState<any>(null);
  const [isMetricsModalOpen, setIsMetricsModalOpen] = useState(false);
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadServers();
  }, []);

  const loadServers = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('servidores')
        .select(`
          *,
          profiles!inner(
            email,
            nome_completo,
            empresa
          ),
          metricas(
            cpu_usage,
            memoria_usage,
            disco_usage,
            timestamp
          )
        `)
        .order('data_criacao', { ascending: false });

      if (error) throw error;

      // Organizar métricas por timestamp descendente
      const serversWithSortedMetrics = (data || []).map(server => ({
        ...server,
        metricas: (server.metricas || []).sort((a: any, b: any) => 
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        )
      }));

      setServers(serversWithSortedMetrics);
    } catch (error: any) {
      console.error('Erro ao carregar servidores:', error);
      toast({
        title: "Erro ao carregar servidores",
        description: "Não foi possível carregar a lista de servidores.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const refreshMetrics = async () => {
    setIsRefreshing(true);
    try {
      const { error } = await supabase.functions.invoke('hetzner-monitor', {
        method: 'GET'
      });

      if (error) throw error;

      await loadServers();
      toast({
        title: "Métricas atualizadas",
        description: "As métricas de todos os servidores foram atualizadas.",
      });
    } catch (error: any) {
      console.error('Erro ao atualizar métricas:', error);
      toast({
        title: "Erro ao atualizar métricas",
        description: "Não foi possível atualizar as métricas.",
        variant: "destructive"
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleDeleteServer = async (serverId: string, serverName: string) => {
    try {
      // Deletar métricas relacionadas primeiro
      const { error: metricsError } = await supabase
        .from('metricas')
        .delete()
        .eq('servidor_id', serverId);

      if (metricsError) {
        console.warn('Erro ao deletar métricas:', metricsError);
      }

      // Deletar alertas relacionados
      const { error: alertsError } = await supabase
        .from('alertas')
        .delete()
        .eq('servidor_id', serverId);

      if (alertsError) {
        console.warn('Erro ao deletar alertas:', alertsError);
      }

      // Deletar servidor
      const { error } = await supabase
        .from('servidores')
        .delete()
        .eq('id', serverId);

      if (error) throw error;

      toast({
        title: "Servidor removido",
        description: `O servidor "${serverName}" foi removido com sucesso.`,
      });
      
      loadServers();
    } catch (error: any) {
      console.error('Erro ao deletar servidor:', error);
      toast({
        title: "Erro ao remover servidor",
        description: "Não foi possível remover o servidor.",
        variant: "destructive"
      });
    }
  };

  const filteredServers = servers.filter(server =>
    server.nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    server.ip?.includes(searchTerm) ||
    server.profiles?.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusColor = (server: any) => {
    const latestMetrics = server.metricas?.[0];
    if (!latestMetrics) return 'bg-red-500';
    
    const cpuUsage = latestMetrics.cpu_usage || 0;
    const memoryUsage = latestMetrics.memoria_usage || 0;
    const diskUsage = latestMetrics.disco_usage || 0;
    
    if (cpuUsage > 80 || memoryUsage > 90 || diskUsage > 90) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const getStatusText = (server: any) => {
    const latestMetrics = server.metricas?.[0];
    if (!latestMetrics) return 'Offline';
    
    const cpuUsage = latestMetrics.cpu_usage || 0;
    const memoryUsage = latestMetrics.memoria_usage || 0;
    const diskUsage = latestMetrics.disco_usage || 0;
    
    if (cpuUsage > 80 || memoryUsage > 90 || diskUsage > 90) return 'Alerta';
    return 'Online';
  };

  return (
    <div className="space-y-6">
      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-card border-border">
          <CardContent className="p-6">
            <div className="text-center">
              <p className="text-2xl font-bold text-foreground">{servers.length}</p>
              <p className="text-muted-foreground text-sm">Total de Servidores</p>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-card border-border">
          <CardContent className="p-6">
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">
                {servers.filter(s => getStatusText(s) === 'Online').length}
              </p>
              <p className="text-muted-foreground text-sm">Online</p>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-card border-border">
          <CardContent className="p-6">
            <div className="text-center">
              <p className="text-2xl font-bold text-yellow-600">
                {servers.filter(s => getStatusText(s) === 'Alerta').length}
              </p>
              <p className="text-muted-foreground text-sm">Com Alerta</p>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-card border-border">
          <CardContent className="p-6">
            <div className="text-center">
              <p className="text-2xl font-bold text-red-600">
                {servers.filter(s => getStatusText(s) === 'Offline').length}
              </p>
              <p className="text-muted-foreground text-sm">Offline</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros e busca */}
      <Card className="bg-card border-border">
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Buscar por nome, IP ou proprietário..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-background border-border"
              />
            </div>
            <Button
              onClick={refreshMetrics}
              disabled={isRefreshing}
              className="bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
              {isRefreshing ? 'Atualizando...' : 'Atualizar Métricas'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Lista de servidores */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-foreground">
            <Server className="h-5 w-5" />
            Servidores Monitorados
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">Carregando servidores...</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 text-foreground">Nome</th>
                    <th className="text-left py-3 text-foreground">IP</th>
                    <th className="text-left py-3 text-foreground">Proprietário</th>
                    <th className="text-left py-3 text-foreground">Provedor</th>
                    <th className="text-left py-3 text-foreground">Status</th>
                    <th className="text-left py-3 text-foreground">CPU/Mem/Disk</th>
                    <th className="text-left py-3 text-foreground">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredServers.map((server) => {
                    const latestMetrics = server.metricas?.[0];
                    return (
                      <tr key={server.id} className="border-b border-border">
                        <td className="py-3 text-foreground">{server.nome}</td>
                        <td className="py-3 font-mono text-foreground">{server.ip}</td>
                        <td className="py-3">
                          <div>
                            <p className="font-medium text-foreground">{server.profiles?.nome_completo || 'N/A'}</p>
                            <p className="text-sm text-muted-foreground">{server.profiles?.email}</p>
                          </div>
                        </td>
                        <td className="py-3 capitalize text-foreground">{server.provedor}</td>
                        <td className="py-3">
                          <Badge className={`${getStatusColor(server)} text-white`}>
                            {getStatusText(server)}
                          </Badge>
                        </td>
                        <td className="py-3">
                          {latestMetrics ? (
                            <div className="text-sm">
                              <p className="text-foreground">CPU: {Math.round(latestMetrics.cpu_usage || 0)}%</p>
                              <p className="text-foreground">Mem: {Math.round(latestMetrics.memoria_usage || 0)}%</p>
                              <p className="text-foreground">Disk: {Math.round(latestMetrics.disco_usage || 0)}%</p>
                            </div>
                          ) : (
                            <span className="text-muted-foreground">N/A</span>
                          )}
                        </td>
                        <td className="py-3">
                          <div className="flex gap-2">
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                              onClick={() => {
                                setSelectedServer(server);
                                setIsMetricsModalOpen(true);
                              }}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="text-green-600 hover:text-green-700 dark:text-green-400 dark:hover:text-green-300"
                              onClick={() => {
                                setSelectedServer(server);
                                setIsConfigModalOpen(true);
                              }}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent className="bg-card border-border">
                                <AlertDialogHeader>
                                  <AlertDialogTitle className="text-foreground">
                                    Confirmar remoção
                                  </AlertDialogTitle>
                                  <AlertDialogDescription className="text-muted-foreground">
                                    Tem certeza de que deseja remover o servidor "{server.nome}"? 
                                    Esta ação não pode ser desfeita e todos os dados de monitoramento serão perdidos.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel className="bg-secondary text-secondary-foreground border-border">
                                    Cancelar
                                  </AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handleDeleteServer(server.id, server.nome)}
                                    className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
                                  >
                                    Remover
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal de Métricas */}
      {selectedServer && (
        <Dialog open={isMetricsModalOpen} onOpenChange={setIsMetricsModalOpen}>
          <DialogContent className="bg-card border-border max-w-6xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-foreground">
                Monitoramento do Servidor - {selectedServer.nome}
              </DialogTitle>
            </DialogHeader>
            <ServerMetrics serverId={selectedServer.id} serverName={selectedServer.nome} />
          </DialogContent>
        </Dialog>
      )}

      {/* Modal de Configuração */}
      {selectedServer && (
        <ServerConfigModal
          server={{
            id: selectedServer.id,
            nome: selectedServer.nome, // Corrigindo aqui (era 'name')
            ip: selectedServer.ip,
            provedor: selectedServer.provedor,
            webhook_url: selectedServer.webhook_url,
            provider_token_id: selectedServer.provider_token_id,
            status: selectedServer.status,
          }}
          isOpen={isConfigModalOpen}
          onClose={() => setIsConfigModalOpen(false)}
          onUpdate={loadServers}
        />
      )}
    </div>
  );
};

export default ServerManagement;
