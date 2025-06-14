
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

  console.log('AddServerForm render:', { 
    user: user?.id, 
    formData,
    isLoading 
  });

  const handleInputChange = (field: string, value: string) => {
    console.log('Field change:', field, value);
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Reset token when provider changes
    if (field === 'provedor') {
      setFormData(prev => ({ ...prev, provider_token_id: undefined }));
    }
  };

  const handleTokenSelect = (tokenId: string | undefined) => {
    console.log('Token selected:', tokenId);
    setFormData(prev => ({ ...prev, provider_token_id: tokenId }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    console.log('Submitting form:', formData);
    
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

      console.log('Inserting server data:', serverData);

      const { data, error } = await supabase
        .from('servidores')
        .insert(serverData)
        .select()
        .single();

      if (error) {
        console.error('Error inserting server:', error);
        throw error;
      }

      console.log('Server created successfully:', data);
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

  // Render com tratamento de erro
  try {
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
  } catch (error) {
    console.error('Erro no render AddServerForm:', error);
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
        <p className="text-red-800">Erro ao carregar formulário de servidor.</p>
        <Button variant="outline" onClick={onCancel} className="mt-2">
          Fechar
        </Button>
      </div>
    );
  }
};

export default AddServerForm;
