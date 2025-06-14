
import React from "react";
import { Check, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface RealDataBadgeProps {
  metricas: any;
}

const RealDataBadge: React.FC<RealDataBadgeProps> = ({ metricas }) => {
  // Critério: presence de métricas válidas com valores numéricos recentes
  const isReal =
    metricas && (
      typeof metricas.cpu_usage === 'number'
      && typeof metricas.memoria_usage === 'number'
      && typeof metricas.disco_usage === 'number'
      && metricas.cpu_usage > 0 // evita valores sempre zerados
      && metricas.memoria_usage > 0
    );

  return isReal ? (
    <Badge variant="default" className="bg-green-500 text-white flex items-center gap-1" title="Métricas reais do agente">
      <Check className="w-3 h-3" /> dados reais
    </Badge>
  ) : (
    <Badge variant="secondary" className="bg-gray-400 text-white flex items-center gap-1" title="Simulação ou ausente">
      <X className="w-3 h-3" /> simulado
    </Badge>
  );
};

export default RealDataBadge;
