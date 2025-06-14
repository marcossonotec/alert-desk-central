
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import ServerBasicInfoFields from "./ServerBasicInfoFields";
import ProviderTokenSelect from "./ProviderTokenSelect";

interface AddServerFormProps {
  onCancel: () => void;
  onAddServer: (serverData: any) => void;
}

const AddServerForm: React.FC<AddServerFormProps> = ({ onCancel, onAddServer }) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    nome: "",
    ip: "",
    provedor: "hetzner",
    provider_token_id: undefined as string | undefined,
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Reset token when provider changes
    if (field === 'provedor') {
      setFormData(prev => ({ ...prev, provider_token_id: undefined }));
    }
  };

  const handleTokenSelect = (tokenId: string | undefined) => {
    setFormData(prev => ({ ...prev, provider_token_id: tokenId }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast({ title: "Usuário não autenticado", variant: "destructive" });
      return;
    }

    setIsLoading(true);
    
    try {
      const serverData = {
        nome: formData.nome,
        ip: formData.ip,
        provedor: formData.provedor,
        provider_token_id: formData.provider_token_id || null,
        usuario_id: user.id,
        status: 'ativo'
      };

      const { data, error } = await supabase
        .from('servidores')
        .insert(serverData)
        .select()
        .single();

      if (error) throw error;

      toast({ title: "Servidor adicionado com sucesso!" });
      onAddServer(data);
    } catch (error: any) {
      console.error('Erro ao adicionar servidor:', error);
      toast({ 
        title: "Erro ao adicionar servidor", 
        description: error.message,
        variant: "destructive" 
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <ServerBasicInfoFields
        formData={formData}
        onInputChange={handleInputChange}
      />

      <ProviderTokenSelect
        provedor={formData.provedor}
        selectedTokenId={formData.provider_token_id}
        onTokenSelect={handleTokenSelect}
      />

      <div className="flex justify-end gap-3 pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          className="border-border text-muted-foreground hover:text-foreground hover:bg-accent"
        >
          Cancelar
        </Button>
        <Button
          type="submit"
          disabled={isLoading}
          className="bg-primary hover:bg-primary/90 text-primary-foreground"
        >
          {isLoading ? 'Adicionando...' : 'Adicionar Servidor'}
        </Button>
      </div>
    </form>
  );
};

export default AddServerForm;
