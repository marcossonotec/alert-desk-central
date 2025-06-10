
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Server, Settings, Activity, Clock, Cpu, HardDrive } from 'lucide-react';

interface ServerCardProps {
  server: {
    id: string;
    name: string;
    ip: string;
    status: 'online' | 'warning' | 'offline';
    uptime: string;
    cpu: number;
    memory: number;
    lastUpdate: string;
  };
}

const ServerCard: React.FC<ServerCardProps> = ({ server }) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online':
        return 'bg-green-500/20 text-green-400 border-green-500/50';
      case 'warning':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50';
      case 'offline':
        return 'bg-red-500/20 text-red-400 border-red-500/50';
      default:
        return 'bg-slate-500/20 text-slate-400 border-slate-500/50';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'online':
        return 'Online';
      case 'warning':
        return 'Alerta';
      case 'offline':
        return 'Offline';
      default:
        return 'Desconhecido';
    }
  };

  return (
    <Card className="bg-slate-800/50 border-slate-700 hover:bg-slate-800/70 transition-all duration-300">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Server className="h-5 w-5 text-blue-400" />
            <CardTitle className="text-white text-lg">{server.name}</CardTitle>
          </div>
          <Badge className={getStatusColor(server.status)}>
            {getStatusText(server.status)}
          </Badge>
        </div>
        <p className="text-slate-400 text-sm">{server.ip}</p>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Metrics */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Cpu className="h-4 w-4 text-blue-400" />
              <span className="text-slate-300 text-sm">CPU</span>
            </div>
            <span className="text-white font-medium">{server.cpu}%</span>
          </div>
          <Progress value={server.cpu} className="h-2" />
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <HardDrive className="h-4 w-4 text-purple-400" />
              <span className="text-slate-300 text-sm">Memória</span>
            </div>
            <span className="text-white font-medium">{server.memory}%</span>
          </div>
          <Progress value={server.memory} className="h-2" />
        </div>

        {/* Additional Info */}
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center space-x-2 text-slate-400">
            <Clock className="h-4 w-4" />
            <span>Uptime: {server.uptime}</span>
          </div>
        </div>

        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center space-x-2 text-slate-400">
            <Activity className="h-4 w-4" />
            <span>Atualizado: {server.lastUpdate}</span>
          </div>
        </div>

        {/* Actions */}
        <div className="pt-4 border-t border-slate-700">
          <Button
            variant="ghost"
            size="sm"
            className="w-full text-slate-400 hover:text-white hover:bg-slate-700"
          >
            <Settings className="h-4 w-4 mr-2" />
            Configurar
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default ServerCard;
