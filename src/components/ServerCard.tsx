
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Settings, Trash2, Activity, Cpu, HardDrive, Network } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import ServerConfigModal from './ServerConfigModal';
import ServerMetrics from './ServerMetrics';

interface ServerCardProps {
  server: {
    id: string;
    nome: string;
    ip: string;
    status: string;
    provedor?: string;
    data_criacao?: string;
    metricas?: Array<{
      cpu_usage: number;
      memoria_usage: number;
      disco_usage: number;
      timestamp: string;
    }>;
  };
  onRefresh: () => void;
  showActions?: boolean;
}

const ServerCard: React.FC<ServerCardProps> = ({ server, onRefresh, showActions = true }) => {
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
  const [isMetricsModalOpen, setIsMetricsModalOpen] = useState(false);
  const { toast } = useToast();

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ativo':
        return 'bg-green-500';
      case 'inativo':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'ativo':
        return 'Online';
      case 'inativo':
        return 'Offline';
      default:
        return 'Desconhecido';
    }
  };

  const handleDeleteServer = async () => {
    try {
      const { error } = await supabase
        .from('servidores')
        .delete()
        .eq('id', server.id);

      if (error) throw error;

      toast({
        title: "Servidor removido",
        description: "O servidor foi removido com sucesso.",
      });
      onRefresh();
    } catch (error: any) {
      console.error('Erro ao deletar servidor:', error);
      toast({
        title: "Erro ao remover servidor",
        description: "Não foi possível remover o servidor.",
        variant: "destructive"
      });
    }
  };

  // Pegar as métricas mais recentes
  const latestMetrics = server.metricas?.[0];

  return (
    <>
      <Card className="bg-card border-border hover:shadow-md transition-shadow">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg text-foreground">{server.nome}</CardTitle>
            {showActions && (
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsMetricsModalOpen(true)}
                  className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                >
                  <Activity className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsConfigModalOpen(true)}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <Settings className="h-4 w-4" />
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
                        onClick={handleDeleteServer}
                        className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
                      >
                        Remover
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${getStatusColor(server.status)}`}></div>
            <Badge variant="outline" className="text-muted-foreground border-border">
              {getStatusText(server.status)}
            </Badge>
            <Badge variant="outline" className="text-muted-foreground border-border capitalize">
              {server.provedor}
            </Badge>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <div className="text-muted-foreground">
            <p className="text-sm">IP: <span className="font-mono text-foreground">{server.ip}</span></p>
            <p className="text-sm">Criado: {new Date(server.data_criacao || '').toLocaleDateString('pt-BR')}</p>
          </div>
          
          {latestMetrics && (
            <div className="space-y-3">
              <div className="grid grid-cols-3 gap-2 text-sm">
                <div className="flex items-center gap-1">
                  <Cpu className="h-3 w-3 text-blue-500" />
                  <span className="text-muted-foreground">CPU:</span>
                  <span className="text-foreground font-medium">{Math.round(latestMetrics.cpu_usage)}%</span>
                </div>
                <div className="flex items-center gap-1">
                  <Activity className="h-3 w-3 text-green-500" />
                  <span className="text-muted-foreground">RAM:</span>
                  <span className="text-foreground font-medium">{Math.round(latestMetrics.memoria_usage)}%</span>
                </div>
                <div className="flex items-center gap-1">
                  <HardDrive className="h-3 w-3 text-purple-500" />
                  <span className="text-muted-foreground">Disk:</span>
                  <span className="text-foreground font-medium">{Math.round(latestMetrics.disco_usage)}%</span>
                </div>
              </div>

              {/* Progress bars */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">CPU</span>
                  <span className="text-foreground">{Math.round(latestMetrics.cpu_usage)}%</span>
                </div>
                <div className="w-full bg-secondary rounded-full h-1.5">
                  <div 
                    className="bg-blue-500 h-1.5 rounded-full transition-all"
                    style={{ width: `${Math.min(latestMetrics.cpu_usage, 100)}%` }}
                  ></div>
                </div>

                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Memória</span>
                  <span className="text-foreground">{Math.round(latestMetrics.memoria_usage)}%</span>
                </div>
                <div className="w-full bg-secondary rounded-full h-1.5">
                  <div 
                    className="bg-green-500 h-1.5 rounded-full transition-all"
                    style={{ width: `${Math.min(latestMetrics.memoria_usage, 100)}%` }}
                  ></div>
                </div>
              </div>
            </div>
          )}
          
          <div className="text-xs text-muted-foreground pt-2 border-t border-border">
            Última atualização: {latestMetrics ? 
              new Date(latestMetrics.timestamp).toLocaleString('pt-BR') : 
              'Nunca'
            }
          </div>
        </CardContent>
      </Card>

      {/* Modal de Configuração */}
      <ServerConfigModal
        server={{
          id: server.id,
          name: server.nome,
          ip: server.ip,
          provedor: server.provedor
        }}
        isOpen={isConfigModalOpen}
        onClose={() => setIsConfigModalOpen(false)}
        onUpdate={onRefresh}
      />

      {/* Modal de Métricas */}
      <Dialog open={isMetricsModalOpen} onOpenChange={setIsMetricsModalOpen}>
        <DialogContent className="bg-card border-border max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-foreground">
              Monitoramento do Servidor
            </DialogTitle>
          </DialogHeader>
          <ServerMetrics serverId={server.id} serverName={server.nome} />
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ServerCard;
