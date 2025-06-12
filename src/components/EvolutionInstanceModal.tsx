
import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { MessageSquare } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import CreateInstanceForm from '@/components/evolution/CreateInstanceForm';
import InstanceList from '@/components/evolution/InstanceList';
import QRCodeDisplay from '@/components/evolution/QRCodeDisplay';

interface EvolutionInstanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInstanceUpdate?: () => void;
}

const EvolutionInstanceModal: React.FC<EvolutionInstanceModalProps> = ({
  isOpen,
  onClose,
  onInstanceUpdate,
}) => {
  const [instances, setInstances] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [userPlan, setUserPlan] = useState<string>('free');
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [qrInstanceName, setQrInstanceName] = useState<string>('');
  const [statusCheckInterval, setStatusCheckInterval] = useState<NodeJS.Timeout | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen) {
      loadData();
    } else {
      // Limpar intervalo quando modal fechar
      if (statusCheckInterval) {
        clearInterval(statusCheckInterval);
        setStatusCheckInterval(null);
      }
    }
  }, [isOpen]);

  // Limpar intervalo quando componente desmontar
  useEffect(() => {
    return () => {
      if (statusCheckInterval) {
        clearInterval(statusCheckInterval);
      }
    };
  }, [statusCheckInterval]);

  const loadData = async () => {
    try {
      setIsLoading(true);
      
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      setUser(currentUser);

      if (!currentUser) return;

      // Buscar perfil do usuário para obter o plano
      const { data: profileData } = await supabase
        .from('profiles')
        .select('plano_ativo')
        .eq('id', currentUser.id)
        .single();

      if (profileData) {
        setUserPlan(profileData.plano_ativo || 'free');
      }

      // Buscar instâncias existentes
      const { data: instancesData, error } = await supabase
        .from('evolution_instances')
        .select('*')
        .eq('usuario_id', currentUser.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setInstances(instancesData || []);
    } catch (error: any) {
      console.error('Erro ao carregar dados:', error);
      toast({
        title: "Erro ao carregar dados",
        description: "Não foi possível carregar as instâncias.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getMaxInstances = () => {
    switch (userPlan) {
      case 'free':
        return 0;
      case 'profissional':
      case 'empresarial':
        return 1;
      default:
        return 0;
    }
  };

  const canCreateInstance = () => {
    const maxInstances = getMaxInstances();
    return maxInstances > 0 && instances.length < maxInstances;
  };

  const startStatusChecking = (instanceId: string) => {
    // Limpar intervalo existente se houver
    if (statusCheckInterval) {
      clearInterval(statusCheckInterval);
    }

    const interval = setInterval(async () => {
      try {
        const { data, error } = await supabase.functions.invoke('evolution-api', {
          body: {
            action: 'check-status',
            instance_id: instanceId
          }
        });

        if (error) throw error;

        if (data.success && data.status === 'connected') {
          // Parar verificação quando conectado
          clearInterval(interval);
          setStatusCheckInterval(null);
          
          // Recarregar dados para atualizar a UI
          await loadData();
          
          // Chamar callback se fornecido
          if (onInstanceUpdate) {
            onInstanceUpdate();
          }
          
          // Limpar QR Code
          setQrCode(null);
          setQrInstanceName('');
          
          toast({
            title: "WhatsApp conectado!",
            description: "Sua instância foi conectada com sucesso.",
          });
        }
      } catch (error) {
        console.error('Erro ao verificar status:', error);
      }
    }, 5000); // Verificar a cada 5 segundos

    setStatusCheckInterval(interval);
  };

  const createInstance = async (instanceName: string) => {
    if (!canCreateInstance()) {
      toast({
        title: "Limite atingido",
        description: "Seu plano não permite criar mais instâncias.",
        variant: "destructive"
      });
      return;
    }

    try {
      setIsLoading(true);
      setQrCode(null);

      const { data, error } = await supabase.functions.invoke('evolution-api', {
        body: {
          action: 'create-instance',
          usuario_id: user?.id,
          instance_name: instanceName
        }
      });

      if (error) throw error;

      if (data.success) {
        toast({
          title: "Instância criada",
          description: "Aguarde, vamos gerar o QR Code...",
        });
        
        // Recarregar dados primeiro
        await loadData();
        
        // Aguardar um pouco e buscar o QR Code
        setTimeout(async () => {
          await getQRCode(data.instance.id);
          // Iniciar verificação de status
          startStatusChecking(data.instance.id);
        }, 3000);
      } else {
        throw new Error(data.error || 'Erro ao criar instância');
      }
    } catch (error: any) {
      console.error('Erro ao criar instância:', error);
      toast({
        title: "Erro ao criar instância",
        description: error.message || "Não foi possível criar a instância.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getQRCode = async (instanceId: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('evolution-api', {
        body: {
          action: 'get-qr',
          instance_id: instanceId
        }
      });

      if (error) throw error;

      if (data.success && data.qr_code) {
        setQrCode(data.qr_code);
        const instance = instances.find(i => i.id === instanceId);
        setQrInstanceName(instance?.instance_name || '');
        toast({
          title: "QR Code gerado",
          description: "Escaneie o QR Code para conectar seu WhatsApp.",
        });
      }
    } catch (error: any) {
      console.error('Erro ao buscar QR Code:', error);
      toast({
        title: "Erro ao gerar QR Code",
        description: "Não foi possível gerar o QR Code.",
        variant: "destructive"
      });
    }
  };

  const deleteInstance = async (instanceId: string) => {
    try {
      setIsLoading(true);

      // Parar verificação de status se estiver rodando
      if (statusCheckInterval) {
        clearInterval(statusCheckInterval);
        setStatusCheckInterval(null);
      }

      const { data, error } = await supabase.functions.invoke('evolution-api', {
        body: {
          action: 'delete-instance',
          instance_id: instanceId
        }
      });

      if (error) throw error;

      toast({
        title: "Instância excluída",
        description: "A instância foi removida com sucesso.",
      });
      
      await loadData();
      
      // Chamar callback se fornecido
      if (onInstanceUpdate) {
        onInstanceUpdate();
      }
      
      // Limpar QR Code se for da instância deletada
      setQrCode(null);
      setQrInstanceName('');
    } catch (error: any) {
      console.error('Erro ao excluir instância:', error);
      toast({
        title: "Erro ao excluir",
        description: "Não foi possível excluir a instância.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const refreshInstance = async (instanceId: string) => {
    try {
      setIsLoading(true);

      const { data, error } = await supabase.functions.invoke('evolution-api', {
        body: {
          action: 'check-status',
          instance_id: instanceId
        }
      });

      if (error) throw error;

      toast({
        title: "Status atualizado",
        description: "O status da instância foi verificado.",
      });
      
      await loadData();
      
      // Chamar callback se fornecido
      if (onInstanceUpdate) {
        onInstanceUpdate();
      }
    } catch (error: any) {
      console.error('Erro ao atualizar status:', error);
      toast({
        title: "Erro ao atualizar",
        description: "Não foi possível verificar o status.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const maxInstances = getMaxInstances();

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl bg-card border-border max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2 text-xl text-foreground">
            <MessageSquare className="h-6 w-6 text-green-600" />
            <span>Configurar WhatsApp</span>
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          <CreateInstanceForm
            onCreateInstance={createInstance}
            isLoading={isLoading}
            canCreateInstance={canCreateInstance()}
            currentInstanceCount={instances.length}
            maxInstances={maxInstances}
          />

          <QRCodeDisplay qrCode={qrCode} instanceName={qrInstanceName} />

          {instances.length > 0 && (
            <div>
              <h3 className="text-lg font-medium text-foreground mb-4">
                Suas Instâncias
              </h3>
              <InstanceList
                instances={instances}
                onDelete={deleteInstance}
                onRefresh={refreshInstance}
                isLoading={isLoading}
              />
            </div>
          )}
          
          <div className="flex justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="border-border text-muted-foreground hover:text-foreground hover:bg-accent"
            >
              Fechar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EvolutionInstanceModal;
