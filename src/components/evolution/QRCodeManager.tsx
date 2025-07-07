import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { QrCode, RefreshCw, Copy, CheckCircle, AlertCircle, Timer } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface QRCodeManagerProps {
  instanceId: string;
  instanceName: string;
  isOpen: boolean;
  onClose: () => void;
  onStatusChange?: (status: string) => void;
}

const QRCodeManager: React.FC<QRCodeManagerProps> = ({
  instanceId,
  instanceName,
  isOpen,
  onClose,
  onStatusChange,
}) => {
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState<string>('disconnected');
  const [timeLeft, setTimeLeft] = useState(120); // 2 minutos
  const [progress, setProgress] = useState(0);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const { toast } = useToast();

  // Auto-refresh timer
  useEffect(() => {
    if (!isOpen) return;

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 0) {
          refreshQRCode();
          return 120; // Reset to 2 minutes
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isOpen]);

  // Progress calculation
  useEffect(() => {
    const progressValue = ((120 - timeLeft) / 120) * 100;
    setProgress(progressValue);
  }, [timeLeft]);

  // Status polling
  useEffect(() => {
    if (!isOpen) return;

    const statusInterval = setInterval(() => {
      checkStatus();
    }, 3000); // Check every 3 seconds

    return () => clearInterval(statusInterval);
  }, [isOpen]);

  // Initial load
  useEffect(() => {
    if (isOpen) {
      loadQRCode();
      checkStatus();
    }
  }, [isOpen]);

  const loadQRCode = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase.functions.invoke('evolution-api', {
        body: {
          action: 'get-qr',
          instance_id: instanceId
        }
      });

      if (error) throw error;

      if (data?.success && data.qr_code) {
        setQrCode(data.qr_code);
        setLastRefresh(new Date());
        setTimeLeft(120); // Reset timer
        toast({
          title: "QR Code atualizado",
          description: "Escaneie o código com seu WhatsApp",
        });
      } else {
        throw new Error('QR Code não disponível');
      }
    } catch (error: any) {
      console.error('Erro ao carregar QR Code:', error);
      toast({
        title: "Erro ao carregar QR Code",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const refreshQRCode = useCallback(async () => {
    await loadQRCode();
  }, [instanceId]);

  const checkStatus = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('evolution-api', {
        body: {
          action: 'check-status',
          instance_id: instanceId
        }
      });

      if (error) throw error;

      if (data?.success) {
        const newStatus = data.status;
        setStatus(newStatus);
        onStatusChange?.(newStatus);

        if (newStatus === 'connected') {
          toast({
            title: "🎉 WhatsApp Conectado!",
            description: "Sua instância está pronta para enviar mensagens",
          });
          // Auto-close após 3 segundos quando conectado
          setTimeout(() => {
            onClose();
          }, 3000);
        }
      }
    } catch (error: any) {
      console.error('Erro ao verificar status:', error);
    }
  };

  const copyQRCodeText = async () => {
    if (qrCode) {
      try {
        await navigator.clipboard.writeText(qrCode);
        toast({
          title: "QR Code copiado!",
          description: "Código copiado para a área de transferência",
        });
      } catch (error) {
        toast({
          title: "Erro ao copiar",
          description: "Não foi possível copiar o QR Code",
          variant: "destructive"
        });
      }
    }
  };

  const getStatusBadge = () => {
    switch (status) {
      case 'connected':
        return (
          <Badge className="bg-green-500 text-white animate-pulse">
            <CheckCircle className="w-3 h-3 mr-1" />
            Conectado
          </Badge>
        );
      case 'connecting':
        return (
          <Badge className="bg-yellow-500 text-white">
            <Timer className="w-3 h-3 mr-1 animate-spin" />
            Conectando
          </Badge>
        );
      default:
        return (
          <Badge className="bg-red-500 text-white">
            <AlertCircle className="w-3 h-3 mr-1" />
            Desconectado
          </Badge>
        );
    }
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-fade-in">
      <Card className="bg-card border-border max-w-md w-full mx-4 animate-scale-in">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <QrCode className="h-5 w-5 text-green-600" />
              QR Code - {instanceName}
            </CardTitle>
            {getStatusBadge()}
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {/* Status da Conexão */}
          {status === 'connected' ? (
            <div className="text-center space-y-4">
              <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-2" />
                <h3 className="font-semibold text-green-800">WhatsApp Conectado!</h3>
                <p className="text-sm text-green-600">
                  Sua instância está pronta para enviar mensagens
                </p>
              </div>
            </div>
          ) : (
            <>
              {/* Timer e Progress Bar */}
              <div className="space-y-2">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">Expira em:</span>
                  <span className="font-mono font-semibold">{formatTime(timeLeft)}</span>
                </div>
                <Progress value={progress} className="h-2" />
              </div>

              {/* QR Code Display */}
              {isLoading ? (
                <div className="flex items-center justify-center p-8">
                  <RefreshCw className="h-8 w-8 animate-spin text-primary" />
                  <span className="ml-2">Carregando QR Code...</span>
                </div>
              ) : qrCode ? (
                <div className="space-y-4">
                  <div className="bg-white p-4 rounded-lg border">
                    <img 
                      src={qrCode} 
                      alt="QR Code para conectar WhatsApp" 
                      className="w-full h-auto mx-auto max-w-[240px]"
                    />
                  </div>
                  
                  <div className="text-center space-y-2">
                    <p className="text-sm text-muted-foreground">
                      1. Abra o WhatsApp no seu celular
                    </p>
                    <p className="text-sm text-muted-foreground">
                      2. Toque em Menu ou Configurações
                    </p>
                    <p className="text-sm text-muted-foreground">
                      3. Toque em Aparelhos conectados
                    </p>
                    <p className="text-sm text-muted-foreground">
                      4. Aponte a câmera para este código
                    </p>
                  </div>
                </div>
              ) : (
                <div className="text-center p-8">
                  <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                  <p className="text-muted-foreground">
                    QR Code não disponível. Tente atualizar.
                  </p>
                </div>
              )}

              {/* Last Refresh Info */}
              {lastRefresh && (
                <p className="text-xs text-muted-foreground text-center">
                  Última atualização: {lastRefresh.toLocaleTimeString()}
                </p>
              )}
            </>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2 pt-4 border-t border-border">
            {status !== 'connected' && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={refreshQRCode}
                  disabled={isLoading}
                  className="flex-1"
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                  Atualizar
                </Button>
                
                {qrCode && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={copyQRCodeText}
                    className="flex-1"
                  >
                    <Copy className="h-4 w-4 mr-2" />
                    Copiar
                  </Button>
                )}
              </>
            )}
            
            <Button
              variant={status === 'connected' ? 'default' : 'outline'}
              size="sm"
              onClick={onClose}
              className={status === 'connected' ? 'flex-1 bg-green-600 hover:bg-green-700' : 'flex-1'}
            >
              {status === 'connected' ? 'Continuar' : 'Fechar'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default QRCodeManager;