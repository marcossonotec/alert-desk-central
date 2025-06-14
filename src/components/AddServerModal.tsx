
import React from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Server } from "lucide-react";
import AddServerForm from "./AddServerModal/AddServerForm";

interface AddServerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddServer: (serverData: any) => void;
}

const AddServerModal: React.FC<AddServerModalProps> = ({ isOpen, onClose, onAddServer }) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-card border-border max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2 text-xl">
            <Server className="h-6 w-6 text-primary" />
            <span>Adicionar Novo Servidor</span>
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Configure um novo servidor para monitoramento em tempo real
          </DialogDescription>
        </DialogHeader>

        <AddServerForm onCancel={onClose} onAddServer={onAddServer} />
      </DialogContent>
    </Dialog>
  );
};

export default AddServerModal;
