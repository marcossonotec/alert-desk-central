
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
import { AlertTriangle, Cpu, HardDrive, MemoryStick } from 'lucide-react';
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

      setAlerts(alertsData || []);

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

  const getAlertName = (tipo: string) => {
    const names = {
      cpu: 'CPU',
      memoria: 'Memória',
      disco: 'Disco'
    };
    return names[tipo as keyof typeof names] || tipo;
  };

  if (!server?.id) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-card border-border max-w-2xl max-h-[90vh] overflow-y-auto">
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
            <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <h4 className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-2">
                💡 Como funciona
              </h4>
              <p className="text-sm text-blue-700 dark:text-blue-300">
                Configure os limites de alerta para cada métrica. Quando os valores ultrapassarem os limites definidos, 
                você receberá notificações no email cadastrado e no WhatsApp configurado no seu perfil.
              </p>
            </div>

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
                        <span className="font-medium">{getAlertName(alert.tipo_alerta)}</span>
                      </div>
                      <Switch
                        checked={alert.ativo}
                        onCheckedChange={(checked) => 
                          updateAlert(alert.id, { ativo: checked })
                        }
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Limite de Alerta (%)</Label>
                      <Input
                        type="number"
                        min="1"
                        max="100"
                        value={alert.limite_valor}
                        onChange={(e) => 
                          updateAlert(alert.id, { limite_valor: parseInt(e.target.value) })
                        }
                        className="bg-background border-border"
                        placeholder="Ex: 80"
                      />
                      <p className="text-xs text-muted-foreground">
                        Alerta será enviado quando {getAlertName(alert.tipo_alerta).toLowerCase()} ultrapassar este valor
                      </p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <div className="bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
              <h4 className="text-sm font-medium text-yellow-800 dark:text-yellow-200 mb-2">
                📧 Configuração de Contatos
              </h4>
              <p className="text-sm text-yellow-700 dark:text-yellow-300">
                Os alertas serão enviados para o email da sua conta e para o número de WhatsApp configurado no seu perfil. 
                Para receber alertas por WhatsApp, certifique-se de ter configurado uma instância.
              </p>
            </div>
            
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
