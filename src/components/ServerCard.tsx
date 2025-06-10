
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Settings, Trash2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import ServerConfigModal from './ServerConfigModal';

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
    provedor?: string;
  };
  onRefresh: () => void;
}

const ServerCard: React.FC<ServerCardProps> = ({ server, onRefresh }) => {
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
  const { toast } = useToast();

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online':
        return 'bg-green-500';
      case 'warning':
        return 'bg-yellow-500';
      case 'offline':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
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

  const handleDeleteServer = async () => {
    try {
      const { error } = await supabase
        .from('servidores')
        .delete()
        .eq('id', server.id);

      if (error) throw error;

      toast({
        title: "Servidor removido",
        description: "O servidor foi removido com sucesso.",
      });
      onRefresh();
    } catch (error: any) {
      console.error('Erro ao deletar servidor:', error);
      toast({
        title: "Erro ao remover servidor",
        description: "Não foi possível remover o servidor.",
        variant: "destructive"
      });
    }
  };

  return (
    <>
      <Card className="bg-slate-800/50 border-slate-700 hover:bg-slate-800/70 transition-colors">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg text-white">{server.name}</CardTitle>
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsConfigModalOpen(true)}
                className="text-slate-400 hover:text-white"
              >
                <Settings className="h-4 w-4" />
              </Button>
              
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-red-400 hover:text-red-300"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent className="bg-slate-800 border-slate-700">
                  <AlertDialogHeader>
                    <AlertDialogTitle className="text-white">
                      Confirmar remoção
                    </AlertDialogTitle>
                    <AlertDialogDescription className="text-slate-300">
                      Tem certeza de que deseja remover o servidor "{server.name}"? 
                      Esta ação não pode ser desfeita.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel className="bg-slate-700 text-white border-slate-600">
                      Cancelar
                    </AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleDeleteServer}
                      className="bg-red-600 hover:bg-red-700"
                    >
                      Remover
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${getStatusColor(server.status)}`}></div>
            <Badge variant="outline" className="text-slate-300 border-slate-600">
              {getStatusText(server.status)}
            </Badge>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <div className="text-slate-300">
            <p className="text-sm">IP: {server.ip}</p>
            <p className="text-sm">Uptime: {server.uptime}</p>
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-slate-400">CPU</span>
              <span className="text-white">{server.cpu}%</span>
            </div>
            <div className="w-full bg-slate-700 rounded-full h-2">
              <div 
                className="bg-blue-500 h-2 rounded-full transition-all"
                style={{ width: `${server.cpu}%` }}
              ></div>
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-slate-400">Memória</span>
              <span className="text-white">{server.memory}%</span>
            </div>
            <div className="w-full bg-slate-700 rounded-full h-2">
              <div 
                className="bg-green-500 h-2 rounded-full transition-all"
                style={{ width: `${server.memory}%` }}
              ></div>
            </div>
          </div>
          
          <div className="text-xs text-slate-500 pt-2 border-t border-slate-700">
            Última atualização: {server.lastUpdate}
          </div>
        </CardContent>
      </Card>

      <ServerConfigModal
        server={server}
        isOpen={isConfigModalOpen}
        onClose={() => setIsConfigModalOpen(false)}
        onUpdate={onRefresh}
      />
    </>
  );
};

export default ServerCard;
