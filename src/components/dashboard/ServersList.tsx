
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Server, Plus } from 'lucide-react';
import ServerCard from '@/components/ServerCard';

interface ServersListProps {
  servers: any[];
  onUpdate: () => void;
  onAddServer: () => void;
}

const ServersList: React.FC<ServersListProps> = ({
  servers,
  onUpdate,
  onAddServer,
}) => {
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-foreground">Seus Servidores</h2>
        <Badge variant="secondary" className="text-sm">
          {servers.length} servidor{servers.length !== 1 ? 'es' : ''}
        </Badge>
      </div>

      {servers.length === 0 ? (
        <Card className="bg-card border-border">
          <CardContent className="py-12 text-center">
            <Server className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">
              Nenhum servidor cadastrado
            </h3>
            <p className="text-muted-foreground mb-6">
              Adicione seu primeiro servidor para começar o monitoramento.
            </p>
            <Button onClick={onAddServer}>
              <Plus className="h-4 w-4 mr-2" />
              Adicionar Primeiro Servidor
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {servers.map((server) => (
            <ServerCard
              key={server.id}
              server={server}
              onUpdate={onUpdate}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default ServersList;
