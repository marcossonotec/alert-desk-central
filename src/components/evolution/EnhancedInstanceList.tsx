import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  MessageSquare, 
  Trash2, 
  RefreshCw, 
  Settings, 
  QrCode,
  Activity,
  Zap,
  Wifi,
  WifiOff,
  Clock
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import QRCodeManager from './QRCodeManager';
import ConnectionProgressIndicator from './ConnectionProgressIndicator';

interface InstanceListProps {
  onUpdate?: () => void;
  onEditMessages: (instanceId: string, instanceName: string) => void;
}

const EnhancedInstanceList: React.FC<InstanceListProps> = ({
  onUpdate,
  onEditMessages,
}) => {
  const [instances, setInstances] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showQRCode, setShowQRCode] = useState<string | null>(null);
  const [instanceStatuses, setInstanceStatuses] = useState<Record<string, string>>({});
  const [lastUpdated, setLastUpdated] = useState<Record<string, Date>>({});
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      loadInstances();
    }
  }, [user]);

  // Polling inteligente para status
  useEffect(() => {
    if (instances.length === 0) return;

    const interval = setInterval(() => {
      instances.forEach(instance => {
        if (instanceStatuses[instance.id] !== 'connected') {
          checkInstanceStatus(instance.id, false); // Silent check
        }
      });
    }, 5000); // Check every 5 seconds for non-connected instances

    return () => clearInterval(interval);
  }, [instances, instanceStatuses]);

  const loadInstances = async () => {
    if (!user) return;

    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('evolution_instances')
        .select('*')
        .eq('usuario_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      const instancesData = data || [];
      setInstances(instancesData);
      
      // Initialize status tracking
      const statusMap: Record<string, string> = {};
      const dateMap: Record<string, Date> = {};
      
      instancesData.forEach(instance => {
        statusMap[instance.id] = instance.status || 'disconnected';
        dateMap[instance.id] = new Date();
      });
      
      setInstanceStatuses(statusMap);
      setLastUpdated(dateMap);
    } catch (error: any) {
      console.error('Erro ao carregar instâncias:', error);
      toast({
        title: "Erro ao carregar instâncias",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (instanceId: string, instanceName: string) => {
    if (!window.confirm(`Tem certeza que deseja deletar a instância "${instanceName}"? Esta ação não pode ser desfeita.`)) {
      return;
    }

    try {
      setIsLoading(true);
      
      const { error } = await supabase.functions.invoke('evolution-api', {
        body: {
          action: 'delete-instance',
          instance_id: instanceId
        }
      });

      if (error) throw error;

      toast({
        title: "Instância deletada",
        description: "A instância foi removida com sucesso.",
      });

      await loadInstances();
      if (onUpdate) onUpdate();
    } catch (error: any) {
      console.error('Erro ao deletar instância:', error);
      toast({
        title: "Erro ao deletar",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const checkInstanceStatus = async (instanceId: string, showToast = true) => {
    try {
      const { data, error } = await supabase.functions.invoke('evolution-api', {
        body: {
          action: 'check-status',
          instance_id: instanceId
        }
      });

      if (error) throw error;

      if (data?.success) {
        const newStatus = data.status;
        setInstanceStatuses(prev => ({
          ...prev,
          [instanceId]: newStatus
        }));
        setLastUpdated(prev => ({
          ...prev,
          [instanceId]: new Date()
        }));

        if (showToast) {
          toast({
            title: "Status atualizado",
            description: `Status da instância: ${getStatusText(newStatus)}`,
          });
        }

        // Update in database
        await supabase
          .from('evolution_instances')
          .update({ status: newStatus })
          .eq('id', instanceId);

        if (onUpdate) onUpdate();
      }
    } catch (error: any) {
      console.error('Erro ao atualizar status:', error);
      if (showToast) {
        toast({
          title: "Erro ao atualizar",
          description: error.message,
          variant: "destructive"
        });
      }
    }
  };

  const handleShowQRCode = (instanceId: string) => {
    setShowQRCode(instanceId);
  };

  const handleStatusChange = (instanceId: string, newStatus: string) => {
    setInstanceStatuses(prev => ({
      ...prev,
      [instanceId]: newStatus
    }));
    setLastUpdated(prev => ({
      ...prev,
      [instanceId]: new Date()
    }));
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'connected':
        return 'bg-green-500 text-white';
      case 'connecting':
        return 'bg-yellow-500 text-white';
      case 'disconnected':
        return 'bg-red-500 text-white';
      case 'qr_ready':
        return 'bg-blue-500 text-white';
      case 'qr_scanned':
        return 'bg-orange-500 text-white';
      default:
        return 'bg-gray-500 text-white';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'connected':
        return 'Conectado';
      case 'connecting':
        return 'Conectando';
      case 'disconnected':
        return 'Desconectado';
      case 'qr_ready':
        return 'QR Pronto';
      case 'qr_scanned':
        return 'QR Escaneado';
      default:
        return 'Desconhecido';
    }
  };

  const getConnectionStrength = (status: string, lastUpdate: Date) => {
    const now = new Date();
    const minutesSinceUpdate = (now.getTime() - lastUpdate.getTime()) / (1000 * 60);
    
    if (status === 'connected' && minutesSinceUpdate < 5) return 100;
    if (status === 'connected' && minutesSinceUpdate < 15) return 75;
    if (status === 'connecting') return 50;
    if (status === 'qr_ready' || status === 'qr_scanned') return 25;
    return 0;
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

  if (isLoading && instances.length === 0) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mr-3"></div>
        <div className="text-muted-foreground">Carregando instâncias...</div>
      </div>
    );
  }

  if (instances.length === 0) {
    return (
      <div className="text-center p-8 space-y-4">
        <div className="bg-muted/20 rounded-full w-16 h-16 flex items-center justify-center mx-auto">
          <MessageSquare className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-medium text-foreground">
          Nenhuma instância encontrada
        </h3>
        <p className="text-muted-foreground">
          Crie sua primeira instância WhatsApp na aba "Criar Nova".
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4">
        {instances.map((instance) => {
          const currentStatus = instanceStatuses[instance.id] || instance.status || 'disconnected';
          const lastUpdate = lastUpdated[instance.id] || new Date(instance.updated_at);
          const connectionStrength = getConnectionStrength(currentStatus, lastUpdate);
          
          return (
            <Card key={instance.id} className="bg-card border-border hover:shadow-md transition-all duration-200 hover-scale">
              <CardContent className="p-4">
                <div className="space-y-4">
                  {/* Header */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="relative">
                        <MessageSquare className="h-8 w-8 text-green-600" />
                        {currentStatus === 'connected' && (
                          <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full animate-pulse border-2 border-background"></div>
                        )}
                      </div>
                      <div>
                        <h3 className="font-medium text-foreground">
                          {instance.instance_name}
                        </h3>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge className={getStatusColor(currentStatus)}>
                            {currentStatus === 'connected' && <Wifi className="w-3 h-3 mr-1" />}
                            {currentStatus === 'connecting' && <Zap className="w-3 h-3 mr-1 animate-spin" />}
                            {currentStatus === 'disconnected' && <WifiOff className="w-3 h-3 mr-1" />}
                            {getStatusText(currentStatus)}
                          </Badge>
                          {lastUpdate && (
                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {formatTimeSince(lastUpdate)}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Connection Progress */}
                  <ConnectionProgressIndicator status={currentStatus} />

                  {/* Connection Strength */}
                  {currentStatus === 'connected' && (
                    <div className="space-y-2">
                      <div className="flex justify-between text-xs">
                        <span className="text-muted-foreground">Qualidade da Conexão</span>
                        <span className={`font-medium ${connectionStrength > 75 ? 'text-green-600' : connectionStrength > 50 ? 'text-yellow-600' : 'text-red-600'}`}>
                          {connectionStrength > 75 ? 'Excelente' : connectionStrength > 50 ? 'Boa' : 'Fraca'}
                        </span>
                      </div>
                      <Progress value={connectionStrength} className="h-2" />
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex gap-2">
                    <Button
                      onClick={() => handleShowQRCode(instance.id)}
                      disabled={isLoading}
                      variant="outline"
                      size="sm"
                      className="flex-1 text-green-600 hover:text-green-700 border-green-200 hover:border-green-300"
                    >
                      <QrCode className="h-4 w-4 mr-2" />
                      {currentStatus === 'connected' ? 'Ver QR' : 'Conectar'}
                    </Button>
                    
                    <Button
                      onClick={() => onEditMessages(instance.id, instance.instance_name)}
                      disabled={isLoading || currentStatus !== 'connected'}
                      variant="outline"
                      size="sm"
                      className="flex-1"
                    >
                      <Settings className="h-4 w-4 mr-2" />
                      Mensagens
                    </Button>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button
                      onClick={() => checkInstanceStatus(instance.id)}
                      disabled={isLoading}
                      variant="outline"
                      size="sm"
                      className="flex-1"
                    >
                      <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                      Atualizar
                    </Button>
                    
                    <Button
                      onClick={() => handleDelete(instance.id, instance.instance_name)}
                      disabled={isLoading}
                      variant="outline"
                      size="sm"
                      className="flex-1 text-red-600 hover:text-red-700 border-red-200 hover:border-red-300"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Deletar
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
      
      {/* QR Code Manager Modal */}
      {showQRCode && (
        <QRCodeManager
          instanceId={showQRCode}
          instanceName={instances.find(i => i.id === showQRCode)?.instance_name || ''}
          isOpen={!!showQRCode}
          onClose={() => setShowQRCode(null)}
          onStatusChange={(status) => handleStatusChange(showQRCode, status)}
        />
      )}
    </>
  );
};

export default EnhancedInstanceList;