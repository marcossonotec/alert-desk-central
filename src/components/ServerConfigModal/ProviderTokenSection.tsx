
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Key, AlertCircle, ExclamationTriangleIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useProviderTokens } from '../AddServerModal/useProviderTokens';

interface ProviderTokenSectionProps {
  provedor: string;
  selectedTokenId?: string;
  onTokenSelect: (tokenId: string | undefined) => void;
}

const ProviderTokenSection: React.FC<ProviderTokenSectionProps> = ({
  provedor,
  selectedTokenId,
  onTokenSelect,
}) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const { tokens, isLoading, error, refetch } = useProviderTokens(provedor);
  const [showNewTokenForm, setShowNewTokenForm] = useState(false);
  const [newToken, setNewToken] = useState({ token: '', nickname: '' });
  const [saving, setSaving] = useState(false);

  const handleCreateToken = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newToken.token.trim() || !user) {
      toast({ title: "Token é obrigatório", variant: "destructive" });
      return;
    }

    setSaving(true);
    try {
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

      if (error) throw error;

      toast({ title: "Token salvo com sucesso!" });
      onTokenSelect(data.id);
      setNewToken({ token: '', nickname: '' });
      setShowNewTokenForm(false);
      refetch();
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
      <div className="text-sm text-muted-foreground">
        Para servidores "outros", a coleta será feita via agente instalado no servidor.
      </div>
    );
  }

  if (error) {
    return (
      <Card className="bg-card/50 border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center space-x-2 text-foreground">
            <ExclamationTriangleIcon className="h-5 w-5 text-red-500" />
            <span>Erro ao carregar tokens</span>
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
          <div className="text-sm text-muted-foreground">Carregando tokens...</div>
        ) : (
          <>
            {tokens.length > 0 && (
              <div className="space-y-2">
                <Label>Selecionar token existente</Label>
                <Select value={selectedTokenId || ""} onValueChange={onTokenSelect}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um token..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Nenhum token selecionado</SelectItem>
                    {tokens.map((token) => (
                      <SelectItem key={token.id} value={token.id}>
                        {token.nickname} ({token.token.substring(0, 8)}...)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {!showNewTokenForm ? (
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowNewTokenForm(true)}
                className="w-full"
              >
                <Plus className="h-4 w-4 mr-2" />
                {tokens.length === 0 ? 'Adicionar Token' : 'Criar Novo Token'}
              </Button>
            ) : (
              <form onSubmit={handleCreateToken} className="space-y-3">
                <div className="space-y-2">
                  <Label htmlFor="token">Token da API</Label>
                  <Input
                    id="token"
                    type="password"
                    value={newToken.token}
                    onChange={(e) => setNewToken({ ...newToken, token: e.target.value })}
                    placeholder={`Cole aqui seu token da API ${provedor}`}
                    required
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
                <div className="flex gap-2">
                  <Button type="submit" disabled={saving} className="flex-1">
                    {saving ? 'Salvando...' : 'Salvar Token'}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowNewTokenForm(false);
                      setNewToken({ token: '', nickname: '' });
                    }}
                  >
                    Cancelar
                  </Button>
                </div>
              </form>
            )}

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

export default ProviderTokenSection;
