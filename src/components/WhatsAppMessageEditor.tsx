
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Send, MessageSquare, Info } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface WhatsAppMessageEditorProps {
  isOpen: boolean;
  onClose: () => void;
  instanceId: string;
  instanceName: string;
}

const WhatsAppMessageEditor: React.FC<WhatsAppMessageEditorProps> = ({
  isOpen,
  onClose,
  instanceId,
  instanceName
}) => {
  const [messageTemplate, setMessageTemplate] = useState('');
  const [testNumber, setTestNumber] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  // Variáveis disponíveis para templates WhatsApp
  const availableVariables = [
    { name: '{{nome}}', description: 'Nome do usuário' },
    { name: '{{empresa}}', description: 'Nome da empresa' },
    { name: '{{servidor_nome}}', description: 'Nome do servidor' },
    { name: '{{tipo_alerta}}', description: 'Tipo do alerta (CPU, Memória, Disco)' },
    { name: '{{valor_atual}}', description: 'Valor atual da métrica' },
    { name: '{{limite}}', description: 'Limite configurado' },
    { name: '{{data_hora}}', description: 'Data e hora do alerta' },
    { name: '{{ip_servidor}}', description: 'IP do servidor' },
    { name: '{{status}}', description: 'Status do servidor/aplicação' }
  ];

  const defaultTemplate = `🚨 *ALERTA: {{tipo_alerta}}*

📊 *Servidor:* {{servidor_nome}}
📍 *IP:* {{ip_servidor}}
⚠️ *Problema:* {{tipo_alerta}} em {{valor_atual}}% (limite: {{limite}}%)

🕒 *Data/Hora:* {{data_hora}}

_Mensagem automática do DeskTools_`;

  useEffect(() => {
    if (isOpen) {
      loadMessageTemplate();
    }
  }, [isOpen, instanceId]);

  const loadMessageTemplate = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('evolution_instances')
        .select('*')
        .eq('id', instanceId)
        .single();

      if (error) throw error;

      // Buscar template personalizado ou usar padrão
      const template = data.message_template || defaultTemplate;
      setMessageTemplate(template);
    } catch (error) {
      console.error('Erro ao carregar template:', error);
      setMessageTemplate(defaultTemplate);
    } finally {
      setIsLoading(false);
    }
  };

  const saveMessageTemplate = async () => {
    try {
      setIsLoading(true);
      const { error } = await supabase
        .from('evolution_instances')
        .update({
          message_template: messageTemplate,
          updated_at: new Date().toISOString()
        })
        .eq('id', instanceId);

      if (error) throw error;

      toast({
        title: "Template salvo",
        description: "O template de mensagem WhatsApp foi salvo com sucesso.",
      });
    } catch (error: any) {
      console.error('Erro ao salvar template:', error);
      toast({
        title: "Erro ao salvar",
        description: "Não foi possível salvar o template.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const sendTestMessage = async () => {
    if (!testNumber || !messageTemplate) {
      toast({
        title: "Campos obrigatórios",
        description: "Digite um número de teste e o template da mensagem.",
        variant: "destructive"
      });
      return;
    }

    try {
      setIsSending(true);
      
      // Substituir variáveis por valores de exemplo para teste
      const testMessage = messageTemplate
        .replace(/\{\{nome\}\}/g, 'João Silva')
        .replace(/\{\{empresa\}\}/g, 'Empresa Teste')
        .replace(/\{\{servidor_nome\}\}/g, 'Servidor-Prod-01')
        .replace(/\{\{tipo_alerta\}\}/g, 'Alto uso de CPU')
        .replace(/\{\{valor_atual\}\}/g, '85')
        .replace(/\{\{limite\}\}/g, '80')
        .replace(/\{\{data_hora\}\}/g, new Date().toLocaleString('pt-BR'))
        .replace(/\{\{ip_servidor\}\}/g, '192.168.1.100')
        .replace(/\{\{status\}\}/g, 'CRÍTICO');

      // Chamar edge function para enviar WhatsApp
      const { error } = await supabase.functions.invoke('evolution-api', {
        body: {
          action: 'send_message',
          instance_id: instanceId,
          number: testNumber.replace(/\D/g, ''),
          message: testMessage
        }
      });

      if (error) throw error;

      toast({
        title: "Mensagem enviada",
        description: "Mensagem de teste enviada com sucesso!",
      });
    } catch (error: any) {
      console.error('Erro ao enviar mensagem:', error);
      toast({
        title: "Erro ao enviar",
        description: "Não foi possível enviar a mensagem de teste.",
        variant: "destructive"
      });
    } finally {
      setIsSending(false);
    }
  };

  const insertVariable = (variable: string) => {
    const textarea = document.getElementById('messageTemplate') as HTMLTextAreaElement;
    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const text = messageTemplate;
      const newText = text.substring(0, start) + variable + text.substring(end);
      setMessageTemplate(newText);
      
      // Reposicionar cursor
      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(start + variable.length, start + variable.length);
      }, 0);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-card border-border max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Editor de Mensagens WhatsApp - {instanceName}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Variáveis disponíveis */}
          <Card className="bg-muted/50 border-border">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Info className="h-4 w-4" />
                Variáveis Disponíveis
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {availableVariables.map((variable) => (
                  <Button
                    key={variable.name}
                    variant="outline"
                    size="sm"
                    onClick={() => insertVariable(variable.name)}
                    className="justify-start text-xs h-8"
                    title={variable.description}
                  >
                    {variable.name}
                  </Button>
                ))}
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Clique em uma variável para inserir no template
              </p>
            </CardContent>
          </Card>

          {/* Template da mensagem */}
          <div className="space-y-2">
            <Label htmlFor="messageTemplate">Template da Mensagem</Label>
            <Textarea
              id="messageTemplate"
              placeholder={defaultTemplate}
              value={messageTemplate}
              onChange={(e) => setMessageTemplate(e.target.value)}
              className="bg-background border-border min-h-[300px] font-mono"
            />
            <p className="text-xs text-muted-foreground">
              Use as variáveis acima para personalizar sua mensagem. Suporte para formatação WhatsApp: *negrito*, _itálico_, ~riscado~
            </p>
          </div>

          {/* Teste de mensagem */}
          <Card className="border-border">
            <CardHeader>
              <CardTitle className="text-base">Testar Mensagem</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="testNumber">Número para Teste (com DDD)</Label>
                <input
                  id="testNumber"
                  type="tel"
                  placeholder="11999999999"
                  value={testNumber}
                  onChange={(e) => setTestNumber(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                />
              </div>
              <Button
                onClick={sendTestMessage}
                disabled={isSending || !testNumber}
                className="w-full"
              >
                <Send className="h-4 w-4 mr-2" />
                {isSending ? 'Enviando...' : 'Enviar Mensagem de Teste'}
              </Button>
            </CardContent>
          </Card>

          {/* Ações */}
          <div className="flex justify-between pt-4 border-t border-border">
            <Button variant="outline" onClick={onClose}>
              Fechar
            </Button>
            <Button
              onClick={saveMessageTemplate}
              disabled={isLoading}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              {isLoading ? 'Salvando...' : 'Salvar Template'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default WhatsAppMessageEditor;
