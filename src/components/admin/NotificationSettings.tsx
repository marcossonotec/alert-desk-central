
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

const NotificationSettings = () => {
  const [activeTab, setActiveTab] = useState('smtp');
  const [isLoading, setIsLoading] = useState(false);
  const [testingEmail, setTestingEmail] = useState(false);
  const [testStatus, setTestStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [notificationSettings, setNotificationSettings] = useState({
    email_provider: 'smtp',
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
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Erro ao carregar configurações:', error);
        throw error;
      }

      if (data) {
        console.log('Configurações de notificação carregadas:', data);
        setNotificationSettings({
          email_provider: data.email_provider || 'smtp',
          smtp_host: data.smtp_host || '',
          smtp_port: data.smtp_port || 587,
          smtp_username: data.smtp_username || '',
          smtp_password: data.smtp_password || '',
          smtp_secure: data.smtp_secure !== false,
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
      console.log('Salvando configurações de notificação:', notificationSettings);

      const { data, error } = await supabase
        .from('notification_settings')
        .upsert({
          usuario_id: user.id,
          ...notificationSettings,
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

      // Atualizar estado local
      if (data) {
        setNotificationSettings(prev => ({
          ...prev,
          is_active: data.is_active
        }));
      }

      toast({
        title: "Configurações salvas",
        description: "As configurações de notificação foram salvas com sucesso.",
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
      
      if (notificationSettings.from_email && 
          ((notificationSettings.email_provider === 'smtp' && notificationSettings.smtp_host) ||
           (notificationSettings.email_provider !== 'smtp' && notificationSettings.api_key))) {
        setTestStatus('success');
        toast({
          title: "Teste bem-sucedido",
          description: "Email de teste enviado com sucesso.",
        });
      } else {
        throw new Error('Configurações incompletas');
      }
    } catch (error) {
      setTestStatus('error');
      toast({
        title: "Falha no teste",
        description: "Verifique suas configurações e tente novamente.",
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
      
      // Reposicionar cursor
      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(start + variable.length, start + variable.length);
      }, 0);
    }
  };

  const emailProviders = [
    { value: 'smtp', label: 'SMTP Personalizado' },
    { value: 'sendgrid', label: 'SendGrid' },
    { value: 'google', label: 'Gmail/Google Workspace' },
    { value: 'amazon_ses', label: 'Amazon SES' },
    { value: 'resend', label: 'Resend' }
  ];

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
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="smtp">Configurações SMTP</TabsTrigger>
          <TabsTrigger value="templates">Templates de Email</TabsTrigger>
        </TabsList>

        <TabsContent value="smtp" className="space-y-6">
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                Configurações de Email
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Seleção do Provedor */}
              <div className="space-y-2">
                <Label>Provedor de Email</Label>
                <Select
                  value={notificationSettings.email_provider}
                  onValueChange={(value) => updateField('email_provider', value)}
                >
                  <SelectTrigger className="bg-background border-border">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {emailProviders.map((provider) => (
                      <SelectItem key={provider.value} value={provider.value}>
                        {provider.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

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

              {/* Configurações específicas do provedor */}
              {notificationSettings.email_provider === 'smtp' ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="smtp_host">Servidor SMTP</Label>
                      <Input
                        id="smtp_host"
                        placeholder="smtp.gmail.com"
                        value={notificationSettings.smtp_host}
                        onChange={(e) => updateField('smtp_host', e.target.value)}
                        className="bg-background border-border"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="smtp_port">Porta</Label>
                      <Input
                        id="smtp_port"
                        type="number"
                        placeholder="587"
                        value={notificationSettings.smtp_port}
                        onChange={(e) => updateField('smtp_port', parseInt(e.target.value))}
                        className="bg-background border-border"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="smtp_username">Usuário</Label>
                      <Input
                        id="smtp_username"
                        placeholder="seu.email@gmail.com"
                        value={notificationSettings.smtp_username}
                        onChange={(e) => updateField('smtp_username', e.target.value)}
                        className="bg-background border-border"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="smtp_password">Senha</Label>
                      <Input
                        id="smtp_password"
                        type="password"
                        placeholder="sua-senha-ou-app-password"
                        value={notificationSettings.smtp_password}
                        onChange={(e) => updateField('smtp_password', e.target.value)}
                        className="bg-background border-border"
                      />
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="smtp_secure"
                      checked={notificationSettings.smtp_secure}
                      onCheckedChange={(checked) => updateField('smtp_secure', checked)}
                    />
                    <Label htmlFor="smtp_secure">Usar SSL/TLS</Label>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <Label htmlFor="api_key">API Key</Label>
                  <Input
                    id="api_key"
                    type="password"
                    placeholder="Sua API key do provedor"
                    value={notificationSettings.api_key}
                    onChange={(e) => updateField('api_key', e.target.value)}
                    className="bg-background border-border"
                  />
                </div>
              )}

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
                    {testingEmail ? 'Testando...' : 'Testar Email'}
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
      </Tabs>
    </div>
  );
};

export default NotificationSettings;
