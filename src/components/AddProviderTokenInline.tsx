
import React, { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

interface AddProviderTokenInlineProps {
  provider: string;
  onSuccess: () => void;
}

const AddProviderTokenInline: React.FC<AddProviderTokenInlineProps> = ({ provider, onSuccess }) => {
  const [token, setToken] = useState("");
  const [nickname, setNickname] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.from("provider_tokens").insert({
      provider,
      token,
      nickname
    });
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
      onSuccess();
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
      />
      <Input
        placeholder="Apelido do token (opcional)"
        value={nickname}
        onChange={e => setNickname(e.target.value)}
      />
      <Button type="submit" disabled={loading || !token}>
        {loading ? "Salvando..." : "Cadastrar Token"}
      </Button>
    </form>
  );
};

export default AddProviderTokenInline;
