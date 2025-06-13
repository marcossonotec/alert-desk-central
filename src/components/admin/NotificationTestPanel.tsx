
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { TestTube, Mail, MessageSquare, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';

const NotificationTestPanel = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [testResults, setTestResults] = useState<any>(null);
  const [testData, setTestData] = useState({
    tipo_alerta: 'cpu_usage',
    valor_atual: 85,
    limite: 80,
    servidor_nome: 'Servidor-Teste',
    ip_servidor: '192.168.1.100',
    email_teste: '',
    whatsapp_teste: ''
  });
  const { toast } = useToast();

  const handleTest = async () => {
    setIsLoading(true);
    setTestResults(null);
    
    try {
      console.log('Enviando teste de alerta:', testData);
      
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

  const testEmailConnection = async () => {
    // Implementar teste específico de email
    toast({
      title: "Teste de email",
      description: "Esta funcionalidade será implementada em breve.",
    });
  };

  const testWhatsAppConnection = async () => {
    // Implementar teste específico de WhatsApp
    toast({
      title: "Teste de WhatsApp",
      description: "Esta funcionalidade será implementada em breve.",
    });
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

          {/* Botões de teste */}
          <div className="flex flex-wrap gap-3">
            <Button onClick={handleTest} disabled={isLoading} className="flex-1 min-w-[200px]">
              {isLoading ? 'Testando...' : 'Testar Notificações'}
            </Button>
            <Button variant="outline" onClick={testEmailConnection} disabled={isLoading}>
              <Mail className="h-4 w-4 mr-2" />
              Testar Email
            </Button>
            <Button variant="outline" onClick={testWhatsAppConnection} disabled={isLoading}>
              <MessageSquare className="h-4 w-4 mr-2" />
              Testar WhatsApp
            </Button>
          </div>

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
                      Este foi um teste - as notificações foram enviadas mas não registradas no banco
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
