
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
      <DialogContent className="bg-slate-800 border-slate-700 text-white">
        <DialogHeader>
          <DialogTitle>Configurar Servidor</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="nome">Nome do Servidor</Label>
            <Input
              id="nome"
              value={formData.nome}
              onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
              className="bg-slate-700 border-slate-600 text-white"
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="ip">Endereço IP</Label>
            <Input
              id="ip"
              value={formData.ip}
              onChange={(e) => setFormData({ ...formData, ip: e.target.value })}
              className="bg-slate-700 border-slate-600 text-white"
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="provedor">Provedor</Label>
            <select
              id="provedor"
              value={formData.provedor}
              onChange={(e) => setFormData({ ...formData, provedor: e.target.value })}
              className="w-full p-2 bg-slate-700 border border-slate-600 rounded-md text-white"
            >
              <option value="hetzner">Hetzner Cloud</option>
              <option value="aws">Amazon AWS</option>
              <option value="digitalocean">DigitalOcean</option>
              <option value="vultr">Vultr</option>
              <option value="outros">Outros</option>
            </select>
          </div>
          
          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="border-slate-600 text-slate-300"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isLoading ? 'Salvando...' : 'Salvar'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ServerConfigModal;
