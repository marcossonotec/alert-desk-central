
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Mail, MessageSquare, Settings, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

interface ChannelSettings {
  email_enabled: boolean;
  whatsapp_enabled: boolean;
  email_configured: boolean;
  whatsapp_configured: boolean;
  email_domain_verified: boolean;
}

const NotificationChannelSettings = () => {
  const [channelSettings, setChannelSettings] = useState<ChannelSettings>({
    email_enabled: false,
    whatsapp_enabled: false,
    email_configured: false,
    whatsapp_configured: false,
    email_domain_verified: false
  });
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    loadChannelSettings();
  }, []);

  const loadChannelSettings = async () => {
    if (!user) return;

    try {
      setIsLoading(true);

      // Verificar configurações de email (Resend)
      const { data: emailConfig } = await supabase
        .from('notification_settings')
        .select('*')
        .eq('usuario_id', user.id)
        .eq('email_provider', 'resend')
        .eq('is_active', true)
        .maybeSingle();

      // Verificar configurações de WhatsApp (Evolution)
      const { data: whatsappConfig } = await supabase
        .from('evolution_instances')
        .select('*')
        .eq('usuario_id', user.id)
        .eq('status', 'connected')
        .maybeSingle();

      // Verificar perfil do usuário para WhatsApp
      const { data: profile } = await supabase
        .from('profiles')
        .select('whatsapp')
        .eq('id', user.id)
        .single();

      // Verificar se o domínio do email está correto (tools.flowserv.com.br)
      const emailDomainVerified = emailConfig?.from_email ? 
        emailConfig.from_email.includes('tools.flowserv.com.br') : false;

      setChannelSettings({
        email_enabled: !!emailConfig,
        whatsapp_enabled: !!whatsappConfig && !!profile?.whatsapp,
        email_configured: !!emailConfig && !!emailConfig.from_email && !!emailConfig.api_key,
        whatsapp_configured: !!whatsappConfig && !!profile?.whatsapp,
        email_domain_verified: emailDomainVerified
      });

    } catch (error: any) {
      console.error('Erro ao carregar configurações de canal:', error);
      toast({
        title: "Erro ao carregar configurações",
        description: "Não foi possível carregar as configurações dos canais.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const toggleEmailChannel = async (enabled: boolean) => {
    if (!user) return;

    try {
      setIsLoading(true);

      if (enabled && !channelSettings.email_configured) {
        toast({
          title: "Email não configurado",
          description: "Configure primeiro as configurações de email na aba 'Email (Resend)'.",
          variant: "destructive"
        });
        return;
      }

      if (enabled && !channelSettings.email_domain_verified) {
        toast({
          title: "Domínio não verificado",
          description: "Use um email do domínio tools.flowserv.com.br (ex: alertas@tools.flowserv.com.br).",
          variant: "destructive"
        });
        return;
      }

      // Buscar configuração existente
      const { data: existingConfig } = await supabase
        .from('notification_settings')
        .select('*')
        .eq('usuario_id', user.id)
        .eq('email_provider', 'resend')
        .maybeSingle();

      if (existingConfig) {
        // Atualizar configuração existente
        const { error } = await supabase
          .from('notification_settings')
          .update({
            is_active: enabled,
            updated_at: new Date().toISOString()
          })
          .eq('id', existingConfig.id);

        if (error) throw error;
      } else if (enabled) {
        // Criar nova configuração apenas se estiver ativando
        const { error } = await supabase
          .from('notification_settings')
          .insert({
            usuario_id: user.id,
            email_provider: 'resend',
            from_email: 'alertas@tools.flowserv.com.br', // Email padrão do domínio verificado
            from_name: 'DeskTools',
            is_active: true,
            updated_at: new Date().toISOString()
          });

        if (error) throw error;
      }

      setChannelSettings(prev => ({ 
        ...prev, 
        email_enabled: enabled,
        email_configured: enabled || prev.email_configured
      }));

      toast({
        title: `Email ${enabled ? 'ativado' : 'desativado'}`,
        description: `As notificações por email foram ${enabled ? 'ativadas' : 'desativadas'}.`,
      });

    } catch (error: any) {
      console.error('Erro ao alterar configuração de email:', error);
      toast({
        title: "Erro ao alterar configuração",
        description: "Não foi possível alterar a configuração de email.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const toggleWhatsAppChannel = async (enabled: boolean) => {
    if (!user) return;

    try {
      setIsLoading(true);

      if (enabled && !channelSettings.whatsapp_configured) {
        toast({
          title: "WhatsApp não configurado",
          description: "Configure primeiro uma instância Evolution e seu número de WhatsApp no perfil.",
          variant: "destructive"
        });
        return;
      }

      // Para WhatsApp, vamos ativar/desativar através do status da instância Evolution
      const { data: instance } = await supabase
        .from('evolution_instances')
        .select('id')
        .eq('usuario_id', user.id)
        .single();

      if (instance) {
        const { error } = await supabase
          .from('evolution_instances')
          .update({
            status: enabled ? 'connected' : 'disconnected',
            updated_at: new Date().toISOString()
          })
          .eq('id', instance.id);

        if (error) throw error;
      }

      setChannelSettings(prev => ({ ...prev, whatsapp_enabled: enabled }));

      toast({
        title: `WhatsApp ${enabled ? 'ativado' : 'desativado'}`,
        description: `As notificações por WhatsApp foram ${enabled ? 'ativadas' : 'desativadas'}.`,
      });

    } catch (error: any) {
      console.error('Erro ao alterar configuração de WhatsApp:', error);
      toast({
        title: "Erro ao alterar configuração",
        description: "Não foi possível alterar a configuração de WhatsApp.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          Controle de Canais de Notificação
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        
        {/* Canal Email */}
        <div className="flex items-center justify-between p-4 border border-border rounded-lg">
          <div className="flex items-center space-x-4">
            <Mail className="h-6 w-6 text-blue-500" />
            <div>
              <h3 className="font-medium">Email (Resend)</h3>
              <p className="text-sm text-muted-foreground">
                Envio de alertas por email via Resend
              </p>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                <Badge variant={channelSettings.email_configured ? "default" : "secondary"}>
                  {channelSettings.email_configured ? (
                    <><CheckCircle className="h-3 w-3 mr-1" /> Configurado</>
                  ) : (
                    <><XCircle className="h-3 w-3 mr-1" /> Não configurado</>
                  )}
                </Badge>
                {channelSettings.email_configured && (
                  <Badge variant={channelSettings.email_domain_verified ? "default" : "destructive"}>
                    {channelSettings.email_domain_verified ? (
                      <><CheckCircle className="h-3 w-3 mr-1" /> Domínio OK</>
                    ) : (
                      <><AlertCircle className="h-3 w-3 mr-1" /> Domínio inválido</>
                    )}
                  </Badge>
                )}
              </div>
              {channelSettings.email_configured && !channelSettings.email_domain_verified && (
                <p className="text-xs text-red-500 mt-1">
                  Use email do domínio: tools.flowserv.com.br
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Switch
              checked={channelSettings.email_enabled}
              onCheckedChange={toggleEmailChannel}
              disabled={isLoading}
            />
            <Label>
              {channelSettings.email_enabled ? 'Ativo' : 'Inativo'}
            </Label>
          </div>
        </div>

        {/* Canal WhatsApp */}
        <div className="flex items-center justify-between p-4 border border-border rounded-lg">
          <div className="flex items-center space-x-4">
            <MessageSquare className="h-6 w-6 text-green-500" />
            <div>
              <h3 className="font-medium">WhatsApp (Evolution API)</h3>
              <p className="text-sm text-muted-foreground">
                Envio de alertas por WhatsApp via Evolution API
              </p>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant={channelSettings.whatsapp_configured ? "default" : "secondary"}>
                  {channelSettings.whatsapp_configured ? (
                    <><CheckCircle className="h-3 w-3 mr-1" /> Configurado</>
                  ) : (
                    <><XCircle className="h-3 w-3 mr-1" /> Não configurado</>
                  )}
                </Badge>
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Switch
              checked={channelSettings.whatsapp_enabled}
              onCheckedChange={toggleWhatsAppChannel}
              disabled={isLoading}
            />
            <Label>
              {channelSettings.whatsapp_enabled ? 'Ativo' : 'Inativo'}
            </Label>
          </div>
        </div>

        {/* Aviso sobre domínio */}
        {(!channelSettings.email_domain_verified && channelSettings.email_configured) && (
          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-yellow-800">Domínio não verificado</h4>
                <p className="text-sm text-yellow-700 mt-1">
                  Para usar o Resend, configure um email do domínio <strong>tools.flowserv.com.br</strong> 
                  (ex: alertas@tools.flowserv.com.br) nas configurações de email.
                </p>
                <p className="text-xs text-yellow-600 mt-2">
                  Verifique se o domínio está configurado em: 
                  <a href="https://resend.com/domains" target="_blank" rel="noopener noreferrer" className="underline ml-1">
                    Resend Domains
                  </a>
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Status Geral */}
        <div className="pt-4 border-t border-border">
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-foreground">
                {(channelSettings.email_enabled ? 1 : 0) + (channelSettings.whatsapp_enabled ? 1 : 0)}
              </div>
              <div className="text-sm text-muted-foreground">Canais Ativos</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-foreground">
                {(channelSettings.email_configured ? 1 : 0) + (channelSettings.whatsapp_configured ? 1 : 0)}
              </div>
              <div className="text-sm text-muted-foreground">Canais Configurados</div>
            </div>
          </div>
        </div>

        <Button
          onClick={loadChannelSettings}
          variant="outline"
          disabled={isLoading}
          className="w-full"
        >
          {isLoading ? 'Atualizando...' : 'Atualizar Status'}
        </Button>
      </CardContent>
    </Card>
  );
};

export default NotificationChannelSettings;
