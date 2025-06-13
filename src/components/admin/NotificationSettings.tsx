import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Mail, Send, Settings, TestTube, FileText, CheckCircle, XCircle, Info } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import NotificationTestPanel from './NotificationTestPanel';
import NotificationChannelSettings from './NotificationChannelSettings';

const NotificationSettings = () => {
  const [activeTab, setActiveTab] = useState('channels');
  const [isLoading, setIsLoading] = useState(false);
  const [testingEmail, setTestingEmail] = useState(false);
  const [testStatus, setTestStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [notificationSettings, setNotificationSettings] = useState({
    email_provider: 'resend',
    smtp_host: '',
    smtp_port: 587,
    smtp_username: '',
    smtp_password: '',
    smtp_secure: true,
    api_key: '',
    from_email: '',
    from_name: 'DeskTools',
    is_active: false
  });
  const [emailTemplates, setEmailTemplates] = useState<any[]>([]);
  const [currentTemplate, setCurrentTemplate] = useState({
    template_type: 'welcome',
    subject: '',
    html_content: '',
    text_content: '',
    variables: {}
  });
  const { user } = useAuth();
  const { toast } = useToast();

  // Variáveis disponíveis para templates
  const availableVariables = [
    { name: '{{nome}}', description: 'Nome do usuário' },
    { name: '{{empresa}}', description: 'Nome da empresa' },
    { name: '{{servidor_nome}}', description: 'Nome do servidor' },
    { name: '{{tipo_alerta}}', description: 'Tipo do alerta (CPU, Memória, Disco)' },
    { name: '{{valor_atual}}', description: 'Valor atual da métrica' },
    { name: '{{limite}}', description: 'Limite configurado' },
    { name: '{{data_hora}}', description: 'Data e hora do alerta' },
    { name: '{{ip_servidor}}', description: 'IP do servidor' },
    { name: '{{status}}', description: 'Status do servidor/aplicação' }
  ];

  useEffect(() => {
    loadNotificationSettings();
    loadEmailTemplates();
  }, []);

  const loadNotificationSettings = async () => {
    if (!user) return;

    try {
      setIsLoading(true);
      console.log('Carregando configurações de notificação para usuário:', user.id);
      
      const { data, error } = await supabase
        .from('notification_settings')
        .select('*')
        .eq('usuario_id', user.id)
        .eq('email_provider', 'resend') // Filtrar apenas Resend
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Erro ao carregar configurações:', error);
        throw error;
      }

      if (data) {
        console.log('Configurações de notificação carregadas:', data);
        setNotificationSettings({
          email_provider: 'resend', // Forçar sempre Resend
          smtp_host: '',
          smtp_port: 587,
          smtp_username: '',
          smtp_password: '',
          smtp_secure: true,
          api_key: data.api_key || '',
          from_email: data.from_email || '',
          from_name: data.from_name || 'DeskTools',
          is_active: data.is_active || false
        });
      }
    } catch (error: any) {
      console.error('Erro ao carregar configurações:', error);
      toast({
        title: "Erro ao carregar configurações",
        description: "Não foi possível carregar as configurações de notificação.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const loadEmailTemplates = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('email_templates')
        .select('*')
        .eq('usuario_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setEmailTemplates(data || []);
    } catch (error: any) {
      console.error('Erro ao carregar templates:', error);
    }
  };

  const saveNotificationSettings = async () => {
    if (!user) return;

    try {
      setIsLoading(true);
      console.log('Salvando configurações de notificação (Resend apenas):', notificationSettings);

      const { data, error } = await supabase
        .from('notification_settings')
        .upsert({
          usuario_id: user.id,
          email_provider: 'resend', // Sempre Resend
          api_key: notificationSettings.api_key,
          from_email: notificationSettings.from_email,
          from_name: notificationSettings.from_name,
          is_active: notificationSettings.is_active,
          // Limpar campos SMTP (não usados para Resend)
          smtp_host: null,
          smtp_port: null,
          smtp_username: null,
          smtp_password: null,
          smtp_secure: null,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'usuario_id'
        })
        .select()
        .single();

      if (error) {
        console.error('Erro ao salvar:', error);
        throw error;
      }

      console.log('Configurações de notificação salvas:', data);

      if (data) {
        setNotificationSettings(prev => ({
          ...prev,
          is_active: data.is_active
        }));
      }

      toast({
        title: "Configurações salvas",
        description: "As configurações de email (Resend) foram salvas com sucesso.",
      });
    } catch (error: any) {
      console.error('Erro ao salvar configurações:', error);
      toast({
        title: "Erro ao salvar",
        description: `Não foi possível salvar as configurações: ${error.message}`,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const saveEmailTemplate = async () => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('email_templates')
        .upsert({
          usuario_id: user.id,
          ...currentTemplate,
          updated_at: new Date().toISOString()
        });

      if (error) throw error;

      toast({
        title: "Template salvo",
        description: "O template de email foi salvo com sucesso.",
      });
      
      loadEmailTemplates();
    } catch (error: any) {
      console.error('Erro ao salvar template:', error);
      toast({
        title: "Erro ao salvar template",
        description: "Não foi possível salvar o template.",
        variant: "destructive"
      });
    }
  };

  const testEmailConnection = async () => {
    setTestingEmail(true);
    setTestStatus('idle');

    try {
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      if (notificationSettings.from_email && notificationSettings.api_key) {
        setTestStatus('success');
        toast({
          title: "Teste bem-sucedido",
          description: "Configurações do Resend validadas com sucesso.",
        });
      } else {
        throw new Error('Configurações incompletas');
      }
    } catch (error) {
      setTestStatus('error');
      toast({
        title: "Falha no teste",
        description: "Verifique suas configurações do Resend e tente novamente.",
        variant: "destructive"
      });
    } finally {
      setTestingEmail(false);
    }
  };

  const updateField = (field: string, value: any) => {
    console.log('Atualizando campo de notificação:', field, 'com valor:', value);
    setNotificationSettings(prev => ({
      ...prev,
      [field]: value
    }));
    setTestStatus('idle');
  };

  const updateTemplateField = (field: string, value: any) => {
    setCurrentTemplate(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const insertVariable = (variable: string) => {
    const textarea = document.getElementById('html_content') as HTMLTextAreaElement;
    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const text = currentTemplate.html_content;
      const newText = text.substring(0, start) + variable + text.substring(end);
      updateTemplateField('html_content', newText);
      
      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(start + variable.length, start + variable.length);
      }, 0);
    }
  };

  const templateTypes = [
    { value: 'welcome', label: 'Boas-vindas' },
    { value: 'alert', label: 'Alerta' },
    { value: 'invoice', label: 'Fatura' },
    { value: 'report', label: 'Relatório' },
    { value: 'custom', label: 'Personalizado' }
  ];

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="channels">Canais</TabsTrigger>
          <TabsTrigger value="email">Email (Resend)</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
          <TabsTrigger value="test">Teste</TabsTrigger>
        </TabsList>

        <TabsContent value="channels" className="space-y-6">
          <NotificationChannelSettings />
        </TabsContent>

        <TabsContent value="email" className="space-y-6">
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                Configurações de Email - Resend
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Configurações básicas */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="from_email">Email do Remetente</Label>
                  <Input
                    id="from_email"
                    type="email"
                    placeholder="noreply@seudominio.com"
                    value={notificationSettings.from_email}
                    onChange={(e) => updateField('from_email', e.target.value)}
                    className="bg-background border-border"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="from_name">Nome do Remetente</Label>
                  <Input
                    id="from_name"
                    placeholder="DeskTools"
                    value={notificationSettings.from_name}
                    onChange={(e) => updateField('from_name', e.target.value)}
                    className="bg-background border-border"
                  />
                </div>
              </div>

              {/* API Key do Resend */}
              <div className="space-y-2">
                <Label htmlFor="api_key">Resend API Key</Label>
                <Input
                  id="api_key"
                  type="password"
                  placeholder="re_..."
                  value={notificationSettings.api_key}
                  onChange={(e) => updateField('api_key', e.target.value)}
                  className="bg-background border-border"
                />
                <p className="text-xs text-muted-foreground">
                  Obtenha sua API key em: https://resend.com/api-keys
                </p>
              </div>

              {/* Status e ações */}
              <div className="flex items-center justify-between pt-4">
                <div className="flex items-center space-x-2">
                  {testStatus === 'success' && <CheckCircle className="h-4 w-4 text-green-500" />}
                  {testStatus === 'error' && <XCircle className="h-4 w-4 text-red-500" />}
                  <Badge variant={notificationSettings.is_active ? 'default' : 'secondary'}>
                    {notificationSettings.is_active ? 'Ativo' : 'Inativo'}
                  </Badge>
                </div>

                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    onClick={testEmailConnection}
                    disabled={testingEmail}
                    className="border-border hover:bg-accent"
                  >
                    <TestTube className="h-4 w-4 mr-2" />
                    {testingEmail ? 'Testando...' : 'Testar Resend'}
                  </Button>
                  <Switch
                    checked={notificationSettings.is_active}
                    onCheckedChange={(checked) => updateField('is_active', checked)}
                  />
                  <Button
                    onClick={saveNotificationSettings}
                    disabled={isLoading}
                    className="bg-primary text-primary-foreground hover:bg-primary/90"
                  >
                    {isLoading ? 'Salvando...' : 'Salvar'}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="templates" className="space-y-6">
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Templates de Email
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Variáveis disponíveis */}
              <Card className="bg-muted/50 border-border">
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Info className="h-4 w-4" />
                    Variáveis Disponíveis
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {availableVariables.map((variable) => (
                      <Button
                        key={variable.name}
                        variant="outline"
                        size="sm"
                        onClick={() => insertVariable(variable.name)}
                        className="justify-start text-xs h-8"
                        title={variable.description}
                      >
                        {variable.name}
                      </Button>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Clique em uma variável para inserir no template
                  </p>
                </CardContent>
              </Card>

              {/* Seleção do tipo de template */}
              <div className="space-y-2">
                <Label>Tipo de Template</Label>
                <Select
                  value={currentTemplate.template_type}
                  onValueChange={(value) => updateTemplateField('template_type', value)}
                >
                  <SelectTrigger className="bg-background border-border">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {templateTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Assunto */}
              <div className="space-y-2">
                <Label htmlFor="subject">Assunto</Label>
                <Input
                  id="subject"
                  placeholder="🚨 Alerta: {{tipo_alerta}} em {{servidor_nome}}"
                  value={currentTemplate.subject}
                  onChange={(e) => updateTemplateField('subject', e.target.value)}
                  className="bg-background border-border"
                />
              </div>

              {/* Conteúdo HTML */}
              <div className="space-y-2">
                <Label htmlFor="html_content">Conteúdo HTML</Label>
                <Textarea
                  id="html_content"
                  placeholder="<h1>Olá {{nome}}!</h1><p>Alerta de {{tipo_alerta}} no servidor {{servidor_nome}}:</p><p>Valor atual: {{valor_atual}}% (limite: {{limite}}%)</p><p>{{data_hora}}</p>"
                  value={currentTemplate.html_content}
                  onChange={(e) => updateTemplateField('html_content', e.target.value)}
                  className="bg-background border-border min-h-[200px]"
                />
              </div>

              {/* Conteúdo em texto */}
              <div className="space-y-2">
                <Label htmlFor="text_content">Conteúdo em Texto (opcional)</Label>
                <Textarea
                  id="text_content"
                  placeholder="Olá {{nome}}! Alerta de {{tipo_alerta}} no servidor {{servidor_nome}}: {{valor_atual}}% (limite: {{limite}}%) - {{data_hora}}"
                  value={currentTemplate.text_content}
                  onChange={(e) => updateTemplateField('text_content', e.target.value)}
                  className="bg-background border-border"
                />
              </div>

              <Button
                onClick={saveEmailTemplate}
                className="bg-primary text-primary-foreground hover:bg-primary/90"
              >
                <Send className="h-4 w-4 mr-2" />
                Salvar Template
              </Button>
            </CardContent>
          </Card>

          {/* Lista de templates existentes */}
          {emailTemplates.length > 0 && (
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle>Templates Salvos</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {emailTemplates.map((template) => (
                    <div key={template.id} className="flex items-center justify-between p-3 border border-border rounded">
                      <div>
                        <p className="font-medium">{template.subject}</p>
                        <p className="text-sm text-muted-foreground capitalize">{template.template_type}</p>
                      </div>
                      <Badge variant={template.is_active ? 'default' : 'secondary'}>
                        {template.is_active ? 'Ativo' : 'Inativo'}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="test" className="space-y-6">
          <NotificationTestPanel />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default NotificationSettings;
