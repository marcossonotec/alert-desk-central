
import React from 'react';
import { Button } from '@/components/ui/button';
import { Plus, MessageSquare, LogOut, Settings } from 'lucide-react';

interface DashboardHeaderProps {
  onAddServer: () => void;
  onOpenWhatsApp: () => void;
  onGoToAdmin: () => void;
  onLogout: () => void;
}

const DashboardHeader: React.FC<DashboardHeaderProps> = ({
  onAddServer,
  onOpenWhatsApp,
  onGoToAdmin,
  onLogout,
}) => {
  return (
    <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground">Gerencie seus servidores e monitoramento</p>
      </div>
      <div className="flex flex-wrap gap-2">
        <Button 
          onClick={onOpenWhatsApp}
          className="bg-green-600 hover:bg-green-700 text-white"
        >
          <MessageSquare className="h-4 w-4 mr-2" />
          WhatsApp
        </Button>
        <Button 
          onClick={onAddServer}
          className="bg-primary hover:bg-primary/90"
        >
          <Plus className="h-4 w-4 mr-2" />
          Adicionar Servidor
        </Button>
        <Button
          onClick={onGoToAdmin}
          variant="outline"
          className="border-border hover:bg-accent"
        >
          <Settings className="h-4 w-4 mr-2" />
          Admin
        </Button>
        <Button
          onClick={onLogout}
          variant="outline"
          className="border-border hover:bg-accent text-red-600 hover:text-red-700"
        >
          <LogOut className="h-4 w-4 mr-2" />
          Sair
        </Button>
      </div>
    </div>
  );
};

export default DashboardHeader;
