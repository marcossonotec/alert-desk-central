
import React, { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Trash2, Plus } from "lucide-react";
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
  const { user } = useAuth();
  const { toast } = useToast();

  const loadTokens = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("provider_tokens")
      .select("*")
      .order("created_at", { ascending: false });
    setTokens(data || []);
    setLoading(false);

    if (error) {
      toast({
        title: "Erro ao carregar tokens",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    loadTokens();
    // eslint-disable-next-line
  }, []);

  const handleAddToken = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.from("provider_tokens").insert({
      usuario_id: user?.id,
      provider,
      token,
      nickname,
    });
    if (error) {
      toast({
        title: "Erro ao adicionar token",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({ title: "Token adicionado com sucesso!" });
      setToken("");
      setNickname("");
      loadTokens();
    }
    setLoading(false);
  };

  const handleDeleteToken = async (id: string) => {
    setLoading(true);
    const { error } = await supabase.from("provider_tokens").delete().eq("id", id);
    if (error) {
      toast({
        title: "Erro ao remover token",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({ title: "Token removido com sucesso!" });
      setTokens(tokens.filter(t => t.id !== id));
    }
    setLoading(false);
  };

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
                placeholder="Ex: Hetzner Prod, ...
                "
                value={nickname}
                onChange={e => setNickname(e.target.value)}
              />
            </div>
            <Button type="submit" className="mt-2" disabled={loading || !token}>
              <Plus className="w-4 h-4 mr-2" />
              {loading ? "Adicionando..." : "Adicionar Token"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle>Tokens Cadastrados</CardTitle>
        </CardHeader>
        <CardContent>
          {loading && <p>Carregando...</p>}
          {!loading && tokens.length === 0 && (
            <div className="text-center text-muted-foreground">Nenhum token cadastrado.</div>
          )}
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
                  <Trash2 className="w-4 h-4" />
                </Button>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProviderTokenManager;
