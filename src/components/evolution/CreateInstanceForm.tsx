
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

interface CreateInstanceFormProps {
  onInstanceCreated: () => void;
}

const CreateInstanceForm: React.FC<CreateInstanceFormProps> = ({
  onInstanceCreated,
}) => {
  const [instanceName, setInstanceName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [userPlan, setUserPlan] = useState<any>(null);
  const [instanceCount, setInstanceCount] = useState(0);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      loadUserData();
    }
  }, [user]);

  const loadUserData = async () => {
    if (!user) return;

    try {
      console.log('CreateInstanceForm: Loading user data for user:', user.id);
      
      // Carregar perfil do usuário
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('plano_ativo')
        .eq('id', user.id)
        .single();

      if (profileError) {
        console.error('CreateInstanceForm: Error loading profile:', profileError);
        throw profileError;
      }

      console.log('CreateInstanceForm: Profile loaded:', profile);

      // Carregar dados do plano
      const { data: plano, error: planoError } = await supabase
        .from('planos_assinatura')
        .select('*')
        .eq('nome', profile?.plano_ativo || 'free')
        .single();

      if (planoError) {
        console.error('CreateInstanceForm: Error loading plan:', planoError);
        throw planoError;
      }

      console.log('CreateInstanceForm: Plan loaded:', plano);
      setUserPlan(plano);

      // Contar instâncias existentes
      const { data: instances, error: instancesError } = await supabase
        .from('evolution_instances')
        .select('id')
        .eq('usuario_id', user.id);

      if (instancesError) {
        console.error('CreateInstanceForm: Error loading instances:', instancesError);
        throw instancesError;
      }

      console.log('CreateInstanceForm: Instances loaded:', instances?.length || 0);
      setInstanceCount(instances?.length || 0);
    } catch (error) {
      console.error('CreateInstanceForm: Error loading user data:', error);
      toast({
        title: "Erro ao carregar dados",
        description: "Não foi possível carregar informações do plano.",
        variant: "destructive"
      });
    }
  };

  const getMaxInstances = () => {
    if (!userPlan) {
      console.log('CreateInstanceForm: No user plan loaded');
      return 0;
    }
    const recursos = userPlan.recursos || {};
    const maxInstances = recursos.max_whatsapp_instances;
    console.log('CreateInstanceForm: Max instances from plan:', maxInstances, 'Plan:', userPlan.nome, 'Recursos:', recursos);
    
    // Handle -1 as unlimited, 0 as none allowed, any positive number as limit
    if (maxInstances === -1) return -1; // Unlimited  
    if (maxInstances === 0) return 0;   // None allowed
    return maxInstances || 0;           // Default to 0 if undefined/null
  };

  const canCreateInstance = () => {
    const maxInstances = getMaxInstances();
    console.log('CreateInstanceForm: Can create instance check - maxInstances:', maxInstances, 'currentCount:', instanceCount);
    
    if (maxInstances === -1) return true; // Unlimited plan
    if (maxInstances === 0) return false; // No instances allowed
    return instanceCount < maxInstances;   // Check limit
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!instanceName.trim() || !user) return;

    if (!canCreateInstance()) {
      toast({
        title: "Limite atingido",
        description: "Você atingiu o limite de instâncias do seu plano.",
        variant: "destructive"
      });
      return;
    }

    try {
      setIsLoading(true);

      // Chamar edge function para criar instância
      const { data, error } = await supabase.functions.invoke('evolution-api', {
        body: {
          action: 'create-instance',
          usuario_id: user.id,
          instance_name: instanceName.trim()
        }
      });

      if (error) throw error;

      if (data?.success) {
        toast({
          title: "Instância criada",
          description: "Instância WhatsApp criada com sucesso!",
        });

        setInstanceName('');
        onInstanceCreated();
        await loadUserData(); // Recarregar dados
      } else {
        throw new Error(data?.error || 'Erro ao criar instância');
      }
    } catch (error: any) {
      console.error('Erro ao criar instância:', error);
      toast({
        title: "Erro ao criar instância",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const maxInstances = getMaxInstances();

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
              disabled={!canCreateInstance() || isLoading}
            />
          </div>
          
          <div className="text-sm text-muted-foreground">
            Instâncias: {instanceCount}/{maxInstances === -1 ? '∞' : maxInstances}
          </div>
          
          <Button
            type="submit"
            disabled={!canCreateInstance() || isLoading || !instanceName.trim()}
            className="w-full bg-green-600 hover:bg-green-700 text-white"
          >
            <Plus className="h-4 w-4 mr-2" />
            {isLoading ? 'Criando...' : 'Criar Instância'}
          </Button>
          
          {!canCreateInstance() && (
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
