
import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MessageSquare, QrCode, Trash2, RefreshCw, Plus, CheckCircle, XCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface EvolutionInstanceModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const EvolutionInstanceModal: React.FC<EvolutionInstanceModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [instances, setInstances] = useState<any[]>([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedInstance, setSelectedInstance] = useState<any>(null);
  const [qrCode, setQrCode] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [formData, setFormData] = useState({
    instance_name: ''
  });
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen) {
      loadInstances();
      getCurrentUser();
    }
  }, [isOpen]);

  const getCurrentUser = async () => {
    const { data: { user: currentUser } } = await supabase.auth.getUser();
    setUser(currentUser);
  };

  const loadInstances = async () => {
    try {
      setIsLoading(true);
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      
      const { data, error } = await supabase
        .from('evolution_instances')
        .select('*')
        .eq('usuario_id', currentUser?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setInstances(data || []);
    } catch (error: any) {
      console.error('Erro ao carregar instâncias:', error);
      toast({
        title: "Erro ao carregar instâncias",
        description: "Não foi possível carregar as instâncias WhatsApp.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const createInstance = async () => {
    try {
      setIsLoading(true);
      
      const { data, error } = await supabase.functions.invoke('evolution-api', {
        body: {
          action: 'create-instance',
          usuario_id: user?.id,
          instance_name: formData.instance_name
        }
      });

      if (error) throw error;

      if (!data.success) {
        throw new Error(data.error || 'Erro ao criar instância');
      }

      toast({
        title: "Instância criada",
        description: "Instância WhatsApp criada com sucesso.",
      });

      setFormData({ instance_name: '' });
      setShowCreateForm(false);
      loadInstances();
    } catch (error: any) {
      console.error('Erro ao criar instância:', error);
      toast({
        title: "Erro ao criar instância",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getQRCode = async (instance: any) => {
    try {
      setIsLoading(true);
      setSelectedInstance(instance);
      
      const { data, error } = await supabase.functions.invoke('evolution-api', {
        body: {
          action: 'get-qr',
          instance_id: instance.id
        }
      });

      if (error) throw error;

      if (!data.success) {
        throw new Error(data.error || 'Erro ao buscar QR Code');
      }

      setQrCode(data.qr_code);
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

  const checkStatus = async (instanceId: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('evolution-api', {
        body: {
          action: 'check-status',
          instance_id: instanceId
        }
      });

      if (error) throw error;

      if (data.success) {
        loadInstances();
        toast({
          title: "Status atualizado",
          description: `Status: ${data.status}`,
        });
      }
    } catch (error: any) {
      console.error('Erro ao verificar status:', error);
    }
  };

  const deleteInstance = async (instanceId: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('evolution-api', {
        body: {
          action: 'delete-instance',
          instance_id: instanceId
        }
      });

      if (error) throw error;

      if (!data.success) {
        throw new Error(data.error || 'Erro ao deletar instância');
      }

      toast({
        title: "Instância removida",
        description: "Instância WhatsApp removida com sucesso.",
      });

      loadInstances();
    } catch (error: any) {
      console.error('Erro ao deletar instância:', error);
      toast({
        title: "Erro ao remover instância",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const getStatusColor = (status: string) => {
    const colors = {
      connected: 'bg-green-500',
      connecting: 'bg-yellow-500',
      disconnected: 'bg-gray-500',
      error: 'bg-red-500'
    };
    return colors[status as keyof typeof colors] || 'bg-gray-500';
  };

  const getStatusIcon = (status: string) => {
    return status === 'connected' ? CheckCircle : XCircle;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-card border-border max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2 text-xl text-foreground">
            <MessageSquare className="h-6 w-6 text-primary" />
            <span>Gerenciar WhatsApp (Evolution API)</span>
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Botão para criar nova instância */}
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium">Instâncias WhatsApp</h3>
            <Button
              onClick={() => setShowCreateForm(true)}
              className="bg-primary hover:bg-primary/90"
            >
              <Plus className="h-4 w-4 mr-2" />
              Nova Instância
            </Button>
          </div>

          {/* Formulário de criação */}
          {showCreateForm && (
            <Card className="bg-card/50 border-border">
              <CardHeader>
                <CardTitle>Criar Nova Instância</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Nome da Instância</Label>
                  <Input
                    value={formData.instance_name}
                    onChange={(e) => setFormData({ instance_name: e.target.value })}
                    placeholder="minha-instancia"
                    className="bg-background border-border"
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setShowCreateForm(false)}
                  >
                    Cancelar
                  </Button>
                  <Button
                    onClick={createInstance}
                    disabled={isLoading || !formData.instance_name}
                  >
                    {isLoading ? 'Criando...' : 'Criar'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Lista de instâncias */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {instances.map((instance) => {
              const StatusIcon = getStatusIcon(instance.status);
              return (
                <Card key={instance.id} className="bg-card/50 border-border">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{instance.instance_name}</CardTitle>
                      <div className="flex items-center space-x-2">
                        <Badge className={`${getStatusColor(instance.status)} text-white`}>
                          <StatusIcon className="h-3 w-3 mr-1" />
                          {instance.status}
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="text-sm text-muted-foreground">
                      <p><strong>Criado em:</strong> {new Date(instance.created_at).toLocaleDateString()}</p>
                    </div>
                    
                    <div className="flex gap-2 flex-wrap">
                      {instance.status !== 'connected' && (
                        <Button
                          size="sm"
                          onClick={() => getQRCode(instance)}
                          disabled={isLoading}
                        >
                          <QrCode className="h-4 w-4 mr-1" />
                          QR Code
                        </Button>
                      )}
                      
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => checkStatus(instance.id)}
                      >
                        <RefreshCw className="h-4 w-4 mr-1" />
                        Status
                      </Button>
                      
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => deleteInstance(instance.id)}
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        Remover
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {instances.length === 0 && !showCreateForm && (
            <div className="text-center py-8">
              <MessageSquare className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">
                Nenhuma instância WhatsApp
              </h3>
              <p className="text-muted-foreground mb-4">
                Crie sua primeira instância para receber alertas via WhatsApp.
              </p>
            </div>
          )}

          {/* Modal QR Code */}
          {selectedInstance && qrCode && (
            <Card className="bg-card/50 border-border">
              <CardHeader>
                <CardTitle>QR Code - {selectedInstance.instance_name}</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <div className="bg-white p-4 rounded-lg inline-block mb-4">
                  <img 
                    src={`data:image/png;base64,${qrCode}`} 
                    alt="QR Code"
                    className="max-w-64 max-h-64"
                  />
                </div>
                <p className="text-sm text-muted-foreground">
                  Escaneie este QR Code com o WhatsApp para conectar a instância.
                </p>
                <Button
                  className="mt-4"
                  onClick={() => {
                    setSelectedInstance(null);
                    setQrCode('');
                  }}
                >
                  Fechar
                </Button>
              </CardContent>
            </Card>
          )}
          
          <div className="flex justify-end">
            <Button variant="outline" onClick={onClose}>
              Fechar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EvolutionInstanceModal;
