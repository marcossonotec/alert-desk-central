import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { 
  Activity, 
  AlertTriangle, 
  Info, 
  XCircle, 
  Wifi,
  Server,
  Zap,
  Clock 
} from 'lucide-react';

interface SystemLog {
  id: string;
  timestamp: string;
  level: string;
  service: string;
  message: string;
  metadata: any;
}

const SystemLogsViewer: React.FC = () => {
  const [logs, setLogs] = useState<SystemLog[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadInitialLogs();
    
    // Subscription realtime para novos logs
    const channel = supabase
      .channel('system-logs-realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'system_logs'
        },
        (payload) => {
          console.log('📝 Novo log do sistema:', payload.new);
          const newLog = payload.new as SystemLog;
          
          setLogs(prev => [newLog, ...prev.slice(0, 49)]); // Manter últimos 50
          
          // Toast para logs críticos
          if (newLog.level === 'error') {
            toast({
              title: "❌ Erro no Sistema",
              description: newLog.message,
              variant: "destructive",
              duration: 5000,
            });
          }
        }
      )
      .subscribe((status) => {
        console.log('📝 Status subscription logs:', status);
        setIsConnected(status === 'SUBSCRIBED');
      });

    return () => {
      supabase.removeChannel(channel);
      setIsConnected(false);
    };
  }, [toast]);

  const loadInitialLogs = async () => {
    try {
      const { data, error } = await supabase
        .from('system_logs')
        .select('*')
        .order('timestamp', { ascending: false })
        .limit(50);

      if (error) throw error;
      
      if (data) {
        setLogs(data);
      }
    } catch (error) {
      console.error('Erro ao carregar logs:', error);
      toast({
        title: "❌ Erro",
        description: "Erro ao carregar logs do sistema",
        variant: "destructive",
      });
    }
  };

  const getLogIcon = (level: string) => {
    switch (level) {
      case 'error':
        return <XCircle className="h-4 w-4 text-destructive" />;
      case 'warn':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'info':
        return <Info className="h-4 w-4 text-blue-500" />;
      default:
        return <Activity className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getServiceIcon = (service: string) => {
    switch (service) {
      case 'multi-provider-monitor':
        return <Server className="h-3 w-3" />;
      case 'alert-orchestrator':
        return <AlertTriangle className="h-3 w-3" />;
      case 'send-alerts':
        return <Zap className="h-3 w-3" />;
      default:
        return <Activity className="h-3 w-3" />;
    }
  };

  const getBadgeVariant = (level: string) => {
    switch (level) {
      case 'error':
        return 'destructive' as const;
      case 'warn':
        return 'secondary' as const;
      case 'info':
        return 'default' as const;
      default:
        return 'outline' as const;
    }
  };

  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5" />
          Logs do Sistema
          <Badge variant={isConnected ? "default" : "destructive"} className="ml-auto text-xs">
            {isConnected ? (
              <>
                <Wifi className="h-3 w-3 mr-1" />
                Realtime
              </>
            ) : (
              'Desconectado'
            )}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px] w-full">
          <div className="space-y-2">
            {logs.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Activity className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>Nenhum log encontrado</p>
              </div>
            ) : (
              logs.map((log) => (
                <div
                  key={log.id}
                  className="flex items-start gap-3 p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors"
                >
                  <div className="flex-shrink-0 mt-1">
                    {getLogIcon(log.level)}
                  </div>

                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant={getBadgeVariant(log.level)} className="text-xs">
                        {log.level.toUpperCase()}
                      </Badge>
                      
                      <Badge variant="outline" className="text-xs flex items-center gap-1">
                        {getServiceIcon(log.service)}
                        {log.service}
                      </Badge>
                      
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        {new Date(log.timestamp).toLocaleString()}
                      </div>
                    </div>

                    <p className="text-sm text-foreground font-medium">
                      {log.message}
                    </p>

                    {log.metadata && Object.keys(log.metadata).length > 0 && (
                      <details className="text-xs">
                        <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
                          Ver detalhes
                        </summary>
                        <pre className="mt-2 p-2 bg-muted rounded text-xs overflow-x-auto">
                          {JSON.stringify(log.metadata, null, 2)}
                        </pre>
                      </details>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

export default SystemLogsViewer;