
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Key, AlertCircle, Check } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useProviderTokens } from './useProviderTokens';

interface ProviderTokenSelectProps {
  provedor: string;
  selectedTokenId?: string;
  onTokenSelect: (tokenId: string | undefined) => void;
}

const ProviderTokenSelect: React.FC<ProviderTokenSelectProps> = ({
  provedor,
  selectedTokenId,
  onTokenSelect,
}) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const { tokens, isLoading, error, refetch } = useProviderTokens(provedor);
  const [newToken, setNewToken] = useState({ token: '', nickname: '' });
  const [saving, setSaving] = useState(false);

  console.log('ProviderTokenSelect render:', { 
    provedor, 
    selectedTokenId, 
    tokens: tokens?.length || 0, 
    isLoading, 
    error,
    user: user?.id 
  });

  const handleSaveToken = async () => {
    if (!newToken.token.trim() || !user) {
      toast({ title: "Token é obrigatório", variant: "destructive" });
      return;
    }

    setSaving(true);
    try {
      console.log('Salvando novo token para provider:', provedor);
      
      const { data, error } = await supabase
        .from('provider_tokens')
        .insert({
          provider: provedor,
          token: newToken.token.trim(),
          nickname: newToken.nickname.trim() || `Token ${provedor}`,
          usuario_id: user.id,
        })
        .select()
        .single();

      if (error) {
        console.error('Erro ao salvar token:', error);
        throw error;
      }

      console.log('Token salvo com sucesso:', data);
      onTokenSelect(data.id);
      setNewToken({ token: '', nickname: '' });
      refetch();
      
      toast({ 
        title: "Token salvo com sucesso!",
        description: "Agora você pode finalizar o cadastro do servidor."
      });
    } catch (error: any) {
      console.error('Erro ao salvar token:', error);
      toast({ 
        title: "Erro ao salvar token", 
        description: error.message,
        variant: "destructive" 
      });
    } finally {
      setSaving(false);
    }
  };

  if (provedor === 'outros') {
    return (
      <Card className="bg-card/50 border-border">
        <CardContent className="p-4">
          <div className="flex items-start gap-2 p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
            <AlertCircle className="h-4 w-4 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-blue-800 dark:text-blue-200">
              Para servidores "outros", a coleta será feita via agente instalado no servidor.
              As métricas serão simuladas para demonstração.
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="bg-card/50 border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center space-x-2 text-foreground">
            <AlertCircle className="h-5 w-5 text-red-500" />
            <span>Erro ao verificar tokens</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-start gap-2 p-3 bg-red-50 dark:bg-red-950/20 rounded-lg">
            <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
            <div className="text-xs text-red-800 dark:text-red-200">
              <strong>Erro:</strong> {error}
            </div>
          </div>
          <Button
            type="button"
            variant="outline"
            onClick={() => refetch()}
            className="w-full"
          >
            Tentar Novamente
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Se já tem token selecionado, mostra confirmação
  if (selectedTokenId && tokens.find(t => t.id === selectedTokenId)) {
    const selectedToken = tokens.find(t => t.id === selectedTokenId);
    return (
      <Card className="bg-card/50 border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center space-x-2 text-foreground">
            <Check className="h-5 w-5 text-green-500" />
            <span>Token Configurado</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-start gap-2 p-3 bg-green-50 dark:bg-green-950/20 rounded-lg">
            <Check className="h-4 w-4 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-green-800 dark:text-green-200">
              <strong>Token ativo:</strong> {selectedToken?.nickname} 
              <br />
              <span className="text-xs">({selectedToken?.token.substring(0, 8)}...)</span>
            </div>
          </div>
          <Button
            type="button"
            variant="outline"
            onClick={() => onTokenSelect(undefined)}
            className="w-full"
          >
            Trocar Token
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-card/50 border-border">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center space-x-2 text-foreground">
          <Key className="h-5 w-5 text-primary" />
          <span>Token da API {provedor}</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading ? (
          <div className="text-sm text-muted-foreground">Verificando tokens existentes...</div>
        ) : (
          <>
            {/* Se tem tokens existentes, permite selecionar */}
            {tokens.length > 0 && (
              <div className="space-y-3">
                <div className="text-sm font-medium">Usar token existente:</div>
                {tokens.map((token) => (
                  <Button
                    key={token.id}
                    type="button"
                    variant="outline"
                    onClick={() => onTokenSelect(token.id)}
                    className="w-full justify-start"
                  >
                    {token.nickname} ({token.token.substring(0, 8)}...)
                  </Button>
                ))}
                <div className="text-center text-sm text-muted-foreground">ou</div>
              </div>
            )}

            {/* Formulário para novo token */}
            <div className="space-y-3">
              <div className="text-sm font-medium">
                {tokens.length > 0 ? 'Adicionar novo token:' : 'Adicione seu token da API:'}
              </div>
              <div className="space-y-2">
                <Label htmlFor="token">Token da API</Label>
                <Input
                  id="token"
                  type="password"
                  value={newToken.token}
                  onChange={(e) => setNewToken({ ...newToken, token: e.target.value })}
                  placeholder={`Cole aqui seu token da API ${provedor}`}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="nickname">Nome (opcional)</Label>
                <Input
                  id="nickname"
                  value={newToken.nickname}
                  onChange={(e) => setNewToken({ ...newToken, nickname: e.target.value })}
                  placeholder="Ex: Produção, Desenvolvimento..."
                />
              </div>
              <Button 
                type="button"
                onClick={handleSaveToken} 
                disabled={saving || !newToken.token.trim()} 
                className="w-full"
              >
                {saving ? 'Salvando...' : 'Salvar Token'}
              </Button>
            </div>

            <div className="flex items-start gap-2 p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
              <AlertCircle className="h-4 w-4 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
              <div className="text-xs text-blue-800 dark:text-blue-200">
                <strong>Dica:</strong> O token permite coletar métricas reais do provedor. 
                Sem token, serão usadas métricas simuladas para demonstração.
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default ProviderTokenSelect;
