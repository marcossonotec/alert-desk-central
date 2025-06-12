
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MessageSquare, Trash2, RefreshCw } from 'lucide-react';

interface InstanceListProps {
  instances: any[];
  onDelete: (id: string) => void;
  onRefresh: (id: string) => void;
  isLoading: boolean;
}

const InstanceList: React.FC<InstanceListProps> = ({
  instances,
  onDelete,
  onRefresh,
  isLoading,
}) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'connected':
        return 'bg-green-100 text-green-800';
      case 'disconnected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'connected':
        return 'Conectado';
      case 'disconnected':
        return 'Desconectado';
      default:
        return 'Desconhecido';
    }
  };

  return (
    <div className="space-y-4">
      {instances.map((instance) => (
        <Card key={instance.id} className="bg-card border-border">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <MessageSquare className="h-8 w-8 text-green-600" />
                <div>
                  <h3 className="font-medium text-foreground">
                    {instance.instance_name}
                  </h3>
                  <Badge className={getStatusColor(instance.status)}>
                    {getStatusText(instance.status)}
                  </Badge>
                </div>
              </div>
              <div className="flex space-x-2">
                <Button
                  onClick={() => onRefresh(instance.id)}
                  disabled={isLoading}
                  variant="outline"
                  size="sm"
                >
                  <RefreshCw className="h-4 w-4" />
                </Button>
                <Button
                  onClick={() => onDelete(instance.id)}
                  disabled={isLoading}
                  variant="outline"
                  size="sm"
                  className="text-red-600 hover:text-red-700"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default InstanceList;
