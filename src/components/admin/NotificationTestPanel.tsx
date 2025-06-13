
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { TestTube, Mail, MessageSquare, CheckCircle, XCircle, AlertTriangle, User, Settings } from 'lucide-react';

const NotificationTestPanel = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [testResults, setTestResults] = useState<any>(null);
  const [userConfig, setUserConfig] = useState<any>(null);
  const [testData, setTestData] = useState({
    tipo_alerta: 'cpu_usage',
    valor_atual: 85,
    limite: 80,
    servidor_nome: 'Servidor-Teste',
    ip_servidor: '192.168.1.100'
  });
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      loadUserConfig();
    }
  }, [user]);

  const loadUserConfig = async () => {
    if (!user) return;

    try {
      // Buscar perfil do usuário
      const { data: profile } = await supabase
        .from('profiles')
        .select('email, email_notificacoes, whatsapp')
        .eq('id', user.id)
        .single();

      // Buscar configurações de notificação
      const { data: notificationSettings } = await supabase
        .from('notification_settings')
        .select('email_provider, from_email, is_active')
        .eq('usuario_id', user.id)
        .single();

      // Buscar instância Evolution
      const { data: evolutionInstance } = await supabase
        .from('evolution_instances')
        .select('status')
        .eq('usuario_id', user.id)
        .eq('status', 'connected')
        .single();

      setUserConfig({
        profile,
        notificationSettings,
        hasEvolution: !!evolutionInstance
      });
    } catch (error) {
      console.error('Erro ao carregar configurações do usuário:', error);
    }
  };

  const getEmailToUse = () => {
    if (!userConfig?.profile) return 'N/A';
    return userConfig.profile.email_notificacoes || userConfig.profile.email;
  };

  const canSendWhatsApp = () => {
    return userConfig?.profile?.whatsapp && userConfig?.hasEvolution;
  };

  const handleTest = async () => {
    setIsLoading(true);
    setTestResults(null);
    
    try {
      console.log('Enviando teste de alerta:', testData);
      
      // Buscar token de sessão para enviar na requisição
      const { data: { session } } = await supabase.auth.getSession();
      
      const headers: any = {
        'Content-Type': 'application/json'
      };
      
      if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`;
      }
      
      // Enviar alerta de teste usando a função send-alerts com modo de teste
      const { data, error } = await supabase.functions.invoke('send-alerts', {
        body: {
          test_mode: true,
          tipo_alerta: testData.tipo_alerta,
          valor_atual: testData.valor_atual,
          limite: testData.limite,
          test_data: {
            servidor_nome: testData.servidor_nome,
            ip_servidor: testData.ip_servidor
          }
        }
      });

      if (error) {
        console.error('Erro no teste de alerta:', error);
        throw new Error(error.message || 'Erro desconhecido no teste de alerta');
      }

      console.log('Resposta do teste:', data);
      setTestResults(data);

      if (data.success) {
        toast({
          title: "Teste realizado!",
          description: data.message,
        });
      } else {
        toast({
          title: "Falha no teste",
          description: data.message || "Erro ao enviar notificações",
          variant: "destructive"
        });
      }
      
    } catch (error: any) {
      console.error('Erro no teste de alerta:', error);
      toast({
        title: "Erro no teste",
        description: error.message || "Não foi possível enviar o teste de alerta.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TestTube className="h-5 w-5" />
            Painel de Teste de Notificações
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Status das configurações do usuário */}
          {userConfig && (
            <Card className="bg-muted/50 border-border">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Suas Configurações Atuais
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Email para notificações:</span>
                      <Badge variant="outline">{getEmailToUse()}</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Configuração de email:</span>
                      <Badge variant={userConfig.notificationSettings?.is_active ? 'default' : 'secondary'}>
                        {userConfig.notificationSettings?.is_active ? 'Ativa' : 'Inativa'}
                      </Badge>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">WhatsApp configurado:</span>
                      <Badge variant={userConfig.profile?.whatsapp ? 'default' : 'secondary'}>
                        {userConfig.profile?.whatsapp ? 'Sim' : 'Não'}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Evolution conectada:</span>
                      <Badge variant={userConfig.hasEvolution ? 'default' : 'secondary'}>
                        {userConfig.hasEvolution ? 'Sim' : 'Não'}
                      </Badge>
                    </div>
                  </div>
                </div>
                {!userConfig.notificationSettings?.is_active && (
                  <div className="flex items-center gap-2 p-2 bg-yellow-50 dark:bg-yellow-950 rounded">
                    <AlertTriangle className="h-4 w-4 text-yellow-600" />
                    <span className="text-sm text-yellow-800 dark:text-yellow-200">
                      Configure suas preferências de email na aba "Configurações de Email"
                    </span>
                  </div>
                )}
                {!canSendWhatsApp() && (
                  <div className="flex items-center gap-2 p-2 bg-blue-50 dark:bg-blue-950 rounded">
                    <Settings className="h-4 w-4 text-blue-600" />
                    <span className="text-sm text-blue-800 dark:text-blue-200">
                      Configure WhatsApp e Evolution para receber notificações via WhatsApp
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Configurações do teste */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="tipo_alerta">Tipo de Alerta</Label>
              <Select
                value={testData.tipo_alerta}
                onValueChange={(value) => setTestData({ ...testData, tipo_alerta: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cpu_usage">Alto uso de CPU</SelectItem>
                  <SelectItem value="memoria_usage">Alto uso de memória</SelectItem>
                  <SelectItem value="disco_usage">Alto uso de disco</SelectItem>
                  <SelectItem value="response_time">Tempo de resposta alto</SelectItem>
                  <SelectItem value="status">Servidor offline</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="servidor_nome">Nome do Servidor</Label>
              <Input
                id="servidor_nome"
                value={testData.servidor_nome}
                onChange={(e) => setTestData({ ...testData, servidor_nome: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="valor_atual">Valor Atual</Label>
              <Input
                id="valor_atual"
                type="number"
                value={testData.valor_atual}
                onChange={(e) => setTestData({ ...testData, valor_atual: parseFloat(e.target.value) })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="limite">Limite</Label>
              <Input
                id="limite"
                type="number"
                value={testData.limite}
                onChange={(e) => setTestData({ ...testData, limite: parseFloat(e.target.value) })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ip_servidor">IP do Servidor</Label>
              <Input
                id="ip_servidor"
                value={testData.ip_servidor}
                onChange={(e) => setTestData({ ...testData, ip_servidor: e.target.value })}
              />
            </div>
          </div>

          {/* Botão de teste */}
          <Button 
            onClick={handleTest} 
            disabled={isLoading || !user} 
            className="w-full"
            size="lg"
          >
            {isLoading ? 'Testando...' : 'Testar Notificações'}
            <TestTube className="h-4 w-4 ml-2" />
          </Button>

          {/* Resultados do teste */}
          {testResults && (
            <Card className="bg-muted/50 border-border">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  {testResults.success ? (
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  ) : (
                    <XCircle className="h-5 w-5 text-red-500" />
                  )}
                  Resultados do Teste
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span>Status Geral:</span>
                  <Badge variant={testResults.success ? 'default' : 'destructive'}>
                    {testResults.success ? 'Sucesso' : 'Falha'}
                  </Badge>
                </div>

                <div className="space-y-2">
                  <p className="text-sm font-medium">Mensagem:</p>
                  <p className="text-sm text-muted-foreground">{testResults.message}</p>
                </div>

                <div className="space-y-2">
                  <p className="text-sm font-medium">Email enviado para:</p>
                  <p className="text-sm text-muted-foreground">{testResults.notification_email}</p>
                </div>

                {testResults.channels_attempted && (
                  <div className="space-y-3">
                    <p className="text-sm font-medium">Canais Testados:</p>
                    
                    {/* Email */}
                    <div className="flex items-center justify-between p-3 bg-background rounded border">
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4" />
                        <span className="text-sm">Email</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {testResults.channels_attempted.email?.attempted ? (
                          <>
                            {testResults.channels_attempted.email.sent ? (
                              <CheckCircle className="h-4 w-4 text-green-500" />
                            ) : (
                              <XCircle className="h-4 w-4 text-red-500" />
                            )}
                            <Badge variant={testResults.channels_attempted.email.sent ? 'default' : 'destructive'}>
                              {testResults.channels_attempted.email.sent ? 'Enviado' : 'Falha'}
                            </Badge>
                          </>
                        ) : (
                          <Badge variant="secondary">Não testado</Badge>
                        )}
                      </div>
                    </div>

                    {/* WhatsApp */}
                    <div className="flex items-center justify-between p-3 bg-background rounded border">
                      <div className="flex items-center gap-2">
                        <MessageSquare className="h-4 w-4" />
                        <span className="text-sm">WhatsApp</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {testResults.channels_attempted.whatsapp?.attempted ? (
                          <>
                            {testResults.channels_attempted.whatsapp.sent ? (
                              <CheckCircle className="h-4 w-4 text-green-500" />
                            ) : (
                              <XCircle className="h-4 w-4 text-red-500" />
                            )}
                            <Badge variant={testResults.channels_attempted.whatsapp.sent ? 'default' : 'destructive'}>
                              {testResults.channels_attempted.whatsapp.sent ? 'Enviado' : 'Falha'}
                            </Badge>
                          </>
                        ) : (
                          <Badge variant="secondary">Não configurado</Badge>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Erros */}
                {(testResults.channels_attempted?.email?.error || testResults.channels_attempted?.whatsapp?.error) && (
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-red-600">Erros encontrados:</p>
                    {testResults.channels_attempted.email?.error && (
                      <div className="p-2 bg-red-50 dark:bg-red-950 rounded text-sm">
                        <strong>Email:</strong> {testResults.channels_attempted.email.error}
                      </div>
                    )}
                    {testResults.channels_attempted.whatsapp?.error && (
                      <div className="p-2 bg-red-50 dark:bg-red-950 rounded text-sm">
                        <strong>WhatsApp:</strong> {testResults.channels_attempted.whatsapp.error}
                      </div>
                    )}
                  </div>
                )}

                {testResults.test_mode && (
                  <div className="flex items-center gap-2 p-2 bg-yellow-50 dark:bg-yellow-950 rounded">
                    <AlertTriangle className="h-4 w-4 text-yellow-600" />
                    <span className="text-sm text-yellow-800 dark:text-yellow-200">
                      Este foi um teste do sistema - as notificações foram enviadas mas não registradas no banco
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default NotificationTestPanel;
