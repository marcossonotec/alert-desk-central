
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Server, Globe, Key, Webhook } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface AddServerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddServer: (serverData: any) => void;
}

const AddServerModal: React.FC<AddServerModalProps> = ({ isOpen, onClose, onAddServer }) => {
  const [formData, setFormData] = useState({
    name: '',
    ip: '',
    webhookUrl: '',
    apiKey: '',
    description: ''
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

    // Simular adição do servidor
    setTimeout(() => {
      onAddServer(formData);
      toast({
        title: "Servidor adicionado com sucesso!",
        description: `${formData.name} está sendo monitorado.`,
      });
      
      // Reset form
      setFormData({
        name: '',
        ip: '',
        webhookUrl: '',
        apiKey: '',
        description: ''
      });
      
      setIsLoading(false);
      onClose();
    }, 1000);
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
          {/* Basic Information */}
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
                  <Label htmlFor="name" className="text-slate-300">Nome do Servidor</Label>
                  <Input
                    id="name"
                    name="name"
                    placeholder="Ex: Web Server 01"
                    value={formData.name}
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
              <div className="space-y-2">
                <Label htmlFor="description" className="text-slate-300">Descrição (Opcional)</Label>
                <Textarea
                  id="description"
                  name="description"
                  placeholder="Descreva a função deste servidor..."
                  value={formData.description}
                  onChange={handleInputChange}
                  className="bg-slate-600/50 border-slate-500 text-white placeholder:text-slate-400"
                  rows={2}
                />
              </div>
            </CardContent>
          </Card>

          {/* Webhook Configuration */}
          <Card className="bg-slate-700/50 border-slate-600">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg text-white flex items-center space-x-2">
                <Webhook className="h-5 w-5 text-purple-400" />
                <span>Configuração de Webhook</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="webhookUrl" className="text-slate-300">URL do Webhook</Label>
                <Input
                  id="webhookUrl"
                  name="webhookUrl"
                  type="url"
                  placeholder="https://seu-webhook.com/alerts"
                  value={formData.webhookUrl}
                  onChange={handleInputChange}
                  className="bg-slate-600/50 border-slate-500 text-white placeholder:text-slate-400"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="apiKey" className="text-slate-300">API Key</Label>
                <div className="relative">
                  <Key className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    id="apiKey"
                    name="apiKey"
                    type="password"
                    placeholder="Sua API key para autenticação"
                    value={formData.apiKey}
                    onChange={handleInputChange}
                    className="bg-slate-600/50 border-slate-500 text-white placeholder:text-slate-400 pl-10"
                    required
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
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
