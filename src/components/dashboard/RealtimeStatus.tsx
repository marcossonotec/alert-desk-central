import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Wifi, WifiOff, Activity, Clock } from 'lucide-react';

interface RealtimeStatusProps {
  isConnected: boolean;
  lastUpdate?: string;
  metricsCount: number;
  alertsCount: number;
}

const RealtimeStatus: React.FC<RealtimeStatusProps> = ({
  isConnected,
  lastUpdate,
  metricsCount,
  alertsCount
}) => {
  return (
    <Card className="bg-card border-border">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm font-medium">
          <Activity className="h-4 w-4" />
          Status Realtime
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Status de Conexão */}
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">Conexão:</span>
          <Badge 
            variant={isConnected ? "default" : "destructive"}
            className="text-xs flex items-center gap-1"
          >
            {isConnected ? (
              <>
                <Wifi className="h-3 w-3" />
                Conectado
              </>
            ) : (
              <>
                <WifiOff className="h-3 w-3" />
                Desconectado
              </>
            )}
          </Badge>
        </div>

        {/* Última Atualização */}
        {lastUpdate && (
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Última atualização:</span>
            <span className="text-xs font-mono flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {new Date(lastUpdate).toLocaleTimeString()}
            </span>
          </div>
        )}

        {/* Contadores */}
        <div className="grid grid-cols-2 gap-2 pt-2 border-t border-border">
          <div className="text-center">
            <div className="text-lg font-semibold text-foreground">{metricsCount}</div>
            <div className="text-xs text-muted-foreground">Métricas</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-semibold text-foreground">{alertsCount}</div>
            <div className="text-xs text-muted-foreground">Alertas</div>
          </div>
        </div>

        {/* Indicador Visual de Atividade */}
        <div className="flex items-center gap-2 pt-2 border-t border-border">
          <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
          <span className="text-xs text-muted-foreground">
            {isConnected ? 'Recebendo atualizações...' : 'Aguardando conexão...'}
          </span>
        </div>
      </CardContent>
    </Card>
  );
};

export default RealtimeStatus;