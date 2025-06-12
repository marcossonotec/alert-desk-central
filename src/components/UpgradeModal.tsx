
import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Check } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentPlan: string;
}

const UpgradeModal: React.FC<UpgradeModalProps> = ({
  isOpen,
  onClose,
  currentPlan,
}) => {
  const [plans, setPlans] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen) {
      loadPlans();
    }
  }, [isOpen]);

  const loadPlans = async () => {
    try {
      const { data, error } = await supabase
        .from('planos_assinatura')
        .select('*')
        .eq('ativo', true)
        .order('preco_mensal', { ascending: true });

      if (error) throw error;
      setPlans(data || []);
    } catch (error: any) {
      console.error('Erro ao carregar planos:', error);
      toast({
        title: "Erro ao carregar planos",
        description: "Não foi possível carregar os planos de assinatura.",
        variant: "destructive"
      });
    }
  };

  const handleUpgrade = async (planeName: string, preco: number) => {
    if (planeName === 'free') {
      toast({
        title: "Plano gratuito",
        description: "Você já pode usar o plano gratuito!",
      });
      return;
    }

    setIsLoading(true);
    
    try {
      // Criar checkout session baseado no gateway configurado
      const { data, error } = await supabase.functions.invoke('create-checkout', {
        body: {
          planeName,
          preco,
          currency: 'BRL'
        }
      });

      if (error) throw error;

      if (data?.url) {
        // Abrir checkout em nova aba
        window.open(data.url, '_blank');
        
        toast({
          title: "Redirecionando para pagamento",
          description: `Você será redirecionado para o checkout do ${planeName}.`,
        });
        
        onClose();
      } else {
        throw new Error('URL de checkout não fornecida');
      }
    } catch (error: any) {
      console.error('Erro ao processar upgrade:', error);
      toast({
        title: "Erro no upgrade",
        description: error.message || "Não foi possível processar a solicitação de upgrade.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getFeatures = (recursos: any) => {
    const features = [];
    
    if (recursos.metricas_basicas) features.push("Métricas básicas");
    if (recursos.metricas_avancadas) features.push("Métricas avançadas");
    if (recursos.alertas_email) features.push("Alertas por email");
    if (recursos.alertas_whatsapp) features.push("1 instância WhatsApp Business");
    if (recursos.suporte_prioritario) features.push("Suporte prioritário");
    if (recursos.duracao_dias) features.push(`${recursos.duracao_dias} dias grátis`);
    
    return features;
  };

  const getMaxServers = (plano: any) => {
    if (plano.nome === 'free') return 1;
    if (plano.nome === 'profissional') return 2;
    if (plano.nome === 'empresarial') return '∞';
    return plano.max_servidores;
  };

  const getPlanPrice = (plano: any) => {
    if (plano.nome === 'free') return 'Grátis';
    if (plano.nome === 'profissional') return 'R$ 99';
    if (plano.nome === 'empresarial') return 'R$ 497';
    return `R$ ${plano.preco_mensal}`;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
        <DialogHeader>
          <DialogTitle className="text-2xl text-center text-gray-900 dark:text-white">
            Escolha seu Plano
          </DialogTitle>
        </DialogHeader>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
          {plans.map((plan) => (
            <Card 
              key={plan.id} 
              className={`relative ${
                plan.nome === 'profissional' 
                  ? 'border-blue-500 dark:border-blue-400 shadow-lg' 
                  : 'border-gray-200 dark:border-gray-700'
              } bg-white dark:bg-gray-800`}
            >
              {plan.nome === 'profissional' && (
                <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-blue-600 text-white">
                  Mais Popular
                </Badge>
              )}
              
              <CardHeader className="text-center">
                <CardTitle className="text-gray-900 dark:text-white capitalize">
                  {plan.nome === 'free' ? 'Gratuito' : 
                   plan.nome === 'profissional' ? 'Profissional' : 
                   plan.nome === 'empresarial' ? 'Empresarial' : plan.nome}
                </CardTitle>
                <div className="text-3xl font-bold text-gray-900 dark:text-white">
                  {getPlanPrice(plan)}
                  {plan.preco_mensal > 0 && (
                    <span className="text-sm text-gray-600 dark:text-gray-400">/mês</span>
                  )}
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Até {getMaxServers(plan)} servidor{getMaxServers(plan) !== 1 && getMaxServers(plan) !== '∞' ? 'es' : getMaxServers(plan) === '∞' ? 'es' : ''}
                </p>
              </CardHeader>
              
              <CardContent>
                <ul className="space-y-3 mb-6">
                  {getFeatures(plan.recursos).map((feature, index) => (
                    <li key={index} className="flex items-center text-gray-700 dark:text-gray-300">
                      <Check className="h-4 w-4 text-green-500 mr-2" />
                      {feature}
                    </li>
                  ))}
                </ul>
                
                <Button
                  onClick={() => handleUpgrade(plan.nome, plan.preco_mensal)}
                  disabled={isLoading || currentPlan === plan.nome}
                  className={`w-full ${
                    currentPlan === plan.nome
                      ? 'bg-gray-400 cursor-not-allowed'
                      : plan.nome === 'profissional'
                      ? 'bg-blue-600 hover:bg-blue-700'
                      : plan.nome === 'empresarial'
                      ? 'bg-purple-600 hover:bg-purple-700'
                      : 'bg-gray-600 hover:bg-gray-700'
                  } text-white`}
                >
                  {currentPlan === plan.nome 
                    ? 'Plano Atual' 
                    : plan.nome === 'free' 
                    ? 'Começar Grátis' 
                    : isLoading
                    ? 'Processando...'
                    : 'Escolher Plano'
                  }
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default UpgradeModal;
