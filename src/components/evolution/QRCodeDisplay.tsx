
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { QrCode } from 'lucide-react';

interface QRCodeDisplayProps {
  qrCode: string | null;
  instanceName: string;
}

const QRCodeDisplay: React.FC<QRCodeDisplayProps> = ({ qrCode, instanceName }) => {
  if (!qrCode) return null;

  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <CardTitle className="text-lg flex items-center space-x-2">
          <QrCode className="h-5 w-5" />
          <span>QR Code - {instanceName}</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="text-center">
        <div className="bg-white p-4 rounded-lg inline-block mb-4">
          <img 
            src={qrCode} 
            alt="QR Code para conectar WhatsApp" 
            className="w-64 h-64 mx-auto"
          />
        </div>
        <p className="text-sm text-muted-foreground">
          Escaneie este QR Code com seu WhatsApp para conectar a instância.
        </p>
      </CardContent>
    </Card>
  );
};

export default QRCodeDisplay;
