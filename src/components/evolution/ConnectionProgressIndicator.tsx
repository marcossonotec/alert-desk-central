import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Smartphone, 
  QrCode, 
  Wifi, 
  CheckCircle, 
  AlertCircle,
  Timer,
  Zap
} from 'lucide-react';

interface ConnectionProgressIndicatorProps {
  status: string;
  step?: number;
  totalSteps?: number;
}

const ConnectionProgressIndicator: React.FC<ConnectionProgressIndicatorProps> = ({
  status,
  step = 0,
  totalSteps = 4
}) => {
  const getStepInfo = () => {
    switch (status) {
      case 'connecting':
        return {
          step: 1,
          icon: <Timer className="h-4 w-4 animate-spin" />,
          title: 'Preparando Instância',
          description: 'Configurando conexão com WhatsApp...',
          color: 'bg-blue-500',
          progress: 25
        };
      case 'qr_ready':
        return {
          step: 2,
          icon: <QrCode className="h-4 w-4" />,
          title: 'QR Code Gerado',
          description: 'Escaneie o código com seu WhatsApp',
          color: 'bg-yellow-500',
          progress: 50
        };
      case 'qr_scanned':
        return {
          step: 3,
          icon: <Smartphone className="h-4 w-4 animate-pulse" />,
          title: 'QR Code Escaneado',
          description: 'Validando conexão...',
          color: 'bg-orange-500',
          progress: 75
        };
      case 'connected':
        return {
          step: 4,
          icon: <CheckCircle className="h-4 w-4" />,
          title: 'Conectado com Sucesso!',
          description: 'WhatsApp pronto para enviar mensagens',
          color: 'bg-green-500',
          progress: 100
        };
      case 'disconnected':
        return {
          step: 0,
          icon: <AlertCircle className="h-4 w-4" />,
          title: 'Desconectado',
          description: 'Inicie a conexão escaneando o QR Code',
          color: 'bg-gray-500',
          progress: 0
        };
      case 'error':
        return {
          step: 0,
          icon: <AlertCircle className="h-4 w-4" />,
          title: 'Erro na Conexão',
          description: 'Tente gerar um novo QR Code',
          color: 'bg-red-500',
          progress: 0
        };
      default:
        return {
          step: 0,
          icon: <Wifi className="h-4 w-4" />,
          title: 'Aguardando',
          description: 'Preparando para conectar...',
          color: 'bg-gray-400',
          progress: 0
        };
    }
  };

  const stepInfo = getStepInfo();
  const steps = [
    { label: 'Inicializar', icon: <Zap className="h-3 w-3" /> },
    { label: 'QR Code', icon: <QrCode className="h-3 w-3" /> },
    { label: 'Escanear', icon: <Smartphone className="h-3 w-3" /> },
    { label: 'Conectado', icon: <Wifi className="h-3 w-3" /> },
  ];

  return (
    <div className="space-y-4">
      {/* Status Badge */}
      <div className="flex items-center justify-center">
        <Badge className={`${stepInfo.color} text-white px-3 py-1 text-sm`}>
          {stepInfo.icon}
          <span className="ml-2">{stepInfo.title}</span>
        </Badge>
      </div>

      {/* Progress Bar */}
      <div className="space-y-2">
        <Progress value={stepInfo.progress} className="h-2" />
        <p className="text-xs text-center text-muted-foreground">
          {stepInfo.description}
        </p>
      </div>

      {/* Step Indicators */}
      <div className="flex items-center justify-between">
        {steps.map((s, index) => {
          const isActive = index < stepInfo.step;
          const isCurrent = index === stepInfo.step - 1;
          
          return (
            <div key={index} className="flex flex-col items-center space-y-1">
              <div className={`
                flex items-center justify-center w-8 h-8 rounded-full border-2 transition-all duration-300
                ${isActive 
                  ? 'bg-primary border-primary text-primary-foreground' 
                  : isCurrent
                    ? 'border-primary text-primary bg-primary/10'
                    : 'border-muted text-muted-foreground bg-muted/10'
                }
                ${isCurrent ? 'scale-110 shadow-lg' : ''}
              `}>
                {isActive ? (
                  <CheckCircle className="h-4 w-4" />
                ) : (
                  s.icon
                )}
              </div>
              <span className={`
                text-xs font-medium transition-colors duration-300
                ${isActive || isCurrent ? 'text-foreground' : 'text-muted-foreground'}
              `}>
                {s.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ConnectionProgressIndicator;