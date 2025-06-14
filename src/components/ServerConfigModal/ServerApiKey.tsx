
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Key } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ServerApiKeyProps {
  apiKey?: string;
}

const ServerApiKey: React.FC<ServerApiKeyProps> = ({ apiKey }) => {
  const { toast } = useToast();

  const handleCopyApiKey = () => {
    if (apiKey) {
      navigator.clipboard.writeText(apiKey);
      toast({ title: "API Key copiada!" });
    }
  };

  return (
    <Card className="bg-card/50 border-border">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center space-x-2 text-foreground">
          <Key className="h-5 w-5 text-primary" />
          <span>API Key do Agente</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="flex items-center gap-2">
          <span className="font-mono break-all text-sm bg-muted p-2 rounded">
            {apiKey || <em>API key não encontrada</em>}
          </span>
          {apiKey && (
            <Button
              type="button"
              size="sm"
              onClick={handleCopyApiKey}
            >
              Copiar
            </Button>
          )}
        </div>
        <div className="text-xs text-muted-foreground">
          Esta chave deve ser configurada no agente de monitoramento para enviar dados ao sistema.
        </div>
      </CardContent>
    </Card>
  );
};

export default ServerApiKey;
