
import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Cpu, MemoryStick, HardDrive } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface ActiveAlert {
  id: string;
  tipo_alerta: string;
  limite_valor: number;
  servidor_nome: string;
  servidor_id: string;
  valor_atual: number;
  canal_notificacao: string[];
  timestamp: string;
}

interface ActiveAlertsProps {
  servers: any[];
  onUpdate?: () => void;
}

const ActiveAlerts: React.FC<ActiveAlertsProps> = ({ servers, onUpdate }) => {
  const [activeAlerts, setActiveAlerts] = useState<ActiveAlert[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (servers.length > 0) {
      checkActiveAlerts();
      
      // Atualizar alertas a cada 30 segundos
      const interval = setInterval(checkActiveAlerts, 30000);
      return () => clearInterval(interval);
    }
  }, [servers]);

  const checkActiveAlerts = async () => {
    try {
      setIsLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Buscar alertas configurados
      const { data: alertasConfig, error: alertasError } = await supabase
        .from('alertas')
        .select(`
          *,
          servidores(nome)
        `)
        .eq('usuario_id', user.id)
        .eq('ativo', true);

      if (alertasError) throw alertasError;

      if (!alertasConfig || alertasConfig.length === 0) {
        setActiveAlerts([]);
        setIsLoading(false);
        return;
      }

      const alerts: ActiveAlert[] = [];

      // Para cada alerta configurado, verificar se está sendo violado
      for (const alerta of alertasConfig) {
        // Buscar a métrica mais recente do servidor
        const { data: metricas, error: metricasError } = await supabase
          .from('metricas')
          .select('*')
          .eq('servidor_id', alerta.servidor_id)
          .order('timestamp', { ascending: false })
          .limit(1);

        if (metricasError || !metricas || metricas.length === 0) continue;

        const metrica = metricas[0];
        let valorAtual = 0;
        let isViolated = false;

        // Verificar se o limite está sendo ultrapassado
        switch (alerta.tipo_alerta) {
          case 'cpu':
            valorAtual = metrica.cpu_usage;
            isViolated = valorAtual > alerta.limite_valor;
            break;
          case 'memoria':
            valorAtual = metrica.memoria_usage;
            isViolated = valorAtual > alerta.limite_valor;
            break;
          case 'disco':
            valorAtual = metrica.disco_usage;
            isViolated = valorAtual > alerta.limite_valor;
            break;
        }

        if (isViolated) {
          alerts.push({
            id: alerta.id,
            tipo_alerta: alerta.tipo_alerta,
            limite_valor: alerta.limite_valor,
            servidor_nome: alerta.servidores?.nome || 'Servidor desconhecido',
            servidor_id: alerta.servidor_id,
            valor_atual: valorAtual,
            canal_notificacao: alerta.canal_notificacao || ['email'],
            timestamp: metrica.timestamp
          });
        }
      }

      setActiveAlerts(alerts);
    } catch (error) {
      console.error('Erro ao verificar alertas ativos:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getAlertIcon = (tipo: string) => {
    const icons = {
      cpu: Cpu,
      memoria: MemoryStick,
      disco: HardDrive
    };
    const Icon = icons[tipo as keyof typeof icons] || AlertTriangle;
    return <Icon className="h-4 w-4" />;
  };

  const getAlertColor = (tipo: string) => {
    const colors = {
      cpu: 'text-red-500',
      memoria: 'text-orange-500',
      disco: 'text-yellow-600'
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

  const getAlertBgColor = (tipo: string) => {
    const colors = {
      cpu: 'bg-red-50 border-red-200 dark:bg-red-950 dark:border-red-800',
      memoria: 'bg-orange-50 border-orange-200 dark:bg-orange-950 dark:border-orange-800',
      disco: 'bg-yellow-50 border-yellow-200 dark:bg-yellow-950 dark:border-yellow-800'
    };
    return colors[tipo as keyof typeof colors] || 'bg-gray-50 border-gray-200';
  };

  if (isLoading) {
    return (
      <div>
        <h2 className="text-xl font-bold text-foreground mb-4">Alertas Ativos</h2>
        <div className="text-center py-4">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto mb-2"></div>
          <p className="text-muted-foreground text-sm">Verificando alertas...</p>
        </div>
      </div>
    );
  }

  if (activeAlerts.length === 0) {
    return (
      <div>
        <h2 className="text-xl font-bold text-foreground mb-4">Alertas Ativos</h2>
        <Card className="bg-card border-border">
          <CardContent className="py-8 text-center">
            <AlertTriangle className="h-8 w-8 text-green-500 mx-auto mb-2" />
            <p className="text-muted-foreground">Nenhum alerta ativo no momento</p>
            <p className="text-sm text-muted-foreground">Todos os servidores estão funcionando normalmente</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-foreground">Alertas Ativos</h2>
        <Badge variant="destructive" className="text-sm">
          {activeAlerts.length} alerta{activeAlerts.length !== 1 ? 's' : ''} ativo{activeAlerts.length !== 1 ? 's' : ''}
        </Badge>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {activeAlerts.slice(0, 6).map((alert) => (
          <Card key={alert.id} className={`${getAlertBgColor(alert.tipo_alerta)} border`}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-2">
                  <div className={getAlertColor(alert.tipo_alerta)}>
                    {getAlertIcon(alert.tipo_alerta)}
                  </div>
                  <span className="font-medium text-foreground">
                    {getAlertName(alert.tipo_alerta)}
                  </span>
                </div>
                <Badge variant="destructive" className="text-xs">
                  ATIVO
                </Badge>
              </div>
              
              <div className="space-y-2">
                <p className="text-sm text-foreground font-medium">
                  {alert.servidor_nome}
                </p>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Atual:</span>
                  <span className={`font-medium ${getAlertColor(alert.tipo_alerta)}`}>
                    {alert.valor_atual.toFixed(1)}%
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Limite:</span>
                  <span className="text-foreground">{alert.limite_valor}%</span>
                </div>
                <div className="text-xs text-muted-foreground mt-2">
                  Canais: {alert.canal_notificacao.join(', ')}
                </div>
                <div className="text-xs text-muted-foreground">
                  {new Date(alert.timestamp).toLocaleString('pt-BR')}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      
      {activeAlerts.length > 6 && (
        <div className="mt-4 text-center">
          <p className="text-sm text-muted-foreground">
            E mais {activeAlerts.length - 6} alerta{activeAlerts.length - 6 !== 1 ? 's' : ''} ativo{activeAlerts.length - 6 !== 1 ? 's' : ''}
          </p>
        </div>
      )}
    </div>
  );
};

export default ActiveAlerts;
