import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Server, Globe, Key, Webhook, Cloud } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import AddProviderTokenInline from "./AddProviderTokenInline";
import ServerBasicInfoFields from "./AddServerModal/ServerBasicInfoFields";
import ServerApiKeyField from "./AddServerModal/ServerApiKeyField";

interface AddServerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddServer: (serverData: any) => void;
}

const AddServerModal: React.FC<AddServerModalProps> = ({ isOpen, onClose, onAddServer }) => {
  const [formData, setFormData] = useState({
    nome: '',
    ip: '',
    webhook_url: '',
    api_key: '',
    provedor: 'hetzner',
    provider_token_id: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const provedores = [
    { value: 'hetzner', label: 'Hetzner Cloud' },
    { value: 'aws', label: 'Amazon AWS' },
    { value: 'digitalocean', label: 'DigitalOcean' },
    { value: 'vultr', label: 'Vultr' },
    { value: 'linode', label: 'Linode' },
    { value: 'outros', label: 'Outros' },
  ];

  const [providerTokens, setProviderTokens] = useState<any[]>([]);
  const [showAddToken, setShowAddToken] = useState(false);
  const [fetchingTokens, setFetchingTokens] = useState(false);

  // Busca tokens sempre que mudar provedor ou abrir modal
  React.useEffect(() => {
    if (!isOpen) return;
    async function fetchTokens() {
      setFetchingTokens(true);
      const { data, error } = await supabase
        .from("provider_tokens")
        .select("*")
        .eq("provider", formData.provedor)
        .order("created_at", { ascending: false });
      setProviderTokens(data || []);
      setFetchingTokens(false);
    }
    fetchTokens();
    // eslint-disable-next-line
  }, [formData.provedor, isOpen]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleProviderChange = (value: string) => {
    setFormData({ ...formData, provedor: value, provider_token_id: '' });
    setShowAddToken(false);
  };

  const handleTokenSelect = (id: string) => {
    setFormData({ ...formData, provider_token_id: id });
  };

  const handleNewToken = () => {
    setShowAddToken(true);
  };

  const handleTokenAdded = async () => {
    setShowAddToken(false);
    // Recarrega tokens
    setFetchingTokens(true);
    const { data } = await supabase
      .from("provider_tokens")
      .select("*")
      .eq("provider", formData.provedor)
      .order("created_at", { ascending: false });
    setProviderTokens(data || []);
    setFetchingTokens(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        toast({
          title: "Erro de autenticação",
          description: "Você precisa estar logado para adicionar servidores.",
          variant: "destructive"
        });
        return;
      }

      const { data, error } = await supabase
        .from('servidores')
        .insert({
          usuario_id: user.id,
          nome: formData.nome,
          ip: formData.ip,
          api_key: formData.api_key,
          provedor: formData.provedor,
          provider_token_id: formData.provider_token_id || null,
          status: 'ativo'
        })
        .select()
        .single();

      if (error) {
        throw error;
      }

      onAddServer(data);
      toast({
        title: "Servidor adicionado com sucesso!",
        description: `${formData.nome} está sendo monitorado.`,
      });

      setFormData({
        nome: '',
        ip: '',
        webhook_url: '',
        api_key: '',
        provedor: 'hetzner',
        provider_token_id: ''
      });

      onClose();
    } catch (error: any) {
      console.error('Erro ao adicionar servidor:', error);
      toast({
        title: "Erro ao adicionar servidor",
        description: error.message || "Ocorreu um erro inesperado.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-card border-border max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2 text-xl">
            <Server className="h-6 w-6 text-primary" />
            <span>Adicionar Novo Servidor</span>
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Configure um novo servidor para monitoramento em tempo real
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
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

          <ServerApiKeyField
            apiKeyValue={formData.api_key}
            onInputChange={handleInputChange}
          />

          {/* Botões de Ação */}
          <div className="flex justify-end space-x-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="border-border hover:bg-accent"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              className="bg-primary text-primary-foreground hover:bg-primary/90"
              disabled={isLoading}
            >
              {isLoading ? "Adicionando..." : "Adicionar Servidor"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddServerModal;
