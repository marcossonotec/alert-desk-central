
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { RefreshCw, AlertTriangle, CheckCircle, XCircle, Clock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface AlertsStatusData {
  total_alertas: number;
  alertas_ativos: number;
  alertas_inativos: number;
  notificacoes_hoje: number;
  notificacoes_sucesso: number;
  notificacoes_erro: number;
  ultima_execucao: string | null;
}

const AlertsStatus = () => {
  const [statusData, setStatusData] = useState<AlertsStatusData>({
    total_alertas: 0,
    alertas_ativos: 0,
    alertas_inativos: 0,
    notificacoes_hoje: 0,
    notificacoes_sucesso: 0,
    notificacoes_erro: 0,
    ultima_execucao: null
  });
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    loadAlertsStatus();
    
    // Atualizar a cada 30 segundos
    const interval = setInterval(loadAlertsStatus, 30000);
    return () => clearInterval(interval);
  }, [user]);

  const loadAlertsStatus = async () => {
    if (!user) return;

    try {
      setIsLoading(true);

      // Buscar total de alertas do usuário
      const { data: alertas, error: alertasError } = await supabase
        .from('alertas')
        .select('id, ativo')
        .eq('usuario_id', user.id);

      if (alertasError) throw alertasError;

      const totalAlertas = alertas?.length || 0;
      const alertasAtivos = alertas?.filter(a => a.ativo).length || 0;
      const alertasInativos = totalAlertas - alertasAtivos;

      // Buscar notificações de hoje
      const hoje = new Date();
      hoje.setHours(0, 0, 0, 0);
      
      const { data: notificacoes, error: notificacoesError } = await supabase
        .from('notificacoes')
        .select('status, data_envio')
        .gte('data_envio', hoje.toISOString())
        .in('canal', ['email', 'whatsapp']); // Excluir logs de sistema

      if (notificacoesError) throw notificacoesError;

      const notificacoesHoje = notificacoes?.length || 0;
      const notificacoesSucesso = notificacoes?.filter(n => n.status === 'enviado').length || 0;
      const notificacoesErro = notificacoes?.filter(n => n.status === 'erro_envio').length || 0;

      // Buscar última execução do sistema
      const { data: ultimaExecucao, error: execucaoError } = await supabase
        .from('notificacoes')
        .select('data_envio')
        .eq('destinatario', 'hetzner-monitor')
        .order('data_envio', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (execucaoError) console.error('Erro ao buscar última execução:', execucaoError);

      setStatusData({
        total_alertas: totalAlertas,
        alertas_ativos: alertasAtivos,
        alertas_inativos: alertasInativos,
        notificacoes_hoje: notificacoesHoje,
        notificacoes_sucesso: notificacoesSucesso,
        notificacoes_erro: notificacoesErro,
        ultima_execucao: ultimaExecucao?.data_envio || null
      });

    } catch (error) {
      console.error('Erro ao carregar status dos alertas:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const forcarExecucaoMonitor = async () => {
    try {
      console.log('Forçando execução do hetzner-monitor...');
      
      const { data, error } = await supabase.functions.invoke('hetzner-monitor', {
        body: {},
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (error) {
        console.error('Erro ao executar hetzner-monitor:', error);
        throw error;
      }

      console.log('Hetzner-monitor executado com sucesso:', data);
      
      // Recarregar status após alguns segundos
      setTimeout(loadAlertsStatus, 3000);
      
    } catch (error) {
      console.error('Erro ao forçar execução:', error);
    }
  };

  const formatarTempoUltimaExecucao = (dataIso: string | null) => {
    if (!dataIso) return 'Nunca executado';
    
    const agora = new Date();
    const execucao = new Date(dataIso);
    const diferencaMs = agora.getTime() - execucao.getTime();
    const diferencaMinutos = Math.floor(diferencaMs / (1000 * 60));
    
    if (diferencaMinutos < 1) return 'Há menos de 1 minuto';
    if (diferencaMinutos < 60) return `Há ${diferencaMinutos} minuto${diferencaMinutos !== 1 ? 's' : ''}`;
    
    const diferencaHoras = Math.floor(diferencaMinutos / 60);
    if (diferencaHoras < 24) return `Há ${diferencaHoras} hora${diferencaHoras !== 1 ? 's' : ''}`;
    
    const diferencaDias = Math.floor(diferencaHoras / 24);
    return `Há ${diferencaDias} dia${diferencaDias !== 1 ? 's' : ''}`;
  };

  if (isLoading) {
    return (
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Status do Sistema de Alertas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto mb-2"></div>
            <p className="text-muted-foreground text-sm">Carregando status...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Status do Sistema de Alertas
          </CardTitle>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={loadAlertsStatus}
              disabled={isLoading}
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={forcarExecucaoMonitor}
            >
              Forçar Execução
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        
        {/* Estatísticas de Alertas */}
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-foreground">{statusData.total_alertas}</div>
            <div className="text-sm text-muted-foreground">Total de Alertas</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{statusData.alertas_ativos}</div>
            <div className="text-sm text-muted-foreground">Ativos</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-500">{statusData.alertas_inativos}</div>
            <div className="text-sm text-muted-foreground">Inativos</div>
          </div>
        </div>

        {/* Estatísticas de Notificações (Hoje) */}
        <div className="border-t border-border pt-4">
          <h4 className="font-medium mb-3 flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Notificações Hoje
          </h4>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-xl font-bold text-foreground">{statusData.notificacoes_hoje}</div>
              <div className="text-xs text-muted-foreground">Total</div>
            </div>
            <div className="text-center">
              <div className="text-xl font-bold text-green-600">{statusData.notificacoes_sucesso}</div>
              <div className="text-xs text-muted-foreground">Enviadas</div>
            </div>
            <div className="text-center">
              <div className="text-xl font-bold text-red-600">{statusData.notificacoes_erro}</div>
              <div className="text-xs text-muted-foreground">Erros</div>
            </div>
          </div>
        </div>

        {/* Status da Última Execução */}
        <div className="border-t border-border pt-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Última Execução:</span>
            <div className="flex items-center gap-2">
              {statusData.ultima_execucao ? (
                <>
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span className="text-sm text-muted-foreground">
                    {formatarTempoUltimaExecucao(statusData.ultima_execucao)}
                  </span>
                </>
              ) : (
                <>
                  <XCircle className="h-4 w-4 text-red-500" />
                  <span className="text-sm text-muted-foreground">Nunca executado</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Taxa de Sucesso */}
        <div className="border-t border-border pt-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Taxa de Sucesso Hoje:</span>
            <Badge variant={
              statusData.notificacoes_hoje === 0 ? 'secondary' :
              statusData.notificacoes_sucesso / statusData.notificacoes_hoje >= 0.9 ? 'default' :
              statusData.notificacoes_sucesso / statusData.notificacoes_hoje >= 0.7 ? 'secondary' : 'destructive'
            }>
              {statusData.notificacoes_hoje === 0 ? 'N/A' : 
               `${Math.round((statusData.notificacoes_sucesso / statusData.notificacoes_hoje) * 100)}%`}
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default AlertsStatus;
