
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
}

const EvolutionInstanceModal: React.FC<EvolutionInstanceModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [instances, setInstances] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [userPlan, setUserPlan] = useState<string>('free');
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [qrInstanceName, setQrInstanceName] = useState<string>('');
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen]);

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
          action: 'create',
          instanceName,
          userId: user?.id
        }
      });

      if (error) throw error;

      if (data.success) {
        setQrCode(data.qrCode);
        setQrInstanceName(instanceName);
        toast({
          title: "Instância criada",
          description: "Escaneie o QR Code para conectar seu WhatsApp.",
        });
        loadData();
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

  const deleteInstance = async (instanceId: string) => {
    try {
      setIsLoading(true);

      const instance = instances.find(i => i.id === instanceId);
      if (!instance) return;

      const { data, error } = await supabase.functions.invoke('evolution-api', {
        body: {
          action: 'delete',
          instanceName: instance.instance_name,
          userId: user?.id
        }
      });

      if (error) throw error;

      toast({
        title: "Instância excluída",
        description: "A instância foi removida com sucesso.",
      });
      
      loadData();
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

      const instance = instances.find(i => i.id === instanceId);
      if (!instance) return;

      const { data, error } = await supabase.functions.invoke('evolution-api', {
        body: {
          action: 'status',
          instanceName: instance.instance_name,
          userId: user?.id
        }
      });

      if (error) throw error;

      toast({
        title: "Status atualizado",
        description: "O status da instância foi verificado.",
      });
      
      loadData();
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
