
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search, AlertTriangle, Mail, MessageSquare } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const AlertsManagement = () => {
  const [alerts, setAlerts] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadAlertsData();
  }, []);

  const loadAlertsData = async () => {
    try {
      setIsLoading(true);
      
      // Carregar alertas
      const { data: alertsData, error: alertsError } = await supabase
        .from('alertas')
        .select(`
          *,
          profiles!inner(
            email,
            nome_completo
          ),
          servidores(
            nome,
            ip
          )
        `)
        .order('data_criacao', { ascending: false });

      if (alertsError) throw alertsError;

      // Carregar notificações
      const { data: notificationsData, error: notificationsError } = await supabase
        .from('notificacoes')
        .select(`
          *,
          alertas(
            tipo_alerta,
            limite_valor
          ),
          servidores(
            nome,
            ip
          )
        `)
        .order('data_envio', { ascending: false })
        .limit(100);

      if (notificationsError) throw notificationsError;

      setAlerts(alertsData || []);
      setNotifications(notificationsData || []);
    } catch (error: any) {
      console.error('Erro ao carregar dados de alertas:', error);
      toast({
        title: "Erro ao carregar alertas",
        description: "Não foi possível carregar os dados de alertas.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const filteredAlerts = alerts.filter(alert =>
    alert.tipo_alerta?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    alert.profiles?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    alert.servidores?.nome?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getAlertTypeColor = (tipo: string) => {
    const colors = {
      cpu: 'bg-red-500',
      memoria: 'bg-orange-500',
      disco: 'bg-yellow-500',
      offline: 'bg-gray-500'
    };
    return colors[tipo as keyof typeof colors] || 'bg-blue-500';
  };

  const getChannelIcon = (canal: string) => {
    return canal === 'email' ? Mail : MessageSquare;
  };

  return (
    <div className="space-y-6">
      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-card border-border">
          <CardContent className="p-6">
            <div className="text-center">
              <p className="text-2xl font-bold">{alerts.length}</p>
              <p className="text-muted-foreground text-sm">Alertas Configurados</p>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-card border-border">
          <CardContent className="p-6">
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">
                {alerts.filter(a => a.ativo).length}
              </p>
              <p className="text-muted-foreground text-sm">Alertas Ativos</p>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-card border-border">
          <CardContent className="p-6">
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-600">{notifications.length}</p>
              <p className="text-muted-foreground text-sm">Notificações Enviadas</p>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-card border-border">
          <CardContent className="p-6">
            <div className="text-center">
              <p className="text-2xl font-bold text-yellow-600">
                {notifications.filter(n => 
                  new Date(n.data_envio) > new Date(Date.now() - 24 * 60 * 60 * 1000)
                ).length}
              </p>
              <p className="text-muted-foreground text-sm">Últimas 24h</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros e busca */}
      <Card className="bg-card border-border">
        <CardContent className="p-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Buscar por tipo de alerta, usuário ou servidor..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-background border-border"
            />
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Alertas Configurados */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Alertas Configurados
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">Carregando alertas...</p>
              </div>
            ) : (
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {filteredAlerts.map((alert) => (
                  <div key={alert.id} className="border border-border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <Badge className={`${getAlertTypeColor(alert.tipo_alerta)} text-white`}>
                        {alert.tipo_alerta.toUpperCase()}
                      </Badge>
                      <Badge variant={alert.ativo ? 'default' : 'secondary'}>
                        {alert.ativo ? 'Ativo' : 'Inativo'}
                      </Badge>
                    </div>
                    
                    <div className="text-sm space-y-1">
                      <p><strong>Usuário:</strong> {alert.profiles?.nome_completo || alert.profiles?.email}</p>
                      <p><strong>Servidor:</strong> {alert.servidores?.nome || 'Todos'}</p>
                      <p><strong>Limite:</strong> {alert.limite_valor}%</p>
                      <p><strong>Canais:</strong> {alert.canal_notificacao?.join(', ')}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Notificações Recentes */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Notificações Recentes
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">Carregando notificações...</p>
              </div>
            ) : (
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {notifications.slice(0, 20).map((notification) => {
                  const ChannelIcon = getChannelIcon(notification.canal);
                  return (
                    <div key={notification.id} className="border border-border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <ChannelIcon className="h-4 w-4 text-muted-foreground" />
                          <Badge className="bg-blue-600 text-white">
                            {notification.alertas?.tipo_alerta}
                          </Badge>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {new Date(notification.data_envio).toLocaleString()}
                        </span>
                      </div>
                      
                      <div className="text-sm space-y-1">
                        <p><strong>Servidor:</strong> {notification.servidores?.nome}</p>
                        <p><strong>Destinatário:</strong> {notification.destinatario}</p>
                        <p><strong>Status:</strong> {notification.status}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AlertsManagement;
