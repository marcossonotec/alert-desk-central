
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
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertTriangle, Cpu, HardDrive, MemoryStick, Mail, MessageSquare } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface AlertConfigModalProps {
  server: {
    id: string;
    name: string;
  };
  isOpen: boolean;
  onClose: () => void;
  onUpdate: () => void;
}

const AlertConfigModal: React.FC<AlertConfigModalProps> = ({
  server,
  isOpen,
  onClose,
  onUpdate,
}) => {
  const [alerts, setAlerts] = useState<any[]>([]);
  const [evolutionInstances, setEvolutionInstances] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [user, setUser] = useState<any>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen && server?.id) {
      loadData();
    }
  }, [isOpen, server?.id]);

  const loadData = async () => {
    if (!server?.id) return;
    
    try {
      setIsLoading(true);
      
      // Buscar usuário atual
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      setUser(currentUser);

      if (!currentUser) return;

      // Buscar alertas existentes
      const { data: alertsData, error: alertsError } = await supabase
        .from('alertas')
        .select('*')
        .eq('servidor_id', server.id);

      if (alertsError) throw alertsError;

      // Buscar instâncias Evolution API
      const { data: instancesData, error: instancesError } = await supabase
        .from('evolution_instances')
        .select('*')
        .eq('usuario_id', currentUser.id);

      if (instancesError) throw instancesError;

      setAlerts(alertsData || []);
      setEvolutionInstances(instancesData || []);

      // Se não há alertas, criar os padrões
      if (!alertsData || alertsData.length === 0) {
        await createDefaultAlerts(currentUser.id);
      }
    } catch (error: any) {
      console.error('Erro ao carregar dados:', error);
      toast({
        title: "Erro ao carregar dados",
        description: "Não foi possível carregar as configurações de alertas.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const createDefaultAlerts = async (userId: string) => {
    try {
      const defaultAlerts = [
        { tipo_alerta: 'cpu', limite_valor: 80 },
        { tipo_alerta: 'memoria', limite_valor: 85 },
        { tipo_alerta: 'disco', limite_valor: 90 }
      ];

      const alertsToInsert = defaultAlerts.map(alert => ({
        ...alert,
        servidor_id: server.id,
        usuario_id: userId,
        canal_notificacao: ['email'],
        ativo: true
      }));

      const { error } = await supabase
        .from('alertas')
        .insert(alertsToInsert);

      if (error) throw error;

      // Recarregar dados
      loadData();
    } catch (error: any) {
      console.error('Erro ao criar alertas padrão:', error);
    }
  };

  const updateAlert = async (alertId: string, updates: any) => {
    try {
      const { error } = await supabase
        .from('alertas')
        .update(updates)
        .eq('id', alertId);

      if (error) throw error;

      toast({
        title: "Alerta atualizado",
        description: "Configuração salva com sucesso.",
      });
      
      // Atualizar estado local sem recarregar tudo
      setAlerts(prev => prev.map(alert => 
        alert.id === alertId ? { ...alert, ...updates } : alert
      ));
    } catch (error: any) {
      console.error('Erro ao atualizar alerta:', error);
      toast({
        title: "Erro ao atualizar",
        description: "Não foi possível salvar a configuração.",
        variant: "destructive"
      });
    }
  };

  const getAlertIcon = (tipo: string) => {
    const icons = {
      cpu: Cpu,
      memoria: MemoryStick,
      disco: HardDrive
    };
    const Icon = icons[tipo as keyof typeof icons] || AlertTriangle;
    return <Icon className="h-5 w-5" />;
  };

  const getAlertColor = (tipo: string) => {
    const colors = {
      cpu: 'text-red-500',
      memoria: 'text-orange-500',
      disco: 'text-yellow-500'
    };
    return colors[tipo as keyof typeof colors] || 'text-gray-500';
  };

  if (!server?.id) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-card border-border max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2 text-xl text-foreground">
            <AlertTriangle className="h-6 w-6 text-primary" />
            <span>Configurar Alertas - {server.name}</span>
          </DialogTitle>
        </DialogHeader>
        
        {isLoading ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">Carregando configurações...</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Configuração de Alertas */}
            <Card className="bg-card/50 border-border">
              <CardHeader>
                <CardTitle className="text-lg flex items-center space-x-2">
                  <AlertTriangle className="h-5 w-5 text-primary" />
                  <span>Limites de Alerta</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {alerts.map((alert) => (
                  <div key={alert.id} className="border border-border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-2">
                        <div className={getAlertColor(alert.tipo_alerta)}>
                          {getAlertIcon(alert.tipo_alerta)}
                        </div>
                        <span className="font-medium capitalize">{alert.tipo_alerta}</span>
                      </div>
                      <Switch
                        checked={alert.ativo}
                        onCheckedChange={(checked) => 
                          updateAlert(alert.id, { ativo: checked })
                        }
                      />
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Limite (%)</Label>
                        <Input
                          type="number"
                          min="1"
                          max="100"
                          value={alert.limite_valor}
                          onChange={(e) => 
                            updateAlert(alert.id, { limite_valor: parseInt(e.target.value) })
                          }
                          className="bg-background border-border"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label>Instância WhatsApp</Label>
                        <Select
                          value={alert.evolution_instance_id || ''}
                          onValueChange={(value) => 
                            updateAlert(alert.id, { 
                              evolution_instance_id: value || null,
                              canal_notificacao: value ? ['email', 'whatsapp'] : ['email']
                            })
                          }
                        >
                          <SelectTrigger className="bg-background border-border">
                            <SelectValue placeholder="Selecionar instância..." />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="">Apenas Email</SelectItem>
                            {evolutionInstances
                              .filter(instance => instance.status === 'connected')
                              .map((instance) => (
                                <SelectItem key={instance.id} value={instance.id}>
                                  {instance.instance_name}
                                </SelectItem>
                              ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    
                    <div className="mt-4 flex items-center space-x-4 text-sm text-muted-foreground">
                      <div className="flex items-center space-x-1">
                        <Mail className="h-4 w-4" />
                        <span>Email</span>
                      </div>
                      {alert.evolution_instance_id && (
                        <div className="flex items-center space-x-1">
                          <MessageSquare className="h-4 w-4" />
                          <span>WhatsApp</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Instâncias WhatsApp */}
            {evolutionInstances.length === 0 && (
              <Card className="bg-yellow-50 border-yellow-200">
                <CardContent className="p-6">
                  <div className="text-center">
                    <MessageSquare className="h-12 w-12 text-yellow-600 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-yellow-800 mb-2">
                      Nenhuma instância WhatsApp configurada
                    </h3>
                    <p className="text-yellow-700 mb-4">
                      Configure uma instância WhatsApp para receber alertas via WhatsApp.
                    </p>
                    <Button
                      onClick={() => {
                        onClose();
                        // Aqui você pode abrir o modal de configuração do WhatsApp
                      }}
                      className="bg-yellow-600 hover:bg-yellow-700 text-white"
                    >
                      Configurar WhatsApp
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
            
            <div className="flex justify-end gap-3">
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
        )}
      </DialogContent>
    </Dialog>
  );
};

export default AlertConfigModal;
