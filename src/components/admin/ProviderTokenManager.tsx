
import React, { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Trash2, Plus, AlertCircle, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";

type TokenItem = {
  id: string;
  provider: string;
  token: string;
  nickname?: string;
  created_at?: string;
};

const PROVIDERS = [
  { value: "hetzner", label: "Hetzner Cloud" },
  // Novos provedores poderão ser adicionados aqui
];

const ProviderTokenManager = () => {
  const [tokens, setTokens] = useState<TokenItem[]>([]);
  const [provider, setProvider] = useState(PROVIDERS[0].value);
  const [token, setToken] = useState("");
  const [nickname, setNickname] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingTokens, setLoadingTokens] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();
  const { toast } = useToast();

  console.log('ProviderTokenManager render:', { user: user?.id, tokens: tokens.length });

  const loadTokens = async () => {
    if (!user?.id) {
      console.log('Usuário não autenticado, não carregando tokens');
      setTokens([]);
      setLoadingTokens(false);
      return;
    }

    setLoadingTokens(true);
    setError(null);
    
    try {
      console.log('Carregando tokens para usuário:', user.id);
      
      const { data, error } = await supabase
        .from("provider_tokens")
        .select("*")
        .eq("usuario_id", user.id)
        .order("created_at", { ascending: false });

      if (error) {
        console.error('Erro ao carregar tokens:', error);
        throw error;
      }

      console.log('Tokens carregados:', data?.length || 0);
      setTokens(data || []);
    } catch (error: any) {
      console.error('Erro inesperado ao carregar tokens:', error);
      setError(error.message);
      toast({
        title: "Erro ao carregar tokens",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoadingTokens(false);
    }
  };

  useEffect(() => {
    if (user?.id) {
      loadTokens();
    } else {
      setTokens([]);
      setLoadingTokens(false);
    }
  }, [user?.id]);

  const handleAddToken = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user?.id) {
      toast({
        title: "Usuário não autenticado",
        variant: "destructive",
      });
      return;
    }

    if (!token.trim()) {
      toast({
        title: "Token é obrigatório",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      console.log('Adicionando token:', { provider, nickname: nickname || 'sem nome', usuario_id: user.id });
      
      const { error } = await supabase.from("provider_tokens").insert({
        usuario_id: user.id,
        provider,
        token: token.trim(),
        nickname: nickname.trim() || null,
      });

      if (error) {
        console.error('Erro ao inserir token:', error);
        throw error;
      }

      toast({ title: "Token adicionado com sucesso!" });
      setToken("");
      setNickname("");
      loadTokens();
    } catch (error: any) {
      console.error('Erro inesperado ao adicionar token:', error);
      toast({
        title: "Erro ao adicionar token",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteToken = async (id: string) => {
    if (!user?.id) {
      toast({
        title: "Usuário não autenticado",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      console.log('Removendo token:', id);
      
      const { error } = await supabase
        .from("provider_tokens")
        .delete()
        .eq("id", id)
        .eq("usuario_id", user.id); // Garantir que só pode deletar seus próprios tokens

      if (error) {
        console.error('Erro ao remover token:', error);
        throw error;
      }

      toast({ title: "Token removido com sucesso!" });
      setTokens(tokens.filter(t => t.id !== id));
    } catch (error: any) {
      console.error('Erro inesperado ao remover token:', error);
      toast({
        title: "Erro ao remover token",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="max-w-xl mx-auto space-y-8">
        <Card className="bg-card border-border">
          <CardContent className="p-6">
            <div className="flex items-center justify-center gap-2 text-muted-foreground">
              <AlertCircle className="h-5 w-5" />
              <span>Você precisa estar logado para gerenciar tokens</span>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto space-y-8">
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle>Adicionar Token de Provedor</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAddToken} className="grid gap-3">
            <div>
              <label className="text-sm mb-1 block">Provedor</label>
              <select
                className="w-full border rounded-md px-3 py-2 text-base"
                value={provider}
                onChange={e => setProvider(e.target.value)}
                required
              >
                {PROVIDERS.map((p) => (
                  <option key={p.value} value={p.value}>{p.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm mb-1 block">Token</label>
              <Input
                type="text"
                placeholder="Coloque seu Access Token aqui"
                value={token}
                onChange={e => setToken(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="text-sm mb-1 block">Apelido (opcional)</label>
              <Input
                type="text"
                placeholder="Ex: Hetzner Prod, ..."
                value={nickname}
                onChange={e => setNickname(e.target.value)}
              />
            </div>
            <Button type="submit" className="mt-2" disabled={loading || !token}>
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Adicionando...
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4 mr-2" />
                  Adicionar Token
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle>Tokens Cadastrados</CardTitle>
        </CardHeader>
        <CardContent>
          {loadingTokens && (
            <div className="flex items-center justify-center gap-2 py-4">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Carregando tokens...</span>
            </div>
          )}
          
          {error && (
            <div className="flex items-start gap-2 p-3 bg-red-50 dark:bg-red-950/20 rounded-lg mb-4">
              <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
              <div className="text-xs text-red-800 dark:text-red-200">
                <strong>Erro:</strong> {error}
              </div>
            </div>
          )}
          
          {!loadingTokens && !error && tokens.length === 0 && (
            <div className="text-center text-muted-foreground">Nenhum token cadastrado.</div>
          )}
          
          {!loadingTokens && tokens.length > 0 && (
            <ul className="space-y-2 mt-2">
              {tokens.map(tokenObj => (
                <li
                  key={tokenObj.id}
                  className="flex items-center gap-2 bg-muted p-2 rounded"
                >
                  <Badge>
                    {PROVIDERS.find(p => p.value === tokenObj.provider)?.label || tokenObj.provider}
                  </Badge>
                  <span className="truncate max-w-[120px]">{tokenObj.nickname || "sem apelido"}</span>
                  <span className="text-xs text-muted-foreground truncate max-w-[100px]">
                    {tokenObj.token.slice(0, 5)}...{tokenObj.token.slice(-5)}
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="text-red-500 hover:text-red-700 ml-auto"
                    onClick={() => handleDeleteToken(tokenObj.id)}
                    disabled={loading}
                  >
                    {loading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Trash2 className="w-4 h-4" />
                    )}
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ProviderTokenManager;
