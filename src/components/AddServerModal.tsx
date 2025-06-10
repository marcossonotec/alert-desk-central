
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Server, Globe, Key, Webhook } from 'lucide-react';
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
      <DialogContent className="bg-slate-800 border-slate-700 text-white max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2 text-xl">
            <Server className="h-6 w-6 text-blue-400" />
            <span>Adicionar Novo Servidor</span>
          </DialogTitle>
          <DialogDescription className="text-slate-400">
            Configure um novo servidor para monitoramento em tempo real
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Informações Básicas */}
          <Card className="bg-slate-700/50 border-slate-600">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg text-white flex items-center space-x-2">
                <Server className="h-5 w-5 text-blue-400" />
                <span>Informações Básicas</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="nome" className="text-slate-300">Nome do Servidor</Label>
                  <Input
                    id="nome"
                    name="nome"
                    placeholder="Ex: Servidor Web 01"
                    value={formData.nome}
                    onChange={handleInputChange}
                    className="bg-slate-600/50 border-slate-500 text-white placeholder:text-slate-400"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ip" className="text-slate-300">IP do Servidor</Label>
                  <div className="relative">
                    <Globe className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input
                      id="ip"
                      name="ip"
                      placeholder="192.168.1.100"
                      value={formData.ip}
                      onChange={handleInputChange}
                      className="bg-slate-600/50 border-slate-500 text-white placeholder:text-slate-400 pl-10"
                      required
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Configuração de Webhook */}
          <Card className="bg-slate-700/50 border-slate-600">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg text-white flex items-center space-x-2">
                <Webhook className="h-5 w-5 text-purple-400" />
                <span>Configuração de Webhook</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="webhook_url" className="text-slate-300">URL do Webhook</Label>
                <Input
                  id="webhook_url"
                  name="webhook_url"
                  type="url"
                  placeholder="https://seu-webhook.com/alerts"
                  value={formData.webhook_url}
                  onChange={handleInputChange}
                  className="bg-slate-600/50 border-slate-500 text-white placeholder:text-slate-400"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="api_key" className="text-slate-300">API Key</Label>
                <div className="relative">
                  <Key className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    id="api_key"
                    name="api_key"
                    type="password"
                    placeholder="Sua API key para autenticação"
                    value={formData.api_key}
                    onChange={handleInputChange}
                    className="bg-slate-600/50 border-slate-500 text-white placeholder:text-slate-400 pl-10"
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
              className="border-slate-600 text-slate-300 hover:bg-slate-700"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 text-white"
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
