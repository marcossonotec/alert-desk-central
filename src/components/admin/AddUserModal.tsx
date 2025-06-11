
import React, { useState } from 'react';
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

interface AddUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUserAdded: () => void;
}

const AddUserModal: React.FC<AddUserModalProps> = ({
  isOpen,
  onClose,
  onUserAdded,
}) => {
  const [formData, setFormData] = useState({
    email: '',
    nome_completo: '',
    empresa: '',
    telefone: '',
    whatsapp: '',
    plano_ativo: 'free',
  });
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Cadastrar usuário na autenticação
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: 'temp123456', // Senha temporária que deve ser alterada
        options: {
          data: {
            nome_completo: formData.nome_completo,
            empresa: formData.empresa,
          },
        },
      });

      if (authError) throw authError;

      if (authData.user) {
        // Inserir perfil do usuário
        const { error: profileError } = await supabase
          .from('profiles')
          .insert({
            id: authData.user.id,
            email: formData.email,
            nome_completo: formData.nome_completo,
            empresa: formData.empresa,
            telefone: formData.telefone,
            whatsapp: formData.whatsapp,
            plano_ativo: formData.plano_ativo,
          });

        if (profileError) throw profileError;

        toast({
          title: "Usuário criado com sucesso",
          description: "Um email de confirmação foi enviado para o usuário.",
        });

        setFormData({
          email: '',
          nome_completo: '',
          empresa: '',
          telefone: '',
          whatsapp: '',
          plano_ativo: 'free',
        });
        
        onUserAdded();
        onClose();
      }
    } catch (error: any) {
      console.error('Erro ao criar usuário:', error);
      toast({
        title: "Erro ao criar usuário",
        description: error.message || "Não foi possível criar o usuário.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
        <DialogHeader>
          <DialogTitle className="text-gray-900 dark:text-white">
            Adicionar Novo Cliente
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email" className="text-gray-700 dark:text-gray-300">Email</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white"
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="nome_completo" className="text-gray-700 dark:text-gray-300">Nome Completo</Label>
            <Input
              id="nome_completo"
              value={formData.nome_completo}
              onChange={(e) => setFormData({ ...formData, nome_completo: e.target.value })}
              className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white"
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="empresa" className="text-gray-700 dark:text-gray-300">Empresa</Label>
            <Input
              id="empresa"
              value={formData.empresa}
              onChange={(e) => setFormData({ ...formData, empresa: e.target.value })}
              className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="telefone" className="text-gray-700 dark:text-gray-300">Telefone</Label>
            <Input
              id="telefone"
              value={formData.telefone}
              onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
              className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="whatsapp" className="text-gray-700 dark:text-gray-300">WhatsApp</Label>
            <Input
              id="whatsapp"
              value={formData.whatsapp}
              onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
              className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white"
              placeholder="(11) 99999-9999"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="plano_ativo" className="text-gray-700 dark:text-gray-300">Plano</Label>
            <select
              id="plano_ativo"
              value={formData.plano_ativo}
              onChange={(e) => setFormData({ ...formData, plano_ativo: e.target.value })}
              className="w-full p-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md text-gray-900 dark:text-white"
            >
              <option value="free">Gratuito</option>
              <option value="profissional">Profissional</option>
              <option value="empresarial">Empresarial</option>
            </select>
          </div>
          
          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {isLoading ? 'Criando...' : 'Criar Cliente'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddUserModal;
