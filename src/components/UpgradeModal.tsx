
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

  const handleUpgrade = async (planeName: string) => {
    setIsLoading(true);
    try {
      // Aqui você implementaria a integração com o gateway de pagamento
      toast({
        title: "Upgrade solicitado",
        description: `Solicitação de upgrade para o plano ${planeName} enviada. Você será redirecionado para o pagamento.`,
      });
      onClose();
    } catch (error: any) {
      console.error('Erro ao solicitar upgrade:', error);
      toast({
        title: "Erro no upgrade",
        description: "Não foi possível processar a solicitação de upgrade.",
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
    if (recursos.alertas_whatsapp) features.push("Alertas WhatsApp");
    if (recursos.suporte_prioritario) features.push("Suporte prioritário");
    if (recursos.duracao_dias) features.push(`${recursos.duracao_dias} dias grátis`);
    
    return features;
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
                  {plan.nome === 'free' ? 'Gratuito' : plan.nome}
                </CardTitle>
                <div className="text-3xl font-bold text-gray-900 dark:text-white">
                  {plan.preco_mensal === 0 ? 'Grátis' : `R$ ${plan.preco_mensal}`}
                  {plan.preco_mensal > 0 && (
                    <span className="text-sm text-gray-600 dark:text-gray-400">/mês</span>
                  )}
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Até {plan.max_servidores} servidor{plan.max_servidores > 1 ? 'es' : ''}
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
                  onClick={() => handleUpgrade(plan.nome)}
                  disabled={isLoading || currentPlan === plan.nome}
                  className={`w-full ${
                    currentPlan === plan.nome
                      ? 'bg-gray-400 cursor-not-allowed'
                      : plan.nome === 'profissional'
                      ? 'bg-blue-600 hover:bg-blue-700'
                      : 'bg-gray-600 hover:bg-gray-700'
                  } text-white`}
                >
                  {currentPlan === plan.nome 
                    ? 'Plano Atual' 
                    : plan.nome === 'free' 
                    ? 'Começar Grátis' 
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
