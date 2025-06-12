
import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Server, Globe } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface ServerConfigModalProps {
  server: {
    id: string;
    name: string;
    ip: string;
    provedor?: string;
  };
  isOpen: boolean;
  onClose: () => void;
  onUpdate: () => void;
}

const ServerConfigModal: React.FC<ServerConfigModalProps> = ({
  server,
  isOpen,
  onClose,
  onUpdate,
}) => {
  const [formData, setFormData] = useState({
    nome: server.name,
    ip: server.ip,
    provedor: server.provedor || 'hetzner',
  });
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    setFormData({
      nome: server.name,
      ip: server.ip,
      provedor: server.provedor || 'hetzner',
    });
  }, [server]);

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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-card border-border max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2 text-xl text-foreground">
            <Server className="h-6 w-6 text-primary" />
            <span>Configurar Servidor</span>
          </DialogTitle>
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
                    value={formData.nome}
                    onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
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
                      value={formData.ip}
                      onChange={(e) => setFormData({ ...formData, ip: e.target.value })}
                      className="bg-background border-border text-foreground pl-10"
                      required
                    />
                  </div>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="provedor" className="text-foreground">Provedor</Label>
                <select
                  id="provedor"
                  value={formData.provedor}
                  onChange={(e) => setFormData({ ...formData, provedor: e.target.value })}
                  className="w-full p-2 bg-background border border-border rounded-md text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="hetzner">Hetzner Cloud</option>
                  <option value="aws">Amazon AWS</option>
                  <option value="digitalocean">DigitalOcean</option>
                  <option value="vultr">Vultr</option>
                  <option value="linode">Linode</option>
                  <option value="outros">Outros</option>
                </select>
              </div>
            </CardContent>
          </Card>
          
          <div className="flex justify-end gap-3 pt-4">
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
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ServerConfigModal;
