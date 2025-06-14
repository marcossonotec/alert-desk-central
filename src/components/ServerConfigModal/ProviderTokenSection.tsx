
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Cloud, Plus } from 'lucide-react';
import { useProviderTokens } from '../AddServerModal/useProviderTokens';
import AddProviderTokenInline from '../AddProviderTokenInline';
import { useToast } from '@/hooks/use-toast';

interface ProviderTokenSectionProps {
  provedor: string;
  selectedTokenId: string;
  onTokenSelect: (id: string) => void;
}

const provedores = [
  { value: "hetzner", label: "Hetzner Cloud" },
  { value: "aws", label: "Amazon AWS" },
  { value: "digitalocean", label: "DigitalOcean" },
  { value: "vultr", label: "Vultr" },
  { value: "linode", label: "Linode" },
  { value: "outros", label: "Outros" },
];

const ProviderTokenSection: React.FC<ProviderTokenSectionProps> = ({
  provedor,
  selectedTokenId,
  onTokenSelect,
}) => {
  const [showAddToken, setShowAddToken] = useState(false);
  const { toast } = useToast();
  
  const { providerTokens, fetchingTokens, refetch } = useProviderTokens(provedor, true);

  const handleNewToken = () => setShowAddToken(true);

  const handleTokenAdded = async (newTokenId?: string) => {
    setShowAddToken(false);
    await refetch();
    if (newTokenId) {
      onTokenSelect(newTokenId);
      toast({
        title: "Token cadastrado e selecionado",
        description: "O novo token foi automaticamente associado ao servidor.",
      });
    }
  };

  if (provedor === "outros") {
    return null;
  }

  return (
    <Card className="bg-card/50 border-border">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center space-x-2 text-foreground">
          <Cloud className="h-5 w-5 text-primary" />
          <span>Token do Provedor ({provedores.find(p => p.value === provedor)?.label})</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-sm text-muted-foreground">
          Para coleta automática de métricas reais da API do provedor, selecione ou cadastre um token de acesso.
        </div>
        
        {fetchingTokens ? (
          <div className="text-center py-4">Carregando tokens...</div>
        ) : (
          <>
            {providerTokens.length > 0 && (
              <div className="space-y-2">
                <Label className="text-foreground">Tokens Disponíveis</Label>
                <div className="space-y-2">
                  {providerTokens.map((token) => (
                    <label
                      key={token.id}
                      className="flex items-center space-x-3 p-3 border rounded-lg cursor-pointer hover:bg-muted/50"
                    >
                      <input
                        type="radio"
                        name="provider_token_id"
                        value={token.id}
                        checked={selectedTokenId === token.id}
                        onChange={() => onTokenSelect(token.id)}
                        className="text-primary"
                      />
                      <div className="flex-1">
                        <div className="font-medium text-foreground">
                          {token.nickname || 'Token sem apelido'}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {token.token.slice(0, 8)}...{token.token.slice(-8)}
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {!showAddToken ? (
              <Button
                type="button"
                variant="outline"
                onClick={handleNewToken}
                className="w-full"
              >
                <Plus className="h-4 w-4 mr-2" />
                Cadastrar Novo Token
              </Button>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-foreground">Novo Token</Label>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowAddToken(false)}
                  >
                    Cancelar
                  </Button>
                </div>
                <AddProviderTokenInline
                  provider={provedor}
                  onSuccess={handleTokenAdded}
                />
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default ProviderTokenSection;
