import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface MetricData {
  id: string;
  servidor_id: string;
  cpu_usage: number | null;
  memoria_usage: number | null;
  disco_usage: number | null;
  rede_in: number | null;
  rede_out: number | null;
  uptime: string | null;
  timestamp: string;
}

interface AlertData {
  id: string;
  servidor_id: string | null;
  tipo_alerta: string;
  limite_valor: number;
  usuario_id: string;
  ativo: boolean;
}

interface NotificationData {
  id: string;
  alerta_id: string;
  servidor_id: string;
  canal: string;
  destinatario: string;
  mensagem: string;
  status: string;
  data_envio: string;
}

export const useRealtimeMetrics = () => {
  const [metrics, setMetrics] = useState<MetricData[]>([]);
  const [alerts, setAlerts] = useState<AlertData[]>([]);
  const [notifications, setNotifications] = useState<NotificationData[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    console.log('🔄 Iniciando subscriptions realtime...');

    // Channel para métricas
    const metricsChannel = supabase
      .channel('metrics-realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'metricas'
        },
        (payload) => {
          console.log('📊 Nova métrica recebida:', payload.new);
          setMetrics(prev => [payload.new as MetricData, ...prev.slice(0, 49)]); // Manter últimas 50
        }
      )
      .subscribe((status) => {
        console.log('📊 Status subscription métricas:', status);
        if (status === 'SUBSCRIBED') {
          setIsConnected(true);
          toast({
            title: "🔄 Realtime Ativado",
            description: "Métricas sendo atualizadas em tempo real",
            duration: 3000,
          });
        }
      });

    // Channel para alertas
    const alertsChannel = supabase
      .channel('alerts-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'alertas'
        },
        (payload) => {
          console.log('🚨 Mudança em alerta:', payload);
          
          if (payload.eventType === 'INSERT') {
            setAlerts(prev => [payload.new as AlertData, ...prev]);
          } else if (payload.eventType === 'UPDATE') {
            setAlerts(prev => prev.map(alert => 
              alert.id === payload.new.id ? payload.new as AlertData : alert
            ));
          } else if (payload.eventType === 'DELETE') {
            setAlerts(prev => prev.filter(alert => alert.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    // Channel para notificações
    const notificationsChannel = supabase
      .channel('notifications-realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notificacoes'
        },
        (payload) => {
          console.log('📩 Nova notificação:', payload.new);
          const notification = payload.new as NotificationData;
          
          setNotifications(prev => [notification, ...prev.slice(0, 19)]); // Manter últimas 20

          // Toast para notificações críticas
          if (notification.status === 'enviado') {
            toast({
              title: "🚨 Alerta Disparado",
              description: notification.mensagem,
              variant: "destructive",
              duration: 5000,
            });
          }
        }
      )
      .subscribe();

    // Cleanup
    return () => {
      console.log('🔄 Removendo subscriptions realtime...');
      supabase.removeChannel(metricsChannel);
      supabase.removeChannel(alertsChannel);
      supabase.removeChannel(notificationsChannel);
      setIsConnected(false);
    };
  }, [toast]);

  // Função para buscar dados iniciais
  const loadInitialData = async () => {
    try {
      // Buscar métricas recentes
      const { data: metricsData } = await supabase
        .from('metricas')
        .select('*')
        .order('timestamp', { ascending: false })
        .limit(50);

      if (metricsData) {
        setMetrics(metricsData);
      }

      // Buscar alertas ativos
      const { data: alertsData } = await supabase
        .from('alertas')
        .select('*')
        .eq('ativo', true)
        .order('data_criacao', { ascending: false });

      if (alertsData) {
        setAlerts(alertsData);
      }

      // Buscar notificações recentes
      const { data: notificationsData } = await supabase
        .from('notificacoes')
        .select('*')
        .order('data_envio', { ascending: false })
        .limit(20);

      if (notificationsData) {
        setNotifications(notificationsData);
      }

    } catch (error) {
      console.error('❌ Erro ao carregar dados iniciais:', error);
      toast({
        title: "❌ Erro",
        description: "Erro ao carregar dados iniciais",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    loadInitialData();
  }, []);

  return {
    metrics,
    alerts,
    notifications,
    isConnected,
    refreshData: loadInitialData
  };
};