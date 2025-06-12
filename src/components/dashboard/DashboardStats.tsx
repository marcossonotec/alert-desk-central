
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Server, Activity, AlertTriangle, TrendingUp } from 'lucide-react';

interface DashboardStatsProps {
  servers: any[];
  metrics: any[];
  alerts: any[];
  getLatestMetricForServer: (serverId: string) => any;
}

const DashboardStats: React.FC<DashboardStatsProps> = ({
  servers,
  metrics,
  alerts,
  getLatestMetricForServer,
}) => {
  const getServerStats = () => {
    const total = servers.length;
    const online = servers.filter(s => s.status === 'ativo').length;
    const alerts_count = alerts.length;
    return { total, online, alerts_count };
  };

  const getAverageMetrics = () => {
    if (metrics.length === 0) return { cpu: 0 };

    const latest = {};
    servers.forEach(server => {
      const metric = getLatestMetricForServer(server.id);
      if (metric) {
        latest[server.id] = metric;
      }
    });

    const values = Object.values(latest) as any[];
    if (values.length === 0) return { cpu: 0 };

    const cpu = values.reduce((sum, m) => sum + (m.cpu_usage || 0), 0) / values.length;
    return { cpu };
  };

  const stats = getServerStats();
  const avgMetrics = getAverageMetrics();

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <Card className="bg-card border-border">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Servidores</p>
              <p className="text-2xl font-bold text-foreground">{stats.total}</p>
            </div>
            <Server className="h-8 w-8 text-primary" />
          </div>
        </CardContent>
      </Card>

      <Card className="bg-card border-border">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Online</p>
              <p className="text-2xl font-bold text-green-600">{stats.online}</p>
            </div>
            <Activity className="h-8 w-8 text-green-600" />
          </div>
        </CardContent>
      </Card>

      <Card className="bg-card border-border">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Alertas</p>
              <p className="text-2xl font-bold text-orange-600">{stats.alerts_count}</p>
            </div>
            <AlertTriangle className="h-8 w-8 text-orange-600" />
          </div>
        </CardContent>
      </Card>

      <Card className="bg-card border-border">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">CPU Média</p>
              <p className="text-2xl font-bold text-blue-600">{avgMetrics.cpu.toFixed(1)}%</p>
            </div>
            <TrendingUp className="h-8 w-8 text-blue-600" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DashboardStats;
