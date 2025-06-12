
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
import { Mail, Send, Settings, TestTube, FileText, CheckCircle, XCircle } from 'lucide-react';
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

  useEffect(() => {
    loadNotificationSettings();
    loadEmailTemplates();
  }, []);

  const loadNotificationSettings = async () => {
    if (!user) return;

    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('notification_settings')
        .select('*')
        .eq('usuario_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (data) {
        setNotificationSettings(data);
      }
    } catch (error: any) {
      console.error('Erro ao carregar configurações:', error);
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
      const { error } = await supabase
        .from('notification_settings')
        .upsert({
          usuario_id: user.id,
          ...notificationSettings,
          updated_at: new Date().toISOString()
        });

      if (error) throw error;

      toast({
        title: "Configurações salvas",
        description: "As configurações de notificação foram salvas com sucesso.",
      });
    } catch (error: any) {
      console.error('Erro ao salvar configurações:', error);
      toast({
        title: "Erro ao salvar",
        description: "Não foi possível salvar as configurações.",
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
      // Simular teste de email (implementar com edge function posteriormente)
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
                  placeholder="Assunto do email"
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
                  placeholder="<h1>Olá {{nome}}!</h1><p>Bem-vindo ao DeskTools...</p>"
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
                  placeholder="Olá {{nome}}! Bem-vindo ao DeskTools..."
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
