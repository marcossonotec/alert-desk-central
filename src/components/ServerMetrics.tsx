
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { Activity, Cpu, HardDrive, Network, Clock, RefreshCw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface ServerMetricsProps {
  serverId: string;
  serverName: string;
}

interface MetricData {
  timestamp: string;
  cpu_usage: number;
  memoria_usage: number;
  disco_usage: number;
  rede_in: number;
  rede_out: number;
  uptime: string;
}

const ServerMetrics: React.FC<ServerMetricsProps> = ({ serverId, serverName }) => {
  const [metrics, setMetrics] = useState<MetricData[]>([]);
  const [latestMetrics, setLatestMetrics] = useState<MetricData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadMetrics();
    // Atualizar métricas a cada 30 segundos
    const interval = setInterval(loadMetrics, 30000);
    return () => clearInterval(interval);
  }, [serverId]);

  const loadMetrics = async () => {
    try {
      const { data, error } = await supabase
        .from('metricas')
        .select('*')
        .eq('servidor_id', serverId)
        .order('timestamp', { ascending: false })
        .limit(50);

      if (error) throw error;

      const formattedData = (data || []).map(item => ({
        ...item,
        timestamp: new Date(item.timestamp).toLocaleTimeString('pt-BR', {
          hour: '2-digit',
          minute: '2-digit'
        })
      })).reverse();

      setMetrics(formattedData);
      setLatestMetrics(data?.[0] || null);
    } catch (error: any) {
      console.error('Erro ao carregar métricas:', error);
      toast({
        title: "Erro ao carregar métricas",
        description: "Não foi possível carregar as métricas do servidor.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const refreshMetrics = async () => {
    setIsRefreshing(true);
    try {
      // Chamar a função de monitoramento para coletar novas métricas
      const { error } = await supabase.functions.invoke('hetzner-monitor', {
        method: 'GET'
      });

      if (error) throw error;

      await loadMetrics();
      toast({
        title: "Métricas atualizadas",
        description: "As métricas foram atualizadas com sucesso.",
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

  const getStatusColor = (value: number, type: string) => {
    if (type === 'cpu' || type === 'memoria') {
      if (value > 80) return 'text-red-500';
      if (value > 60) return 'text-yellow-500';
      return 'text-green-500';
    }
    if (type === 'disco') {
      if (value > 90) return 'text-red-500';
      if (value > 75) return 'text-yellow-500';
      return 'text-green-500';
    }
    return 'text-foreground';
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="text-center py-8">
          <p className="text-muted-foreground">Carregando métricas...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-foreground">
          Métricas - {serverName}
        </h3>
        <Button
          onClick={refreshMetrics}
          disabled={isRefreshing}
          variant="outline"
          size="sm"
          className="border-border hover:bg-accent"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
          Atualizar
        </Button>
      </div>

      {/* Métricas Atuais */}
      {latestMetrics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-card border-border">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Cpu className="h-5 w-5 text-blue-500" />
                  <span className="text-sm font-medium text-foreground">CPU</span>
                </div>
                <Badge 
                  variant="outline" 
                  className={`${getStatusColor(latestMetrics.cpu_usage || 0, 'cpu')} border-border`}
                >
                  {Math.round(latestMetrics.cpu_usage || 0)}%
                </Badge>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Activity className="h-5 w-5 text-green-500" />
                  <span className="text-sm font-medium text-foreground">Memória</span>
                </div>
                <Badge 
                  variant="outline" 
                  className={`${getStatusColor(latestMetrics.memoria_usage || 0, 'memoria')} border-border`}
                >
                  {Math.round(latestMetrics.memoria_usage || 0)}%
                </Badge>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <HardDrive className="h-5 w-5 text-purple-500" />
                  <span className="text-sm font-medium text-foreground">Disco</span>
                </div>
                <Badge 
                  variant="outline" 
                  className={`${getStatusColor(latestMetrics.disco_usage || 0, 'disco')} border-border`}
                >
                  {Math.round(latestMetrics.disco_usage || 0)}%
                </Badge>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Clock className="h-5 w-5 text-orange-500" />
                  <span className="text-sm font-medium text-foreground">Uptime</span>
                </div>
                <span className="text-sm font-medium text-foreground">
                  {latestMetrics.uptime || 'N/A'}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Charts */}
      {metrics.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* CPU e Memória */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-foreground flex items-center gap-2">
                <Cpu className="h-5 w-5" />
                CPU e Memória
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={metrics}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis 
                    dataKey="timestamp" 
                    className="text-muted-foreground"
                    fontSize={12}
                  />
                  <YAxis 
                    className="text-muted-foreground"
                    fontSize={12}
                  />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '6px'
                    }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="cpu_usage" 
                    stroke="#3b82f6" 
                    strokeWidth={2}
                    name="CPU (%)"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="memoria_usage" 
                    stroke="#10b981" 
                    strokeWidth={2}
                    name="Memória (%)"
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Disco */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-foreground flex items-center gap-2">
                <HardDrive className="h-5 w-5" />
                Uso do Disco
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={metrics}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis 
                    dataKey="timestamp" 
                    className="text-muted-foreground"
                    fontSize={12}
                  />
                  <YAxis 
                    className="text-muted-foreground"
                    fontSize={12}
                  />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '6px'
                    }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="disco_usage" 
                    stroke="#8b5cf6" 
                    fill="#8b5cf6" 
                    fillOpacity={0.3}
                    name="Disco (%)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Rede */}
          <Card className="bg-card border-border lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-foreground flex items-center gap-2">
                <Network className="h-5 w-5" />
                Tráfego de Rede
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={metrics}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis 
                    dataKey="timestamp" 
                    className="text-muted-foreground"
                    fontSize={12}
                  />
                  <YAxis 
                    className="text-muted-foreground"
                    fontSize={12}
                  />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '6px'
                    }}
                    formatter={(value: any) => [`${(value / 1024).toFixed(2)} KB`, '']}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="rede_in" 
                    stroke="#f59e0b" 
                    strokeWidth={2}
                    name="Entrada (bytes)"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="rede_out" 
                    stroke="#ef4444" 
                    strokeWidth={2}
                    name="Saída (bytes)"
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      ) : (
        <Card className="bg-card border-border">
          <CardContent className="p-8 text-center">
            <Activity className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">
              Nenhuma métrica disponível
            </h3>
            <p className="text-muted-foreground mb-4">
              Não há dados de monitoramento para este servidor ainda.
            </p>
            <Button onClick={refreshMetrics} disabled={isRefreshing}>
              <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
              Coletar Métricas
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ServerMetrics;
