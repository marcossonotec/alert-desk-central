
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Server, Globe, Cloud } from 'lucide-react';

interface ServerBasicInfoProps {
  formData: {
    nome: string;
    ip: string;
    provedor: string;
    status: string;
  };
  onInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  onProviderChange: (value: string) => void;
  onStatusChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
}

const provedores = [
  { value: "hetzner", label: "Hetzner Cloud" },
  { value: "aws", label: "Amazon AWS" },
  { value: "digitalocean", label: "DigitalOcean" },
  { value: "vultr", label: "Vultr" },
  { value: "linode", label: "Linode" },
  { value: "outros", label: "Outros" },
];

const statusOptions = [
  { value: "ativo", label: "Ativo" },
  { value: "inativo", label: "Inativo" },
  { value: "manutencao", label: "Manutenção" },
];

const ServerBasicInfo: React.FC<ServerBasicInfoProps> = ({
  formData,
  onInputChange,
  onProviderChange,
  onStatusChange,
}) => {
  return (
    <Card className="bg-card/50 border-border">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center space-x-2 text-foreground">
          <Server className="h-5 w-5 text-primary" />
          <span>Informações do Servidor</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="nome" className="text-foreground">Nome do Servidor</Label>
            <Input
              id="nome"
              name="nome"
              value={formData.nome}
              onChange={onInputChange}
              className="bg-background border-border text-foreground"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="ip" className="text-foreground">Endereço IP</Label>
            <div className="relative">
              <Globe className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="ip"
                name="ip"
                value={formData.ip}
                onChange={onInputChange}
                className="bg-background border-border text-foreground pl-10"
                required
              />
            </div>
          </div>
        </div>
        <div className="space-y-2">
          <Label className="text-foreground">Provedor</Label>
          <div className="relative">
            <Cloud className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground z-10" />
            <select
              name="provedor"
              id="provedor"
              value={formData.provedor}
              onChange={e => onProviderChange(e.target.value)}
              className="w-full p-2 bg-background border border-border rounded-md text-foreground focus:outline-none focus:ring-2 focus:ring-primary pl-10"
            >
              {provedores.map((prov) => (
                <option key={prov.value} value={prov.value}>{prov.label}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="space-y-2">
          <Label className="text-foreground">Status</Label>
          <select
            id="status"
            name="status"
            value={formData.status}
            onChange={onStatusChange}
            className="w-full p-2 bg-background border border-border rounded-md text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          >
            {statusOptions.map((status) => (
              <option key={status.value} value={status.value}>
                {status.label}
              </option>
            ))}
          </select>
        </div>
      </CardContent>
    </Card>
  );
};

export default ServerBasicInfo;
