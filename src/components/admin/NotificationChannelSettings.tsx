
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Mail, MessageSquare, Settings, CheckCircle, XCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

interface ChannelSettings {
  email_enabled: boolean;
  whatsapp_enabled: boolean;
  email_configured: boolean;
  whatsapp_configured: boolean;
}

const NotificationChannelSettings = () => {
  const [channelSettings, setChannelSettings] = useState<ChannelSettings>({
    email_enabled: false,
    whatsapp_enabled: false,
    email_configured: false,
    whatsapp_configured: false
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

      setChannelSettings({
        email_enabled: !!emailConfig,
        whatsapp_enabled: !!whatsappConfig && !!profile?.whatsapp,
        email_configured: !!emailConfig && !!emailConfig.from_email,
        whatsapp_configured: !!whatsappConfig && !!profile?.whatsapp
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
          description: "Configure primeiro as configurações de email na aba 'Configurações de Email'.",
          variant: "destructive"
        });
        return;
      }

      const { error } = await supabase
        .from('notification_settings')
        .upsert({
          usuario_id: user.id,
          email_provider: 'resend',
          is_active: enabled,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'usuario_id'
        });

      if (error) throw error;

      setChannelSettings(prev => ({ ...prev, email_enabled: enabled }));

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
              <div className="flex items-center gap-2 mt-1">
                <Badge variant={channelSettings.email_configured ? "default" : "secondary"}>
                  {channelSettings.email_configured ? (
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
              checked={channelSettings.email_enabled}
              onCheckedChange={toggleEmailChannel}
              disabled={isLoading || !channelSettings.email_configured}
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
              disabled={isLoading || !channelSettings.whatsapp_configured}
            />
            <Label>
              {channelSettings.whatsapp_enabled ? 'Ativo' : 'Inativo'}
            </Label>
          </div>
        </div>

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
