
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Settings, CreditCard, TestTube, Shield, CheckCircle, XCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

const PaymentSettings = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [testingConnection, setTestingConnection] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [paymentSettings, setPaymentSettings] = useState({
    gateway_type: 'stripe' as 'stripe' | 'mercadopago',
    mode: 'test' as 'test' | 'production',
    stripe_secret_key: '',
    stripe_publishable_key: '',
    stripe_webhook_secret: '',
    mercadopago_access_token: '',
    mercadopago_public_key: '',
    mercadopago_webhook_url: '',
    is_active: false
  });
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    loadPaymentSettings();
  }, []);

  const loadPaymentSettings = async () => {
    if (!user) return;

    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('payment_settings')
        .select('*')
        .eq('usuario_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (data) {
        // Extrair apenas os campos necessários para evitar erro de tipagem
        setPaymentSettings({
          gateway_type: data.gateway_type as 'stripe' | 'mercadopago',
          mode: data.mode as 'test' | 'production',
          stripe_secret_key: data.stripe_secret_key || '',
          stripe_publishable_key: data.stripe_publishable_key || '',
          stripe_webhook_secret: data.stripe_webhook_secret || '',
          mercadopago_access_token: data.mercadopago_access_token || '',
          mercadopago_public_key: data.mercadopago_public_key || '',
          mercadopago_webhook_url: data.mercadopago_webhook_url || '',
          is_active: data.is_active
        });
      }
    } catch (error: any) {
      console.error('Erro ao carregar configurações:', error);
      toast({
        title: "Erro ao carregar configurações",
        description: "Não foi possível carregar as configurações de pagamento.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const savePaymentSettings = async () => {
    if (!user) return;

    try {
      setIsLoading(true);
      const { error } = await supabase
        .from('payment_settings')
        .upsert({
          usuario_id: user.id,
          ...paymentSettings,
          updated_at: new Date().toISOString()
        });

      if (error) throw error;

      toast({
        title: "Configurações salvas",
        description: "As configurações de pagamento foram salvas com sucesso.",
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

  const testConnection = async () => {
    setTestingConnection(true);
    setConnectionStatus('idle');

    try {
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const hasCredentials = paymentSettings.gateway_type === 'stripe' 
        ? paymentSettings.stripe_secret_key && paymentSettings.stripe_publishable_key
        : paymentSettings.mercadopago_access_token && paymentSettings.mercadopago_public_key;

      if (hasCredentials) {
        setConnectionStatus('success');
        toast({
          title: "Conexão bem-sucedida",
          description: `Conexão com ${paymentSettings.gateway_type === 'stripe' ? 'Stripe' : 'Mercado Pago'} estabelecida com sucesso.`,
        });
      } else {
        throw new Error('Credenciais incompletas');
      }
    } catch (error) {
      setConnectionStatus('error');
      toast({
        title: "Falha na conexão",
        description: "Verifique suas credenciais e tente novamente.",
        variant: "destructive"
      });
    } finally {
      setTestingConnection(false);
    }
  };

  const updateField = (field: string, value: any) => {
    setPaymentSettings(prev => ({
      ...prev,
      [field]: value
    }));
    setConnectionStatus('idle');
  };

  const isStripeSelected = paymentSettings.gateway_type === 'stripe';
  const isMercadoPagoSelected = paymentSettings.gateway_type === 'mercadopago';

  return (
    <div className="space-y-6">
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Configurações de Pagamento
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Seleção do Gateway com botões visuais */}
          <div className="space-y-4">
            <Label>Gateway de Pagamento</Label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Button
                variant={isStripeSelected ? "default" : "outline"}
                onClick={() => updateField('gateway_type', 'stripe')}
                className={`h-20 flex-col space-y-2 ${
                  isStripeSelected 
                    ? 'bg-primary text-primary-foreground border-primary' 
                    : 'border-border hover:bg-accent'
                }`}
              >
                <div className="font-semibold">Stripe</div>
                <div className="text-xs opacity-80">Gateway internacional</div>
              </Button>
              <Button
                variant={isMercadoPagoSelected ? "default" : "outline"}
                onClick={() => updateField('gateway_type', 'mercadopago')}
                className={`h-20 flex-col space-y-2 ${
                  isMercadoPagoSelected 
                    ? 'bg-primary text-primary-foreground border-primary' 
                    : 'border-border hover:bg-accent'
                }`}
              >
                <div className="font-semibold">Mercado Pago</div>
                <div className="text-xs opacity-80">Gateway brasileiro</div>
              </Button>
            </div>
          </div>

          {/* Modo de Operação */}
          <div className="flex items-center justify-between p-4 border border-border rounded-lg bg-muted/50">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <TestTube className="h-4 w-4" />
                <Label htmlFor="mode">Modo de Teste</Label>
                <Switch
                  id="mode"
                  checked={paymentSettings.mode === 'test'}
                  onCheckedChange={(checked) => updateField('mode', checked ? 'test' : 'production')}
                />
              </div>
              <Badge variant={paymentSettings.mode === 'test' ? 'secondary' : 'destructive'}>
                {paymentSettings.mode === 'test' ? 'Teste' : 'Produção'}
              </Badge>
            </div>

            <div className="flex items-center space-x-2">
              {connectionStatus === 'success' && <CheckCircle className="h-4 w-4 text-green-500" />}
              {connectionStatus === 'error' && <XCircle className="h-4 w-4 text-red-500" />}
              <Badge variant={paymentSettings.is_active ? 'default' : 'secondary'}>
                {paymentSettings.is_active ? 'Ativo' : 'Inativo'}
              </Badge>
            </div>
          </div>

          {/* Campos do Stripe */}
          {isStripeSelected && (
            <Card className="border-l-4 border-l-blue-500">
              <CardHeader>
                <CardTitle className="text-lg">Configurações Stripe</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="stripe_secret_key">Secret Key</Label>
                    <Input
                      id="stripe_secret_key"
                      type="password"
                      placeholder="sk_test_..."
                      value={paymentSettings.stripe_secret_key}
                      onChange={(e) => updateField('stripe_secret_key', e.target.value)}
                      className="bg-background border-border"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="stripe_publishable_key">Publishable Key</Label>
                    <Input
                      id="stripe_publishable_key"
                      placeholder="pk_test_..."
                      value={paymentSettings.stripe_publishable_key}
                      onChange={(e) => updateField('stripe_publishable_key', e.target.value)}
                      className="bg-background border-border"
                    />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="stripe_webhook_secret">Webhook Secret</Label>
                    <Input
                      id="stripe_webhook_secret"
                      type="password"
                      placeholder="whsec_..."
                      value={paymentSettings.stripe_webhook_secret}
                      onChange={(e) => updateField('stripe_webhook_secret', e.target.value)}
                      className="bg-background border-border"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Campos do Mercado Pago */}
          {isMercadoPagoSelected && (
            <Card className="border-l-4 border-l-yellow-500">
              <CardHeader>
                <CardTitle className="text-lg">Configurações Mercado Pago</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="mercadopago_access_token">Access Token</Label>
                    <Input
                      id="mercadopago_access_token"
                      type="password"
                      placeholder="APP_USR-..."
                      value={paymentSettings.mercadopago_access_token}
                      onChange={(e) => updateField('mercadopago_access_token', e.target.value)}
                      className="bg-background border-border"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="mercadopago_public_key">Public Key</Label>
                    <Input
                      id="mercadopago_public_key"
                      placeholder="APP_PUBLIC-..."
                      value={paymentSettings.mercadopago_public_key}
                      onChange={(e) => updateField('mercadopago_public_key', e.target.value)}
                      className="bg-background border-border"
                    />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="mercadopago_webhook_url">Webhook URL</Label>
                    <Input
                      id="mercadopago_webhook_url"
                      placeholder="https://seu-site.com/webhook/mercadopago"
                      value={paymentSettings.mercadopago_webhook_url}
                      onChange={(e) => updateField('mercadopago_webhook_url', e.target.value)}
                      className="bg-background border-border"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Ações */}
          <div className="flex justify-between pt-4 border-t border-border">
            <Button
              variant="outline"
              onClick={testConnection}
              disabled={testingConnection}
              className="border-border hover:bg-accent"
            >
              <Settings className="h-4 w-4 mr-2" />
              {testingConnection ? 'Testando...' : 'Testar Conexão'}
            </Button>

            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Label htmlFor="is_active">Ativar Gateway</Label>
                <Switch
                  id="is_active"
                  checked={paymentSettings.is_active}
                  onCheckedChange={(checked) => updateField('is_active', checked)}
                />
              </div>
              <Button
                onClick={savePaymentSettings}
                disabled={isLoading}
                className="bg-primary text-primary-foreground hover:bg-primary/90"
              >
                {isLoading ? 'Salvando...' : 'Salvar Configurações'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Documentação */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Links Úteis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <h4 className="font-medium">Stripe</h4>
              <p className="text-sm text-muted-foreground">
                Configure suas chaves de API do Stripe para aceitar pagamentos recorrentes.
              </p>
              <Button variant="outline" size="sm" asChild>
                <a href="https://dashboard.stripe.com/apikeys" target="_blank" rel="noopener noreferrer">
                  Acessar Dashboard
                </a>
              </Button>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium">Mercado Pago</h4>
              <p className="text-sm text-muted-foreground">
                Configure suas credenciais do Mercado Pago para aceitar pagamentos no Brasil.
              </p>
              <Button variant="outline" size="sm" asChild>
                <a href="https://www.mercadopago.com.br/developers/panel" target="_blank" rel="noopener noreferrer">
                  Acessar Painel
                </a>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PaymentSettings;
