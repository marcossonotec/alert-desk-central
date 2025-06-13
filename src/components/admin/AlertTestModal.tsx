
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { TestTube } from 'lucide-react';

interface AlertTestModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const AlertTestModal: React.FC<AlertTestModalProps> = ({ isOpen, onClose }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [testData, setTestData] = useState({
    tipo_alerta: 'cpu_usage',
    valor_atual: 85,
    limite: 80,
    servidor_nome: 'Servidor-Teste',
    ip_servidor: '192.168.1.100'
  });
  const { toast } = useToast();

  const handleTest = async () => {
    setIsLoading(true);
    
    try {
      // Simular envio de alerta de teste
      const { data, error } = await supabase.functions.invoke('send-alerts', {
        body: {
          alerta_id: 'test-alert-' + Date.now(),
          servidor_id: 'test-server-id',
          aplicacao_id: null,
          tipo_alerta: testData.tipo_alerta,
          valor_atual: testData.valor_atual,
          limite: testData.limite,
          test_mode: true,
          test_data: {
            servidor_nome: testData.servidor_nome,
            ip_servidor: testData.ip_servidor
          }
        }
      });

      if (error) throw error;

      toast({
        title: "Teste de alerta enviado!",
        description: "Verifique seu email e WhatsApp para confirmar o recebimento.",
      });
      
      onClose();
    } catch (error: any) {
      console.error('Erro no teste de alerta:', error);
      toast({
        title: "Erro no teste",
        description: error.message || "Não foi possível enviar o teste de alerta.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <TestTube className="h-5 w-5" />
            Testar Envio de Alertas
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="tipo_alerta">Tipo de Alerta</Label>
            <Select
              value={testData.tipo_alerta}
              onValueChange={(value) => setTestData({ ...testData, tipo_alerta: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="cpu_usage">Alto uso de CPU</SelectItem>
                <SelectItem value="memoria_usage">Alto uso de memória</SelectItem>
                <SelectItem value="disco_usage">Alto uso de disco</SelectItem>
                <SelectItem value="response_time">Tempo de resposta alto</SelectItem>
                <SelectItem value="status">Servidor offline</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="valor_atual">Valor Atual</Label>
              <Input
                id="valor_atual"
                type="number"
                value={testData.valor_atual}
                onChange={(e) => setTestData({ ...testData, valor_atual: parseFloat(e.target.value) })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="limite">Limite</Label>
              <Input
                id="limite"
                type="number"
                value={testData.limite}
                onChange={(e) => setTestData({ ...testData, limite: parseFloat(e.target.value) })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="servidor_nome">Nome do Servidor</Label>
            <Input
              id="servidor_nome"
              value={testData.servidor_nome}
              onChange={(e) => setTestData({ ...testData, servidor_nome: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="ip_servidor">IP do Servidor</Label>
            <Input
              id="ip_servidor"
              value={testData.ip_servidor}
              onChange={(e) => setTestData({ ...testData, ip_servidor: e.target.value })}
            />
          </div>

          <div className="bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded-lg">
            <p className="text-sm text-yellow-800 dark:text-yellow-200">
              <strong>Atenção:</strong> Este teste enviará um alerta real para seu email e WhatsApp configurados.
            </p>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button onClick={handleTest} disabled={isLoading}>
              {isLoading ? 'Enviando...' : 'Enviar Teste'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AlertTestModal;
