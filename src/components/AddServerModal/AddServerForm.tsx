
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import AddProviderTokenInline from "../AddProviderTokenInline";
import ServerBasicInfoFields from "./ServerBasicInfoFields";
import { useProviderTokens } from "./useProviderTokens";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface AddServerFormProps {
  onCancel: () => void;
  onAddServer: (serverData: any) => void;
}

const provedores = [
  { value: "hetzner", label: "Hetzner Cloud" },
  { value: "aws", label: "Amazon AWS" },
  { value: "digitalocean", label: "DigitalOcean" },
  { value: "vultr", label: "Vultr" },
  { value: "linode", label: "Linode" },
  { value: "outros", label: "Outros" },
];

const initialState = {
  nome: "",
  ip: "",
  webhook_url: "",
  provedor: "hetzner",
  provider_token_id: "",
};

const AddServerForm: React.FC<AddServerFormProps> = ({ onCancel, onAddServer }) => {
  const [formData, setFormData] = useState(initialState);
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [showAddToken, setShowAddToken] = useState(false);

  const { providerTokens, fetchingTokens, refetch } = useProviderTokens(formData.provedor, true);
  const [autoSelectedTokenId, setAutoSelectedTokenId] = useState<string | null>(null);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleProviderChange = (value: string) => {
    setFormData({ ...formData, provedor: value, provider_token_id: "" });
    setShowAddToken(false);
    setAutoSelectedTokenId(null);
  };

  const handleTokenSelect = (id: string) => {
    setFormData({ ...formData, provider_token_id: id });
    setAutoSelectedTokenId(null);
  };

  const handleNewToken = () => setShowAddToken(true);

  const handleTokenAdded = async (newId?: string) => {
    setShowAddToken(false);
    await refetch();
    if (newId) {
      setFormData(prev => ({ ...prev, provider_token_id: newId }));
      setAutoSelectedTokenId(newId);
    }
  };

  // Para exibir a api_key depois do cadastro
  const [recentApiKey, setRecentApiKey] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: "Erro de autenticação",
          description: "Você precisa estar logado para adicionar servidores.",
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }
      const { data, error } = await supabase
        .from("servidores")
        .insert({
          usuario_id: user.id,
          nome: formData.nome,
          ip: formData.ip,
          provedor: formData.provedor,
          provider_token_id: formData.provider_token_id || null,
          webhook_url: formData.webhook_url || null,
          status: "ativo",
        })
        .select("*")
        .single();

      if (error) throw error;

      setRecentApiKey(data.api_key); // salva API key recém criada
      onAddServer(data);
      toast({
        title: "Servidor adicionado com sucesso!",
        description: `${formData.nome} está sendo monitorado.`,
      });

      setFormData(initialState);
      setAutoSelectedTokenId(null);
      // Não fecha modal automaticamente, mostra chave primeiro
      //onCancel();
    } catch (error: any) {
      toast({
        title: "Erro ao adicionar servidor",
        description: error.message || "Ocorreu um erro inesperado.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {recentApiKey && (
        <div className="bg-green-50 border border-green-500 text-green-800 px-5 py-4 rounded mb-4">
          <div className="font-bold mb-1">API Key criada:</div>
          <div className="flex items-center gap-2">
            <span className="font-mono break-all">{recentApiKey}</span>
            <Button
              type="button"
              size="sm"
              onClick={() => {
                navigator.clipboard.writeText(recentApiKey);
                toast({
                  title: "API Key copiada!",
                  description: "Cole no agente do servidor.",
                });
              }}
              className="ml-2"
            >Copiar</Button>
          </div>
          <div className="text-xs mt-2 text-muted-foreground">
            Use esta chave ao instalar o agente de monitoramento nesse servidor. Salve antes de fechar!
          </div>
          <Button
            type="button"
            className="block mt-4"
            onClick={() => {
              setRecentApiKey(null);
              onCancel(); // fecha o modal após visualizar/copiar
            }}
          >
            Fechar
          </Button>
        </div>
      )}

      {!recentApiKey && (
        <>
          <ServerBasicInfoFields
            formData={formData}
            provedores={provedores}
            providerTokens={providerTokens}
            fetchingTokens={fetchingTokens}
            showAddToken={showAddToken}
            onInputChange={handleInputChange}
            onProviderChange={handleProviderChange}
            onTokenSelect={handleTokenSelect}
            onNewToken={handleNewToken}
            onTokenAdded={handleTokenAdded}
          />
          <div className="flex justify-end space-x-4">
            <Button type="button" variant="outline" onClick={onCancel} className="border-border hover:bg-accent">
              Cancelar
            </Button>
            <Button type="submit" className="bg-primary text-primary-foreground hover:bg-primary/90" disabled={isLoading}>
              {isLoading ? "Adicionando..." : "Adicionar Servidor"}
            </Button>
          </div>
        </>
      )}
    </form>
  );
};

export default AddServerForm;
