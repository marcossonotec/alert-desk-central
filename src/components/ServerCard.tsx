
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Server, 
  Cpu, 
  MemoryStick, 
  HardDrive, 
  Settings, 
  Eye, 
  Trash2,
  AlertTriangle,
  RefreshCw
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import ServerConfigModal from './ServerConfigModal';
import ServerMetricsModal from './ServerMetricsModal';
import AlertConfigModal from './AlertConfigModal';

interface ServerCardProps {
  server: {
    id: string;
    nome: string;
    ip: string;
    provedor?: string;
    status?: string;
    ultima_verificacao?: string;
  };
  onUpdate: () => void;
  isAdmin?: boolean;
}

const ServerCard: React.FC<ServerCardProps> = ({ server, onUpdate, isAdmin = false }) => {
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [showMetricsModal, setShowMetricsModal] = useState(false);
  const [showAlertModal, setShowAlertModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [metrics, setMetrics] = useState<any>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const { toast } = useToast();

  const loadMetrics = async (showLoader = false) => {
    try {
      if (showLoader) setIsUpdating(true);
      
      const { data, error } = await supabase
        .from('metricas')
        .select('*')
        .eq('servidor_id', server.id)
        .order('timestamp', { ascending: false })
        .limit(1);

      if (error) throw error;
      
      if (data && data.length > 0) {
        setMetrics(data[0]);
        setLastUpdate(new Date());
      }
    } catch (error) {
      console.error('Erro ao carregar métricas:', error);
    } finally {
      if (showLoader) setIsUpdating(false);
    }
  };

  // Atualização automática a cada 30 segundos
  useEffect(() => {
    loadMetrics();
    
    const interval = setInterval(() => {
      loadMetrics();
    }, 30000);

    return () => clearInterval(interval);
  }, [server.id]);

  const deleteServer = async () => {
    if (!window.confirm('Tem certeza que deseja excluir este servidor? Esta ação não pode ser desfeita.')) {
      return;
    }

    try {
      setIsDeleting(true);
      
      const { error } = await supabase
        .from('servidores')
        .delete()
        .eq('id', server.id);

      if (error) throw error;

      toast({
        title: "Servidor excluído",
        description: "O servidor foi removido com sucesso.",
      });
      
      onUpdate();
    } catch (error: any) {
      console.error('Erro ao excluir servidor:', error);
      toast({
        title: "Erro ao excluir servidor",
        description: "Não foi possível remover o servidor.",
        variant: "destructive"
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const getMetricColor = (value: number, type: string) => {
    if (type === 'disco' && value > 90) return 'text-red-500';
    if (value > 85) return 'text-red-500';
    if (value > 70) return 'text-orange-500';
    return 'text-green-500';
  };

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'ativo': return 'bg-green-500';
      case 'inativo': return 'bg-red-500';
      case 'manutencao': return 'bg-yellow-500';
      default: return 'bg-gray-500';
    }
  };

  const formatTimeSince = (date: Date) => {
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) {
      return `${diffInSeconds}s atrás`;
    } else if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60);
      return `${minutes}m atrás`;
    } else {
      const hours = Math.floor(diffInSeconds / 3600);
      return `${hours}h atrás`;
    }
  };

  return (
    <>
      <Card className="bg-card border-border hover:shadow-md transition-shadow">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center space-x-2">
              <Server className="h-5 w-5 text-primary" />
              <span className="text-foreground">{server.nome}</span>
            </CardTitle>
            <div className="flex items-center space-x-2">
              <Badge className={`${getStatusColor(server.status)} text-white`}>
                {server.status || 'ativo'}
              </Badge>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => loadMetrics(true)}
                disabled={isUpdating}
                className="h-6 w-6 p-0"
              >
                <RefreshCw className={`h-3 w-3 ${isUpdating ? 'animate-spin' : ''}`} />
              </Button>
            </div>
          </div>
          <p className="text-sm text-muted-foreground">{server.ip}</p>
          <p className="text-xs text-muted-foreground">
            Provedor: {server.provedor || 'Não informado'}
          </p>
          {lastUpdate && (
            <p className="text-xs text-muted-foreground">
              Última atualização: {formatTimeSince(lastUpdate)}
            </p>
          )}
        </CardHeader>
        
        <CardContent className="space-y-4">
          {/* Métricas em tempo real */}
          {metrics && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Cpu className="h-4 w-4 text-blue-500" />
                  <span className="text-sm">CPU</span>
                </div>
                <span className={`text-sm font-medium ${getMetricColor(metrics.cpu_usage, 'cpu')}`}>
                  {metrics.cpu_usage?.toFixed(1)}%
                </span>
              </div>
              <Progress value={metrics.cpu_usage} className="h-2" />
              
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <MemoryStick className="h-4 w-4 text-purple-500" />
                  <span className="text-sm">Memória</span>
                </div>
                <span className={`text-sm font-medium ${getMetricColor(metrics.memoria_usage, 'memoria')}`}>
                  {metrics.memoria_usage?.toFixed(1)}%
                </span>
              </div>
              <Progress value={metrics.memoria_usage} className="h-2" />
              
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <HardDrive className="h-4 w-4 text-orange-500" />
                  <span className="text-sm">Disco</span>
                </div>
                <span className={`text-sm font-medium ${getMetricColor(metrics.disco_usage, 'disco')}`}>
                  {metrics.disco_usage?.toFixed(1)}%
                </span>
              </div>
              <Progress value={metrics.disco_usage} className="h-2" />
              
              {metrics.uptime && (
                <p className="text-xs text-muted-foreground">
                  Uptime: {metrics.uptime}
                </p>
              )}
            </div>
          )}
          
          {!metrics && (
            <div className="text-center py-4 text-muted-foreground">
              <Server className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">Aguardando métricas...</p>
            </div>
          )}
          
          {/* Botões de ação */}
          <div className="flex gap-2 pt-4 border-t border-border">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowMetricsModal(true)}
              className="flex-1"
            >
              <Eye className="h-4 w-4 mr-1" />
              Métricas
            </Button>
            
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowAlertModal(true)}
              className="flex-1"
            >
              <AlertTriangle className="h-4 w-4 mr-1" />
              Alertas
            </Button>
          </div>
          
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowConfigModal(true)}
              className="flex-1"
            >
              <Settings className="h-4 w-4 mr-1" />
              Configurar
            </Button>
            
            {isAdmin && (
              <Button
                size="sm"
                variant="destructive"
                onClick={deleteServer}
                disabled={isDeleting}
                className="flex-1"
              >
                <Trash2 className="h-4 w-4 mr-1" />
                {isDeleting ? 'Removendo...' : 'Excluir'}
              </Button>
            )}
          </div>
          
          {server.ultima_verificacao && (
            <p className="text-xs text-muted-foreground text-center pt-2">
              Última verificação: {new Date(server.ultima_verificacao).toLocaleString()}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Modais */}
      <ServerConfigModal
        server={{ id: server.id, name: server.nome, ip: server.ip, provedor: server.provedor }}
        isOpen={showConfigModal}
        onClose={() => setShowConfigModal(false)}
        onUpdate={onUpdate}
      />

      <ServerMetricsModal
        serverId={server.id}
        serverName={server.nome}
        isOpen={showMetricsModal}
        onClose={() => setShowMetricsModal(false)}
      />

      <AlertConfigModal
        server={{ id: server.id, name: server.nome }}
        isOpen={showAlertModal}
        onClose={() => setShowAlertModal(false)}
        onUpdate={onUpdate}
      />
    </>
  );
};

export default ServerCard;
