
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus } from 'lucide-react';

interface CreateInstanceFormProps {
  onCreateInstance: (instanceName: string) => void;
  isLoading: boolean;
  canCreateInstance: boolean;
  currentInstanceCount: number;
  maxInstances: number;
}

const CreateInstanceForm: React.FC<CreateInstanceFormProps> = ({
  onCreateInstance,
  isLoading,
  canCreateInstance,
  currentInstanceCount,
  maxInstances,
}) => {
  const [instanceName, setInstanceName] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (instanceName.trim()) {
      onCreateInstance(instanceName.trim());
      setInstanceName('');
    }
  };

  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <CardTitle className="text-lg">Criar Nova Instância</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="instanceName">Nome da Instância</Label>
            <Input
              id="instanceName"
              value={instanceName}
              onChange={(e) => setInstanceName(e.target.value)}
              placeholder="ex: minha-empresa"
              className="bg-background border-border"
              disabled={!canCreateInstance || isLoading}
            />
          </div>
          
          <div className="text-sm text-muted-foreground">
            Instâncias: {currentInstanceCount}/{maxInstances === -1 ? '∞' : maxInstances}
          </div>
          
          <Button
            type="submit"
            disabled={!canCreateInstance || isLoading || !instanceName.trim()}
            className="w-full bg-green-600 hover:bg-green-700 text-white"
          >
            <Plus className="h-4 w-4 mr-2" />
            {isLoading ? 'Criando...' : 'Criar Instância'}
          </Button>
          
          {!canCreateInstance && (
            <p className="text-sm text-red-600">
              {maxInstances === 0 
                ? 'Seu plano não permite instâncias WhatsApp. Faça upgrade para usar este recurso.'
                : 'Limite de instâncias atingido. Faça upgrade para criar mais instâncias.'
              }
            </p>
          )}
        </form>
      </CardContent>
    </Card>
  );
};

export default CreateInstanceForm;
