
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { AlertTriangle } from 'lucide-react';

interface ActiveAlertsProps {
  alerts: any[];
}

const ActiveAlerts: React.FC<ActiveAlertsProps> = ({ alerts }) => {
  if (alerts.length === 0) return null;

  return (
    <div>
      <h2 className="text-xl font-bold text-foreground mb-4">Alertas Ativos</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {alerts.slice(0, 6).map((alert) => (
          <Card key={alert.id} className="bg-yellow-50 border-yellow-200">
            <CardContent className="p-4">
              <div className="flex items-center space-x-2 mb-2">
                <AlertTriangle className="h-4 w-4 text-yellow-600" />
                <span className="font-medium text-yellow-800 capitalize">
                  {alert.tipo_alerta}
                </span>
              </div>
              <p className="text-sm text-yellow-700 mb-2">
                {alert.servidores?.nome} - Limite: {alert.limite_valor}%
              </p>
              <div className="text-xs text-yellow-600">
                Canais: {alert.canal_notificacao?.join(', ')}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default ActiveAlerts;
