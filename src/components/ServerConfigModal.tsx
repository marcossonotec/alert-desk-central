
import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Server } from 'lucide-react';
import { useServerConfigForm } from './ServerConfigModal/useServerConfigForm';
import ServerBasicInfo from './ServerConfigModal/ServerBasicInfo';
import ServerApiKey from './ServerConfigModal/ServerApiKey';
import ProviderTokenSection from './ServerConfigModal/ProviderTokenSection';

interface ServerConfigModalProps {
  server: {
    id: string;
    nome: string;
    ip: string;
    provedor?: string;
    webhook_url?: string;
    provider_token_id?: string;
    status?: string;
    api_key?: string;
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
  console.log('ServerConfigModal render:', { server, isOpen });
  
  const {
    formData,
    isLoading,
    deleting,
    handleInputChange,
    handleProviderChange,
    handleTokenSelect,
    handleStatusChange,
    handleSubmit,
    handleDelete,
  } = useServerConfigForm(server, onUpdate, onClose);

  if (!server || !server.id) {
    console.error('ServerConfigModal: servidor inválido', server);
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-card border-border max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2 text-xl text-foreground">
            <Server className="h-6 w-6 text-primary" />
            <span>Configurar Servidor</span>
          </DialogTitle>
          <DialogDescription>
            Configure as informações do servidor e associe tokens de API para coleta automática de métricas.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <ServerBasicInfo
            formData={formData}
            onInputChange={handleInputChange}
            onProviderChange={handleProviderChange}
            onStatusChange={handleStatusChange}
          />

          <ServerApiKey apiKey={server.api_key} />

          <ProviderTokenSection
            provedor={formData.provedor}
            selectedTokenId={formData.provider_token_id}
            onTokenSelect={handleTokenSelect}
          />

          <div className="flex justify-between gap-4 pt-4">
            <Button
              type="button"
              variant="destructive"
              onClick={handleDelete}
              disabled={deleting}
              className="flex-none"
            >
              {deleting ? "Excluindo..." : "Excluir Servidor"}
            </Button>
            <div className="flex gap-3 justify-end flex-1">
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
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ServerConfigModal;
