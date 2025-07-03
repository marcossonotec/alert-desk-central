
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Server {
  id: string;
  nome: string;
  ip: string;
  provedor?: string;
  webhook_url?: string;
  provider_token_id?: string;
  status?: string;
  api_key?: string;
}

interface FormData {
  nome: string;
  ip: string;
  provedor: string;
  provider_token_id: string;
  webhook_url: string;
  status: string;
  api_key: string;
}

export const useServerConfigForm = (server: Server, onUpdate: () => void, onClose: () => void) => {
  const [formData, setFormData] = useState<FormData>({
    nome: server.nome || "",
    ip: server.ip || "",
    provedor: server.provedor || 'hetzner',
    provider_token_id: server.provider_token_id || "",
    webhook_url: server.webhook_url || "",
    status: server.status || "ativo",
    api_key: server.api_key || "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    setFormData({
      nome: server.nome || "",
      ip: server.ip || "",
      provedor: server.provedor || 'hetzner',
      provider_token_id: server.provider_token_id || "",
      webhook_url: server.webhook_url || "",
      status: server.status || "ativo",
      api_key: server.api_key || "",
    });
  }, [server]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleProviderChange = (value: string) => {
    setFormData({ ...formData, provedor: value, provider_token_id: "" });
  };

  const handleTokenSelect = (id: string) => {
    setFormData({ ...formData, provider_token_id: id });
  };

  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFormData({ ...formData, status: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      console.log('Atualizando servidor:', { formData, serverId: server.id });
      
      const updateData = {
        nome: formData.nome,
        ip: formData.ip,
        provedor: formData.provedor,
        provider_token_id: formData.provedor !== "outros" ? (formData.provider_token_id || null) : null,
        webhook_url: formData.webhook_url || null,
        status: formData.status,
        data_atualizacao: new Date().toISOString()
      };

      console.log('Dados para atualização:', updateData);

      const { error } = await supabase
        .from('servidores')
        .update(updateData)
        .eq('id', server.id);

      if (error) {
        console.error('Erro do Supabase:', error);
        throw error;
      }

      console.log('Servidor atualizado com sucesso');
      
      toast({
        title: "Servidor atualizado",
        description: "As configurações do servidor foram salvas com sucesso.",
      });

      onUpdate();
      onClose();
    } catch (error: any) {
      console.error('Erro ao atualizar servidor:', error);
      toast({
        title: "Erro ao atualizar servidor",
        description: error.message || "Não foi possível salvar as alterações.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("Tem certeza que deseja excluir este servidor? Esta ação não pode ser desfeita.")) return;
    setDeleting(true);
    try {
      const { error } = await supabase
        .from('servidores')
        .delete()
        .eq('id', server.id);

      if (error) throw error;

      toast({
        title: "Servidor excluído",
        description: "O servidor foi removido com sucesso.",
      });
      onUpdate();
      onClose();
    } catch (error: any) {
      toast({
        title: "Erro ao excluir servidor",
        description: "Não foi possível remover o servidor.",
        variant: "destructive"
      });
    } finally {
      setDeleting(false);
    }
  };

  return {
    formData,
    isLoading,
    deleting,
    handleInputChange,
    handleProviderChange,
    handleTokenSelect,
    handleStatusChange,
    handleSubmit,
    handleDelete,
  };
};
