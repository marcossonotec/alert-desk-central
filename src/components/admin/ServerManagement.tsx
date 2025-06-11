
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search, Edit, Trash2, Server, Activity } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const ServerManagement = () => {
  const [servers, setServers] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
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
            timestamp
          )
        `)
        .order('data_criacao', { ascending: false });

      if (error) throw error;

      setServers(data || []);
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
    
    if (cpuUsage > 80 || memoryUsage > 90) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const getStatusText = (server: any) => {
    const latestMetrics = server.metricas?.[0];
    if (!latestMetrics) return 'Offline';
    
    const cpuUsage = latestMetrics.cpu_usage || 0;
    const memoryUsage = latestMetrics.memoria_usage || 0;
    
    if (cpuUsage > 80 || memoryUsage > 90) return 'Alerta';
    return 'Online';
  };

  return (
    <div className="space-y-6">
      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-card border-border">
          <CardContent className="p-6">
            <div className="text-center">
              <p className="text-2xl font-bold">{servers.length}</p>
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
          </div>
        </CardContent>
      </Card>

      {/* Lista de servidores */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
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
                    <th className="text-left py-3">Nome</th>
                    <th className="text-left py-3">IP</th>
                    <th className="text-left py-3">Proprietário</th>
                    <th className="text-left py-3">Provedor</th>
                    <th className="text-left py-3">Status</th>
                    <th className="text-left py-3">CPU/Mem</th>
                    <th className="text-left py-3">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredServers.map((server) => {
                    const latestMetrics = server.metricas?.[0];
                    return (
                      <tr key={server.id} className="border-b border-border">
                        <td className="py-3">{server.nome}</td>
                        <td className="py-3 font-mono">{server.ip}</td>
                        <td className="py-3">
                          <div>
                            <p className="font-medium">{server.profiles?.nome_completo || 'N/A'}</p>
                            <p className="text-sm text-muted-foreground">{server.profiles?.email}</p>
                          </div>
                        </td>
                        <td className="py-3 capitalize">{server.provedor}</td>
                        <td className="py-3">
                          <Badge className={`${getStatusColor(server)} text-white`}>
                            {getStatusText(server)}
                          </Badge>
                        </td>
                        <td className="py-3">
                          {latestMetrics ? (
                            <div className="text-sm">
                              <p>CPU: {Math.round(latestMetrics.cpu_usage || 0)}%</p>
                              <p>Mem: {Math.round(latestMetrics.memoria_usage || 0)}%</p>
                            </div>
                          ) : (
                            <span className="text-muted-foreground">N/A</span>
                          )}
                        </td>
                        <td className="py-3">
                          <div className="flex gap-2">
                            <Button variant="ghost" size="sm" className="text-blue-600 hover:text-blue-700">
                              <Activity className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm" className="text-green-600 hover:text-green-700">
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700">
                              <Trash2 className="h-4 w-4" />
                            </Button>
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
    </div>
  );
};

export default ServerManagement;
