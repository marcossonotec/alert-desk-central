
import React, { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

interface AddProviderTokenInlineProps {
  provider: string;
  onSuccess: (newTokenId?: string) => void;
}

const AddProviderTokenInline: React.FC<AddProviderTokenInlineProps> = ({ provider, onSuccess }) => {
  const [token, setToken] = useState("");
  const [nickname, setNickname] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Obtém usuário autenticado para capturar o usuario_id
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (!user) {
      toast({
        title: "Erro de autenticação",
        description: "Você precisa estar logado para adicionar tokens.",
        variant: "destructive"
      });
      setLoading(false);
      return;
    }

    const { data, error } = await supabase.from("provider_tokens").insert({
      provider,
      token,
      nickname,
      usuario_id: user.id
    }).select('id').single();

    if (error) {
      toast({
        title: "Erro ao adicionar token",
        description: error.message,
        variant: "destructive"
      });
    } else {
      toast({ title: "Token salvo com sucesso!" });
      setToken("");
      setNickname("");
      // Retorna o id para seleção automática
      onSuccess(data?.id);
    }
    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-2">
      <Input
        placeholder="Access Token"
        value={token}
        onChange={e => setToken(e.target.value)}
        required
        autoFocus
      />
      <Input
        placeholder="Apelido do token (opcional)"
        value={nickname}
        onChange={e => setNickname(e.target.value)}
      />
      <Button type="submit" disabled={loading || !token} className="w-full">
        {loading ? "Salvando..." : "Cadastrar Token"}
      </Button>
    </form>
  );
};

export default AddProviderTokenInline;
