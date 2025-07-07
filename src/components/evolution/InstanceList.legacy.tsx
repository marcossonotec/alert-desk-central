import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MessageSquare, Trash2, RefreshCw, Settings, QrCode } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import QRCodeDisplay from './QRCodeDisplay';

interface InstanceListProps {
  onUpdate?: () => void;
  onEditMessages: (instanceId: string, instanceName: string) => void;
}

const InstanceList: React.FC<InstanceListProps> = ({
  onUpdate,
  onEditMessages,
}) => {
  const [instances, setInstances] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showQRCode, setShowQRCode] = useState<string | null>(null);
  const [qrCodeData, setQrCodeData] = useState<string | null>(null);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      loadInstances();
    }
  }, [user]);

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
      setInstances(data || []);
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

  const handleDelete = async (instanceId: string) => {
    try {
      setIsLoading(true);
      
      // Chamar edge function para deletar
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

  const handleRefresh = async (instanceId: string) => {
    try {
      setIsLoading(true);
      
      // Verificar status via edge function
      const { data, error } = await supabase.functions.invoke('evolution-api', {
        body: {
          action: 'check-status',
          instance_id: instanceId
        }
      });

      if (error) throw error;

      toast({
        title: "Status atualizado",
        description: `Status da instância: ${data.status}`,
      });

      await loadInstances();
      if (onUpdate) onUpdate();
    } catch (error: any) {
      console.error('Erro ao atualizar status:', error);
      toast({
        title: "Erro ao atualizar",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleShowQRCode = async (instanceId: string) => {
    try {
      setIsLoading(true);
      
      const { data, error } = await supabase.functions.invoke('evolution-api', {
        body: {
          action: 'get-qr',
          instance_id: instanceId
        }
      });
      
      if (error) throw error;
      
      if (data?.success && data.qr_code) {
        setQrCodeData(data.qr_code);
        setShowQRCode(instanceId);
      } else {
        toast({
          title: "QR Code não disponível",
          description: "QR Code ainda não está pronto. Tente novamente em alguns segundos.",
          variant: "destructive"
        });
      }
    } catch (error: any) {
      console.error('Erro ao buscar QR Code:', error);
      toast({
        title: "Erro ao buscar QR Code",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'connected':
        return 'bg-green-100 text-green-800';
      case 'disconnected':
        return 'bg-red-100 text-red-800';
      case 'connecting':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'connected':
        return 'Conectado';
      case 'disconnected':
        return 'Desconectado';
      case 'connecting':
        return 'Conectando';
      default:
        return 'Desconhecido';
    }
  };

  if (isLoading && instances.length === 0) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="text-muted-foreground">Carregando instâncias...</div>
      </div>
    );
  }

  if (instances.length === 0) {
    return (
      <div className="text-center p-8">
        <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-medium text-foreground mb-2">
          Nenhuma instância encontrada
        </h3>
        <p className="text-muted-foreground">
          Crie sua primeira instância WhatsApp na aba "Criar Nova".
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {instances.map((instance) => (
        <Card key={instance.id} className="bg-card border-border">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <MessageSquare className="h-8 w-8 text-green-600" />
                <div>
                  <h3 className="font-medium text-foreground">
                    {instance.instance_name}
                  </h3>
                  <Badge className={getStatusColor(instance.status)}>
                    {getStatusText(instance.status)}
                  </Badge>
                </div>
              </div>
              <div className="flex space-x-2">
                <Button
                  onClick={() => handleShowQRCode(instance.id)}
                  disabled={isLoading}
                  variant="outline"
                  size="sm"
                  title="Mostrar QR Code"
                  className="text-green-600 hover:text-green-700"
                >
                  <QrCode className="h-4 w-4" />
                </Button>
                <Button
                  onClick={() => onEditMessages(instance.id, instance.instance_name)}
                  disabled={isLoading || instance.status !== 'connected'}
                  variant="outline"
                  size="sm"
                  title="Editar mensagens"
                >
                  <Settings className="h-4 w-4" />
                </Button>
                <Button
                  onClick={() => handleRefresh(instance.id)}
                  disabled={isLoading}
                  variant="outline"
                  size="sm"
                  title="Atualizar status"
                >
                  <RefreshCw className="h-4 w-4" />
                </Button>
                <Button
                  onClick={() => handleDelete(instance.id)}
                  disabled={isLoading}
                  variant="outline"
                  size="sm"
                  className="text-red-600 hover:text-red-700"
                  title="Deletar instância"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
      
      {showQRCode && qrCodeData && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-card p-6 rounded-lg max-w-md w-full mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium">QR Code - WhatsApp</h3>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setShowQRCode(null);
                  setQrCodeData(null);
                }}
              >
                Fechar
              </Button>
            </div>
            <QRCodeDisplay 
              qrCode={qrCodeData}
              instanceName={instances.find(i => i.id === showQRCode)?.instance_name || ''}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default InstanceList;