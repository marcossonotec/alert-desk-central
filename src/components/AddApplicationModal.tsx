
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Loader2, Server, Plus } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface AddApplicationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplicationAdded: () => void;
  servers: any[];
}

const AddApplicationModal: React.FC<AddApplicationModalProps> = ({
  isOpen,
  onClose,
  onApplicationAdded,
  servers,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [applicationTypes, setApplicationTypes] = useState<any[]>([]);
  const [selectedServer, setSelectedServer] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [formData, setFormData] = useState({
    nome: '',
    descricao: '',
    porta: '',
    caminho: '',
    url_monitoramento: '',
  });
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen) {
      loadApplicationTypes();
    }
  }, [isOpen]);

  const loadApplicationTypes = async () => {
    try {
      console.log('AddApplicationModal: Loading application types...');
      
      const { data, error } = await supabase
        .from('tipos_aplicacao')
        .select('*')
        .eq('ativo', true)
        .order('preco_mensal');

      if (error) {
        console.error('AddApplicationModal: Error loading types:', error);
        throw error;
      }
      
      console.log('AddApplicationModal: Application types loaded:', data);
      setApplicationTypes(data || []);
    } catch (error: any) {
      console.error('AddApplicationModal: Failed to load application types:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os tipos de aplicação.",
        variant: "destructive"
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedServer || !selectedType || !formData.nome) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha todos os campos obrigatórios.",
        variant: "destructive"
      });
      return;
    }

    try {
      setIsLoading(true);
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const selectedTypeData = applicationTypes.find(t => t.id === selectedType);
      
      // Criar a aplicação
      const { data: applicationData, error: appError } = await supabase
        .from('aplicacoes')
        .insert({
          servidor_id: selectedServer,
          usuario_id: user.id,
          tipo_aplicacao_id: selectedType,
          nome: formData.nome,
          descricao: formData.descricao,
          porta: formData.porta ? parseInt(formData.porta) : null,
          caminho: formData.caminho,
          url_monitoramento: formData.url_monitoramento,
          configuracao: {}
        })
        .select()
        .single();

      if (appError) throw appError;

      // Criar a assinatura da aplicação
      const { error: subscriptionError } = await supabase
        .from('assinatura_aplicacoes')
        .insert({
          usuario_id: user.id,
          aplicacao_id: applicationData.id,
          tipo_aplicacao_id: selectedType,
          preco_mensal: selectedTypeData.preco_mensal,
          status: 'ativa'
        });

      if (subscriptionError) throw subscriptionError;

      toast({
        title: "Aplicação adicionada",
        description: "A aplicação foi configurada com sucesso para monitoramento.",
      });

      onApplicationAdded();
      handleClose();
    } catch (error: any) {
      console.error('Erro ao adicionar aplicação:', error);
      toast({
        title: "Erro ao adicionar aplicação",
        description: error.message || "Não foi possível adicionar a aplicação.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setSelectedServer('');
    setSelectedType('');
    setFormData({
      nome: '',
      descricao: '',
      porta: '',
      caminho: '',
      url_monitoramento: '',
    });
    onClose();
  };

  const selectedTypeData = applicationTypes.find(t => t.id === selectedType);

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="bg-card border-border max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2 text-xl text-foreground">
            <Plus className="h-6 w-6 text-primary" />
            <span>Adicionar Nova Aplicação</span>
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Seleção do Servidor */}
          <div className="space-y-2">
            <Label>Servidor *</Label>
            <Select value={selectedServer} onValueChange={setSelectedServer}>
              <SelectTrigger className="bg-background border-border">
                <SelectValue placeholder="Selecione um servidor" />
              </SelectTrigger>
              <SelectContent className="bg-popover border-border z-50">
                {servers.map((server) => (
                  <SelectItem key={server.id} value={server.id}>
                    <div className="flex items-center space-x-2">
                      <Server className="h-4 w-4" />
                      <span>{server.nome} ({server.ip})</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Seleção do Tipo de Aplicação */}
          <div className="space-y-2">
            <Label>Tipo de Aplicação *</Label>
            <Select value={selectedType} onValueChange={setSelectedType}>
              <SelectTrigger className="bg-background border-border">
                <SelectValue placeholder="Selecione o tipo de aplicação" />
              </SelectTrigger>
              <SelectContent className="bg-popover border-border z-[60] max-h-[200px] overflow-y-auto">
                {applicationTypes.length === 0 ? (
                  <SelectItem value="no-types" disabled>
                    Nenhum tipo de aplicação disponível
                  </SelectItem>
                ) : (
                  applicationTypes.map((type) => (
                    <SelectItem key={type.id} value={type.id}>
                      <div className="flex items-center justify-between w-full">
                        <span>{type.descricao}</span>
                        <Badge variant="secondary">R$ {type.preco_mensal}/mês</Badge>
                      </div>
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          {/* Informações da Aplicação */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Nome da Aplicação *</Label>
              <Input
                value={formData.nome}
                onChange={(e) => setFormData({...formData, nome: e.target.value})}
                placeholder="Ex: API Principal"
                className="bg-background border-border"
              />
            </div>

            <div className="space-y-2">
              <Label>Porta</Label>
              <Input
                type="number"
                value={formData.porta}
                onChange={(e) => setFormData({...formData, porta: e.target.value})}
                placeholder="Ex: 3000"
                className="bg-background border-border"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Descrição</Label>
            <Textarea
              value={formData.descricao}
              onChange={(e) => setFormData({...formData, descricao: e.target.value})}
              placeholder="Descrição da aplicação (opcional)"
              className="bg-background border-border"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Caminho/Diretório</Label>
              <Input
                value={formData.caminho}
                onChange={(e) => setFormData({...formData, caminho: e.target.value})}
                placeholder="Ex: /var/www/app"
                className="bg-background border-border"
              />
            </div>

            <div className="space-y-2">
              <Label>URL de Monitoramento</Label>
              <Input
                value={formData.url_monitoramento}
                onChange={(e) => setFormData({...formData, url_monitoramento: e.target.value})}
                placeholder="Ex: http://localhost:3000/health"
                className="bg-background border-border"
              />
            </div>
          </div>

          {/* Recursos do Tipo Selecionado */}
          {selectedTypeData && (
            <Card className="bg-card/50 border-border">
              <CardHeader>
                <CardTitle className="text-lg">
                  {selectedTypeData.descricao} - R$ {selectedTypeData.preco_mensal}/mês
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-2">
                  {Object.entries(selectedTypeData.recursos).map(([key, value]) => (
                    value && (
                      <div key={key} className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span className="text-sm capitalize">
                          {key.replace(/_/g, ' ')}
                        </span>
                      </div>
                    )
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isLoading}
              className="border-border text-muted-foreground hover:text-foreground hover:bg-accent"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Adicionando...
                </>
              ) : (
                'Adicionar Aplicação'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddApplicationModal;
