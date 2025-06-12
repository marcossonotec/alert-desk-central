
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  MoreHorizontal, 
  Settings, 
  Trash2, 
  Activity,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Database,
  Globe,
  Server,
  Container
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface ApplicationCardProps {
  application: any;
  applicationMetrics: any[];
  onUpdate: () => void;
  onConfigure: (app: any) => void;
}

const ApplicationCard: React.FC<ApplicationCardProps> = ({
  application,
  applicationMetrics,
  onUpdate,
  onConfigure,
}) => {
  const [isDeleting, setIsDeleting] = useState(false);
  const { toast } = useToast();

  const getTypeIcon = (type: string) => {
    const icons = {
      nodejs: Server,
      wordpress: Globe,
      php: Server,
      docker: Container,
      database: Database
    };
    const Icon = icons[type as keyof typeof icons] || Server;
    return <Icon className="h-5 w-5" />;
  };

  const getTypeColor = (type: string) => {
    const colors = {
      nodejs: 'text-green-500',
      wordpress: 'text-blue-500',
      php: 'text-purple-500',
      docker: 'text-cyan-500',
      database: 'text-orange-500'
    };
    return colors[type as keyof typeof colors] || 'text-gray-500';
  };

  const getStatusColor = (status: string) => {
    const colors = {
      ativo: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
      inativo: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
      erro: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
  };

  const getLatestMetrics = () => {
    const latest = applicationMetrics
      .filter(m => m.aplicacao_id === application.id)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0];
    
    return latest;
  };

  const handleDelete = async () => {
    if (!confirm('Tem certeza que deseja excluir esta aplicação? Esta ação não pode ser desfeita.')) {
      return;
    }

    try {
      setIsDeleting(true);

      // Deletar assinatura da aplicação
      const { error: subscriptionError } = await supabase
        .from('assinatura_aplicacoes')
        .delete()
        .eq('aplicacao_id', application.id);

      if (subscriptionError) throw subscriptionError;

      // Deletar aplicação (métricas serão deletadas em cascata)
      const { error: appError } = await supabase
        .from('aplicacoes')
        .delete()
        .eq('id', application.id);

      if (appError) throw appError;

      toast({
        title: "Aplicação removida",
        description: "A aplicação foi removida com sucesso.",
      });

      onUpdate();
    } catch (error: any) {
      console.error('Erro ao deletar aplicação:', error);
      toast({
        title: "Erro ao remover aplicação",
        description: error.message || "Não foi possível remover a aplicação.",
        variant: "destructive"
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const latestMetrics = getLatestMetrics();
  const isOnline = latestMetrics && 
    new Date().getTime() - new Date(latestMetrics.timestamp).getTime() < 300000; // 5 minutos

  return (
    <Card className="bg-card border-border hover:shadow-lg transition-shadow">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div className="flex items-center space-x-3">
          <div className={getTypeColor(application.tipos_aplicacao?.nome || 'unknown')}>
            {getTypeIcon(application.tipos_aplicacao?.nome || 'unknown')}
          </div>
          <div>
            <CardTitle className="text-lg">{application.nome}</CardTitle>
            <p className="text-sm text-muted-foreground">
              {application.tipos_aplicacao?.descricao}
            </p>
          </div>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onConfigure(application)}>
              <Settings className="mr-2 h-4 w-4" />
              Configurar
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={handleDelete}
              disabled={isDeleting}
              className="text-red-600 focus:text-red-600"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Remover
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Status e Informações */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {isOnline ? (
              <CheckCircle className="h-4 w-4 text-green-500" />
            ) : (
              <XCircle className="h-4 w-4 text-red-500" />
            )}
            <Badge className={getStatusColor(application.status)}>
              {isOnline ? 'Online' : 'Offline'}
            </Badge>
          </div>
          <Badge variant="outline">
            R$ {application.tipos_aplicacao?.preco_mensal}/mês
          </Badge>
        </div>

        {/* Informações da Aplicação */}
        <div className="grid grid-cols-2 gap-2 text-sm">
          {application.porta && (
            <div>
              <span className="text-muted-foreground">Porta:</span>
              <span className="ml-1 font-mono">{application.porta}</span>
            </div>
          )}
          {application.caminho && (
            <div>
              <span className="text-muted-foreground">Caminho:</span>
              <span className="ml-1 font-mono text-xs">{application.caminho}</span>
            </div>
          )}
        </div>

        {/* Métricas Rápidas */}
        {latestMetrics && (
          <div className="pt-2 border-t border-border">
            <div className="flex items-center space-x-2 mb-2">
              <Activity className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">Última verificação</span>
            </div>
            <p className="text-xs text-muted-foreground">
              {new Date(latestMetrics.timestamp).toLocaleString('pt-BR')}
            </p>
          </div>
        )}

        {/* Descrição */}
        {application.descricao && (
          <p className="text-sm text-muted-foreground">
            {application.descricao}
          </p>
        )}
      </CardContent>
    </Card>
  );
};

export default ApplicationCard;
