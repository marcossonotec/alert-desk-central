
import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface ServerBasicInfoFieldsProps {
  formData: {
    nome: string;
    ip: string;
    provedor: string;
  };
  onInputChange: (field: string, value: string) => void;
}

const ServerBasicInfoFields: React.FC<ServerBasicInfoFieldsProps> = ({
  formData,
  onInputChange,
}) => {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="nome">Nome do Servidor</Label>
        <Input
          id="nome"
          value={formData.nome}
          onChange={(e) => onInputChange('nome', e.target.value)}
          placeholder="Ex: Servidor Web Produção"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="ip">Endereço IP</Label>
        <Input
          id="ip"
          value={formData.ip}
          onChange={(e) => onInputChange('ip', e.target.value)}
          placeholder="192.168.1.100"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="provedor">Provedor</Label>
        <Select value={formData.provedor} onValueChange={(value) => onInputChange('provedor', value)}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="hetzner">Hetzner Cloud</SelectItem>
            <SelectItem value="aws">Amazon Web Services</SelectItem>
            <SelectItem value="digitalocean">DigitalOcean</SelectItem>
            <SelectItem value="vultr">Vultr</SelectItem>
            <SelectItem value="linode">Linode</SelectItem>
            <SelectItem value="outros">Outros</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};

export default ServerBasicInfoFields;
