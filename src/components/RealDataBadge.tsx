
import React from "react";
import { Check, X, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface RealDataBadgeProps {
  metricas: any;
}

const RealDataBadge: React.FC<RealDataBadgeProps> = ({ metricas }) => {
  if (!metricas) {
    return (
      <Badge variant="secondary" className="bg-gray-400 text-white flex items-center gap-1" title="Nenhuma métrica disponível">
        <X className="w-3 h-3" /> sem dados
      </Badge>
    );
  }

  // Verifica se os dados são recentes (últimas 10 minutos)
  const isRecent = metricas.timestamp && 
    (new Date().getTime() - new Date(metricas.timestamp).getTime()) < 10 * 60 * 1000;

  // Critério melhorado: dados numéricos válidos + timestamp recente + uptime coerente
  const hasValidMetrics = 
    typeof metricas.cpu_usage === 'number' &&
    typeof metricas.memoria_usage === 'number' &&
    typeof metricas.disco_usage === 'number' &&
    metricas.uptime &&
    metricas.cpu_usage >= 0 &&
    metricas.memoria_usage >= 0 &&
    metricas.disco_usage >= 0;

  // Se dados são válidos e recentes, considera como reais
  // (A API define se são reais ou simulados na coleta)
  const isReal = hasValidMetrics && isRecent;

  if (!hasValidMetrics) {
    return (
      <Badge variant="secondary" className="bg-gray-400 text-white flex items-center gap-1" title="Dados inválidos">
        <X className="w-3 h-3" /> inválido
      </Badge>
    );
  }

  if (!isRecent) {
    return (
      <Badge variant="secondary" className="bg-orange-500 text-white flex items-center gap-1" title="Dados desatualizados">
        <Clock className="w-3 h-3" /> desatualizado
      </Badge>
    );
  }

  return (
    <Badge variant="default" className="bg-green-500 text-white flex items-center gap-1" title="Dados atualizados">
      <Check className="w-3 h-3" /> atualizado
    </Badge>
  );
};

export default RealDataBadge;
