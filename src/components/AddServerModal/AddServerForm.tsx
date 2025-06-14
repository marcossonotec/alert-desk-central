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

  const [recentApiKey, setRecentApiKey] = useState<string | null>(null);

  // Nova flag para status intermediário
  const [creatingToken, setCreatingToken] = useState(false);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setIsLoading(true);

    try {
      // Autenticação usuário
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

      let finalProviderTokenId = formData.provider_token_id;

      // Se provedor diferente de "outros" E não há token selecionado, cadastrar token inline antes de criar servidor
      if (formData.provedor !== "outros" && !finalProviderTokenId) {
        setCreatingToken(true);

        // Pega o valor de um novo token/nickname do formData (criaremos os campos abaixo)
        const tokenValue = formData.__new_provider_token_value || "";
        const nicknameValue = formData.__new_provider_token_nickname || "";

        if (!tokenValue) {
          toast({
            title: "Token do provedor é obrigatório",
            description: "Preencha o token antes de adicionar o servidor.",
            variant: "destructive",
          });
          setCreatingToken(false);
          setIsLoading(false);
          return;
        }

        // Criação do token no Supabase
        const { data: dataToken, error: tokenError } = await supabase.from("provider_tokens").insert({
          provider: formData.provedor,
          token: tokenValue,
          nickname: nicknameValue,
          usuario_id: user.id
        }).select('id').single();

        if (tokenError) {
          toast({
            title: "Erro ao cadastrar token",
            description: tokenError.message,
            variant: "destructive",
          });
          setCreatingToken(false);
          setIsLoading(false);
          return;
        }
        finalProviderTokenId = dataToken?.id;
      }

      // Cadastro do servidor (com ou sem token, dependendo do provedor)
      const { data, error } = await supabase
        .from("servidores")
        .insert({
          usuario_id: user.id,
          nome: formData.nome,
          ip: formData.ip,
          provedor: formData.provedor,
          provider_token_id: finalProviderTokenId || null,
          webhook_url: formData.webhook_url || null,
          status: "ativo",
        })
        .select("*")
        .single();

      if (error) throw error;

      setRecentApiKey(data.api_key);
      onAddServer(data);
      toast({
        title: "Servidor adicionado com sucesso!",
        description: `${formData.nome} está sendo monitorado.`,
      });

      setFormData(initialState);
      setAutoSelectedTokenId(null);

      // Limpa campos de novo token, se algum
      setCreatingToken(false);

    } catch (error: any) {
      toast({
        title: "Erro ao adicionar servidor",
        description: error.message || "Ocorreu um erro inesperado.",
        variant: "destructive",
      });
      setCreatingToken(false);
    } finally {
      setIsLoading(false);
    }
  };

  // Função para tratar input especial dos campos de token do provedor inline
  const handleProviderTokenInput = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setFormData({ ...formData, __new_provider_token_value: e.target.value });
  };
  const handleProviderTokenNickname = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setFormData({ ...formData, __new_provider_token_nickname: e.target.value });
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
            onNewToken={() => {}} // desabilitado, pois o fluxo é automático
            onTokenAdded={handleTokenAdded}
            onProviderTokenInput={handleProviderTokenInput}
            onProviderTokenNickname={handleProviderTokenNickname}
          />

          {/* Caso necessário cadastrar token inline, mostra campos apropriados */}
          {formData.provedor !== "outros" && providerTokens.length === 0 && (
            <div className="space-y-1 mt-2">
              <input
                type="text"
                placeholder="Access Token do provedor"
                className="w-full border rounded px-3 py-2"
                value={formData.__new_provider_token_value || ""}
                onChange={handleProviderTokenInput}
                required
              />
              <input
                type="text"
                placeholder="Apelido do token (opcional)"
                className="w-full border rounded px-3 py-2"
                value={formData.__new_provider_token_nickname || ""}
                onChange={handleProviderTokenNickname}
              />
            </div>
          )}

          <div className="flex justify-end space-x-4">
            <Button type="button" variant="outline" onClick={onCancel} className="border-border hover:bg-accent">
              Cancelar
            </Button>
            <Button
              type="submit"
              className="bg-primary text-primary-foreground hover:bg-primary/90"
              disabled={isLoading || creatingToken}
            >
              {(isLoading || creatingToken) ? "Adicionando..." : "Adicionar Servidor"}
            </Button>
          </div>
        </>
      )}
    </form>
  );
};

export default AddServerForm;
