
import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import ServerMetrics from './ServerMetrics';

interface ServerMetricsModalProps {
  isOpen: boolean;
  onClose: () => void;
  serverId: string;
  serverName: string;
}

const ServerMetricsModal: React.FC<ServerMetricsModalProps> = ({
  isOpen,
  onClose,
  serverId,
  serverName,
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-card border-border max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl text-foreground">
            Métricas do Servidor - {serverName}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          <ServerMetrics serverId={serverId} serverName={serverName} />
          
          <div className="flex justify-end">
            <Button variant="outline" onClick={onClose}>
              Fechar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ServerMetricsModal;
