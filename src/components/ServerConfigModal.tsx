import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Server, Globe, Cloud } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useProviderTokens } from './AddServerModal/useProviderTokens';

interface ServerConfigModalProps {
  server: {
    id: string;
    nome: string;
    ip: string;
    provedor?: string;
    webhook_url?: string;
    provider_token_id?: string;
    status?: string;
    api_key?: string;
  };
  isOpen: boolean;
  onClose: () => void;
  onUpdate: () => void;
}

const provedores = [
  { value: "hetzner", label: "Hetzner Cloud" },
  { value: "aws", label: "Amazon AWS" },
  { value: "digitalocean", label: "DigitalOcean" },
  { value: "vultr", label: "Vultr" },
  { value: "linode", label: "Linode" },
  { value: "outros", label: "Outros" },
];

const statusOptions = [
  { value: "ativo", label: "Ativo" },
  { value: "inativo", label: "Inativo" },
  { value: "manutencao", label: "Manutenção" },
];

const ServerConfigModal: React.FC<ServerConfigModalProps> = ({
  server,
  isOpen,
  onClose,
  onUpdate,
}) => {
  const [formData, setFormData] = useState({
    nome: server.nome || "",
    ip: server.ip || "",
    provedor: server.provedor || 'hetzner',
    provider_token_id: server.provider_token_id || "",
    webhook_url: server.webhook_url || "",
    status: server.status || "ativo",
    api_key: server.api_key || "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [showAddToken, setShowAddToken] = useState(false);
  const { toast } = useToast();

  // Buscar tokens do provedor selecionado
  const { providerTokens, fetchingTokens, refetch } = useProviderTokens(formData.provedor, true);

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
    setShowAddToken(false);
  };

  const handleTokenSelect = (id: string) => {
    setFormData({ ...formData, provider_token_id: id });
  };

  const handleNewToken = () => setShowAddToken(true);

  const handleTokenAdded = async () => {
    setShowAddToken(false);
    await refetch();
  };

  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFormData({ ...formData, status: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { error } = await supabase
        .from('servidores')
        .update({
          nome: formData.nome,
          ip: formData.ip,
          provedor: formData.provedor,
          provider_token_id: formData.provedor !== "outros" ? (formData.provider_token_id || null) : null,
          webhook_url: formData.webhook_url || null,
          status: formData.status,
          data_atualizacao: new Date().toISOString()
        })
        .eq('id', server.id);

      if (error) throw error;

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
        description: "Não foi possível salvar as alterações.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Exclusão
  const [deleting, setDeleting] = useState(false);
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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-card border-border max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2 text-xl text-foreground">
            <Server className="h-6 w-6 text-primary" />
            <span>Configurar Servidor</span>
          </DialogTitle>
          <DialogDescription>
            Edite as informações básicas do servidor. (Webhooks e cadastro de tokens não suportados por este modal. Use a tela inicial para criar servidor.)
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Card className="bg-card/50 border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center space-x-2 text-foreground">
                <Server className="h-5 w-5 text-primary" />
                <span>Informações do Servidor</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="nome" className="text-foreground">Nome do Servidor</Label>
                  <Input
                    id="nome"
                    name="nome"
                    value={formData.nome}
                    onChange={handleInputChange}
                    className="bg-background border-border text-foreground"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ip" className="text-foreground">Endereço IP</Label>
                  <div className="relative">
                    <Globe className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="ip"
                      name="ip"
                      value={formData.ip}
                      onChange={handleInputChange}
                      className="bg-background border-border text-foreground pl-10"
                      required
                    />
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-foreground">Provedor</Label>
                <div className="relative">
                  <Cloud className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground z-10" />
                  <select
                    name="provedor"
                    id="provedor"
                    value={formData.provedor}
                    onChange={e => handleProviderChange(e.target.value)}
                    className="w-full p-2 bg-background border border-border rounded-md text-foreground focus:outline-none focus:ring-2 focus:ring-primary pl-10"
                  >
                    {provedores.map((prov) => (
                      <option key={prov.value} value={prov.value}>{prov.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-foreground">API Key</Label>
                <div className="flex items-center gap-2">
                  <span className="font-mono break-all">{server.api_key || <em>API key não encontrada</em>}</span>
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => {
                      navigator.clipboard.writeText(server.api_key);
                      toast({ title: "API Key copiada!" });
                    }}
                  >Copiar</Button>
                </div>
                <div className="text-xs text-muted-foreground">Copie a chave para uso no agente de monitoramento.</div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="status" className="text-foreground">Status</Label>
                <select
                  id="status"
                  name="status"
                  value={formData.status}
                  onChange={handleStatusChange}
                  className="w-full p-2 bg-background border border-border rounded-md text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  {statusOptions.map((status) => (
                    <option key={status.value} value={status.value}>
                      {status.label}
                    </option>
                  ))}
                </select>
              </div>

            </CardContent>
          </Card>

          <div className="flex justify-between gap-4 pt-4">
            <Button
              type="button"
              variant="destructive"
              onClick={handleDelete}
              disabled={deleting}
              className="flex-none"
            >
              {deleting ? "Excluindo..." : "Excluir Servidor"}
            </Button>
            <div className="flex gap-3 justify-end flex-1">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="border-border text-muted-foreground hover:text-foreground hover:bg-accent"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={isLoading}
                className="bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                {isLoading ? 'Salvando...' : 'Salvar Alterações'}
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ServerConfigModal;
