import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Cloud, 
  Server, 
  Key, 
  CheckCircle, 
  AlertCircle,
  ExternalLink,
  Copy,
  Eye,
  EyeOff
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

interface ProviderSetupWizardProps {
  isOpen: boolean;
  onClose: () => void;
  onTokenSaved?: () => void;
}

const ProviderSetupWizard: React.FC<ProviderSetupWizardProps> = ({
  isOpen,
  onClose,
  onTokenSaved,
}) => {
  const [selectedProvider, setSelectedProvider] = useState('hetzner');
  const [tokenData, setTokenData] = useState({
    nickname: '',
    token: ''
  });
  const [showToken, setShowToken] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [validationResult, setValidationResult] = useState<{success: boolean, message: string} | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const providers = [
    {
      id: 'hetzner',
      name: 'Hetzner Cloud',
      description: 'Servidores cloud alemães de alta performance',
      icon: <Cloud className="h-6 w-6 text-orange-500" />,
      apiUrl: 'https://console.hetzner.cloud/projects',
      features: ['CPU', 'Memória', 'Disco', 'Rede', 'Uptime'],
      setupSteps: [
        'Acesse o Hetzner Cloud Console',
        'Vá em Security > API Tokens',
        'Clique em "Generate API Token"',
        'Dê um nome e selecione "Read" como permissão',
        'Copie o token gerado'
      ]
    },
    {
      id: 'digitalocean',
      name: 'DigitalOcean',
      description: 'Infraestrutura cloud simples e escalável',
      icon: <Cloud className="h-6 w-6 text-blue-500" />,
      apiUrl: 'https://cloud.digitalocean.com/account/api/tokens',
      features: ['CPU', 'Memória', 'Disco', 'Rede', 'Load Average'],
      setupSteps: [
        'Acesse sua conta DigitalOcean',
        'Vá em API > Tokens',
        'Clique em "Generate New Token"',
        'Dê um nome e selecione escopo "Read"',
        'Copie o token gerado'
      ]
    },
    {
      id: 'vultr',
      name: 'Vultr',
      description: 'Cloud computing de alta performance',
      icon: <Cloud className="h-6 w-6 text-blue-600" />,
      apiUrl: 'https://my.vultr.com/settings/#settingsapi',
      features: ['CPU', 'Memória', 'Disco', 'Rede', 'Bandwidth'],
      setupSteps: [
        'Acesse seu painel Vultr',
        'Vá em Account > API',
        'Habilite a API se necessário',
        'Copie sua API Key',
        'Configure as permissões apropriadas'
      ]
    },
    {
      id: 'aws',
      name: 'Amazon AWS',
      description: 'Plataforma cloud líder mundial',
      icon: <Cloud className="h-6 w-6 text-yellow-600" />,
      apiUrl: 'https://console.aws.amazon.com/iam/home#/security_credentials',
      features: ['CloudWatch', 'EC2', 'EBS', 'Network', 'Auto Scaling'],
      setupSteps: [
        'Acesse o AWS Console',
        'Vá em IAM > Access keys',
        'Crie um novo Access Key',
        'Configure permissões CloudWatch:ReadOnlyAccess',
        'Guarde Access Key ID e Secret Key'
      ]
    },
    {
      id: 'linode',
      name: 'Linode',
      description: 'Cloud computing desenvolvido para desenvolvedores',
      icon: <Cloud className="h-6 w-6 text-green-600" />,
      apiUrl: 'https://cloud.linode.com/profile/tokens',
      features: ['CPU', 'Memória', 'Disco', 'Rede', 'Transfer'],
      setupSteps: [
        'Acesse Linode Cloud Manager',
        'Vá em Profile > API Tokens',
        'Clique em "Create A Personal Access Token"',
        'Selecione escopo "Read Only" para Linodes',
        'Copie o token gerado'
      ]
    }
  ];

  const getCurrentProvider = () => {
    return providers.find(p => p.id === selectedProvider) || providers[0];
  };

  const validateToken = async () => {
    if (!tokenData.token.trim()) {
      toast({
        title: "Token necessário",
        description: "Digite o token da API para validar",
        variant: "destructive"
      });
      return;
    }

    try {
      setIsValidating(true);
      setValidationResult(null);

      // Call edge function to validate token
      const { data, error } = await supabase.functions.invoke('validate-provider-token', {
        body: {
          provider: selectedProvider,
          token: tokenData.token
        }
      });

      if (error) throw error;

      if (data?.success) {
        setValidationResult({
          success: true,
          message: `Token válido! Encontrados ${data.serverCount || 0} servidores.`
        });
      } else {
        setValidationResult({
          success: false,
          message: data?.error || 'Token inválido ou sem permissões'
        });
      }
    } catch (error: any) {
      console.error('Erro ao validar token:', error);
      setValidationResult({
        success: false,
        message: error.message || 'Erro ao validar token'
      });
    } finally {
      setIsValidating(false);
    }
  };

  const saveToken = async () => {
    if (!user || !tokenData.token.trim() || !tokenData.nickname.trim()) {
      toast({
        title: "Dados obrigatórios",
        description: "Preencha todos os campos obrigatórios",
        variant: "destructive"
      });
      return;
    }

    if (!validationResult?.success) {
      toast({
        title: "Token não validado",
        description: "Valide o token antes de salvar",
        variant: "destructive"
      });
      return;
    }

    try {
      setIsSaving(true);

      const { error } = await supabase
        .from('provider_tokens')
        .insert({
          usuario_id: user.id,
          provider: selectedProvider,
          nickname: tokenData.nickname,
          token: tokenData.token
        });

      if (error) throw error;

      toast({
        title: "Token salvo!",
        description: "Configuração do provedor salva com sucesso",
      });

      // Reset form
      setTokenData({ nickname: '', token: '' });
      setValidationResult(null);
      
      if (onTokenSaved) onTokenSaved();
      onClose();
    } catch (error: any) {
      console.error('Erro ao salvar token:', error);
      toast({
        title: "Erro ao salvar",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copiado!",
      description: "Link copiado para a área de transferência",
    });
  };

  const currentProvider = getCurrentProvider();

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-card border-border max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl text-foreground">
            Configurar Provedor de Cloud
          </DialogTitle>
        </DialogHeader>

        <Tabs value={selectedProvider} onValueChange={setSelectedProvider}>
          <TabsList className="grid w-full grid-cols-5">
            {providers.map((provider) => (
              <TabsTrigger key={provider.id} value={provider.id} className="text-xs">
                {provider.name.split(' ')[0]}
              </TabsTrigger>
            ))}
          </TabsList>

          {providers.map((provider) => (
            <TabsContent key={provider.id} value={provider.id} className="space-y-6">
              {/* Provider Info */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-3">
                    {provider.icon}
                    <div>
                      <h3 className="text-lg">{provider.name}</h3>
                      <p className="text-sm text-muted-foreground font-normal">
                        {provider.description}
                      </p>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-medium mb-2">Métricas Disponíveis:</h4>
                      <div className="flex flex-wrap gap-2">
                        {provider.features.map((feature) => (
                          <Badge key={feature} variant="secondary">
                            {feature}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h4 className="font-medium mb-2">Configuração da API:</h4>
                      <div className="bg-muted/50 p-4 rounded-lg space-y-2">
                        {provider.setupSteps.map((step, index) => (
                          <div key={index} className="flex items-start gap-2 text-sm">
                            <span className="font-semibold text-primary min-w-[20px]">
                              {index + 1}.
                            </span>
                            <span>{step}</span>
                          </div>
                        ))}
                      </div>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => copyToClipboard(provider.apiUrl)}
                        className="mt-2"
                      >
                        <Copy className="h-4 w-4 mr-2" />
                        Copiar Link da API
                        <ExternalLink className="h-4 w-4 ml-2" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Token Configuration */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Key className="h-5 w-5" />
                    Configurar Token
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="nickname">Nome da Configuração *</Label>
                      <Input
                        id="nickname"
                        placeholder="ex: Produção, Desenvolvimento"
                        value={tokenData.nickname}
                        onChange={(e) => setTokenData(prev => ({ ...prev, nickname: e.target.value }))}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="token">Token/API Key *</Label>
                      <div className="relative">
                        <Input
                          id="token"
                          type={showToken ? 'text' : 'password'}
                          placeholder="Cole aqui o token da API"
                          value={tokenData.token}
                          onChange={(e) => setTokenData(prev => ({ ...prev, token: e.target.value }))}
                          className="pr-10"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => setShowToken(!showToken)}
                          className="absolute right-0 top-0 h-full px-3"
                        >
                          {showToken ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* Validation */}
                  <div className="flex gap-2">
                    <Button
                      onClick={validateToken}
                      disabled={isValidating || !tokenData.token.trim()}
                      variant="outline"
                      className="flex-1"
                    >
                      <Server className={`h-4 w-4 mr-2 ${isValidating ? 'animate-spin' : ''}`} />
                      {isValidating ? 'Validando...' : 'Validar Token'}
                    </Button>
                  </div>

                  {/* Validation Result */}
                  {validationResult && (
                    <div className={`p-3 rounded-lg border ${
                      validationResult.success 
                        ? 'bg-green-50 border-green-200 text-green-800' 
                        : 'bg-red-50 border-red-200 text-red-800'
                    }`}>
                      <div className="flex items-center gap-2">
                        {validationResult.success ? (
                          <CheckCircle className="h-4 w-4" />
                        ) : (
                          <AlertCircle className="h-4 w-4" />
                        )}
                        <span className="text-sm font-medium">
                          {validationResult.message}
                        </span>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          ))}
        </Tabs>

        {/* Actions */}
        <div className="flex justify-between pt-4 border-t border-border">
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            onClick={saveToken}
            disabled={isSaving || !validationResult?.success}
            className="bg-primary text-primary-foreground hover:bg-primary/90"
          >
            {isSaving ? 'Salvando...' : 'Salvar Configuração'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ProviderSetupWizard;