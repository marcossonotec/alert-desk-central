
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
    provedor: 'hetzner'
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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
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
          webhook_url: formData.webhook_url,
          api_key: formData.api_key,
          provedor: formData.provedor,
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
      
      // Reset form
      setFormData({
        nome: '',
        ip: '',
        webhook_url: '',
        api_key: '',
        provedor: 'hetzner'
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
          {/* Informações Básicas */}
          <Card className="bg-card/50 border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center space-x-2">
                <Server className="h-5 w-5 text-primary" />
                <span>Informações Básicas</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="nome" className="text-foreground">Nome do Servidor</Label>
                  <Input
                    id="nome"
                    name="nome"
                    placeholder="Ex: Servidor Web 01"
                    value={formData.nome}
                    onChange={handleInputChange}
                    className="bg-background border-border"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ip" className="text-foreground">IP do Servidor</Label>
                  <div className="relative">
                    <Globe className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="ip"
                      name="ip"
                      placeholder="192.168.1.100"
                      value={formData.ip}
                      onChange={handleInputChange}
                      className="bg-background border-border pl-10"
                      required
                    />
                  </div>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="provedor" className="text-foreground">Provedor</Label>
                <div className="relative">
                  <Cloud className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground z-10" />
                  <Select value={formData.provedor} onValueChange={(value) => setFormData({ ...formData, provedor: value })}>
                    <SelectTrigger className="bg-background border-border pl-10">
                      <SelectValue placeholder="Selecione o provedor" />
                    </SelectTrigger>
                    <SelectContent>
                      {provedores.map((provedor) => (
                        <SelectItem key={provedor.value} value={provedor.value}>
                          {provedor.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Configuração de Webhook */}
          <Card className="bg-card/50 border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center space-x-2">
                <Webhook className="h-5 w-5 text-purple-500" />
                <span>Configuração de Webhook</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="webhook_url" className="text-foreground">URL do Webhook</Label>
                <Input
                  id="webhook_url"
                  name="webhook_url"
                  type="url"
                  placeholder="https://seu-webhook.com/alerts"
                  value={formData.webhook_url}
                  onChange={handleInputChange}
                  className="bg-background border-border"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="api_key" className="text-foreground">API Key</Label>
                <div className="relative">
                  <Key className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="api_key"
                    name="api_key"
                    type="password"
                    placeholder="Sua API key para autenticação"
                    value={formData.api_key}
                    onChange={handleInputChange}
                    className="bg-background border-border pl-10"
                    required
                  />
                </div>
              </div>
            </CardContent>
          </Card>

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
