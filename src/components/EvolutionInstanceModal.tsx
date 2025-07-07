
import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import CreateInstanceForm from './evolution/CreateInstanceForm';
import EnhancedInstanceList from './evolution/EnhancedInstanceList';
import WhatsAppMessageEditor from './WhatsAppMessageEditor';

interface EvolutionInstanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInstanceUpdate?: () => void;
}

const EvolutionInstanceModal: React.FC<EvolutionInstanceModalProps> = ({
  isOpen,
  onClose,
  onInstanceUpdate
}) => {
  const [activeTab, setActiveTab] = useState('list');
  const [showMessageEditor, setShowMessageEditor] = useState(false);
  const [selectedInstance, setSelectedInstance] = useState<{id: string, name: string} | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleInstanceCreated = () => {
    setActiveTab('list');
    setRefreshKey(prev => prev + 1); // Força atualização da lista
    if (onInstanceUpdate) {
      onInstanceUpdate();
    }
  };

  const handleInstanceUpdate = () => {
    setRefreshKey(prev => prev + 1); // Força atualização da lista
    if (onInstanceUpdate) {
      onInstanceUpdate();
    }
  };

  const handleEditMessages = (instanceId: string, instanceName: string) => {
    setSelectedInstance({ id: instanceId, name: instanceName });
    setShowMessageEditor(true);
  };

  const handleCloseMessageEditor = () => {
    setShowMessageEditor(false);
    setSelectedInstance(null);
  };

  // Fechar editor de mensagens se o modal principal for fechado
  useEffect(() => {
    if (!isOpen && showMessageEditor) {
      setShowMessageEditor(false);
      setSelectedInstance(null);
    }
  }, [isOpen, showMessageEditor]);

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="bg-card border-border max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl text-foreground">
              Gerenciar Instâncias WhatsApp
            </DialogTitle>
          </DialogHeader>
          
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="list">Minhas Instâncias</TabsTrigger>
              <TabsTrigger value="create">Criar Nova</TabsTrigger>
            </TabsList>
            
            <TabsContent value="list" className="space-y-4">
              <EnhancedInstanceList 
                key={refreshKey}
                onUpdate={handleInstanceUpdate}
                onEditMessages={handleEditMessages}
              />
            </TabsContent>
            
            <TabsContent value="create" className="space-y-4">
              <CreateInstanceForm onInstanceCreated={handleInstanceCreated} />
            </TabsContent>
          </Tabs>
          
          <div className="flex justify-end pt-4">
            <Button variant="outline" onClick={onClose}>
              Fechar
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal do Editor de Mensagens */}
      {showMessageEditor && selectedInstance && (
        <WhatsAppMessageEditor
          isOpen={showMessageEditor}
          onClose={handleCloseMessageEditor}
          instanceId={selectedInstance.id}
          instanceName={selectedInstance.name}
        />
      )}
    </>
  );
};

export default EvolutionInstanceModal;
