import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Server, Cloud, Globe } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import AddProviderTokenInline from "../AddProviderTokenInline";
import { Button } from "@/components/ui/button";

interface ServerBasicInfoFieldsProps {
  formData: any;
  provedores: { value: string; label: string }[];
  providerTokens: any[];
  fetchingTokens: boolean;
  showAddToken: boolean;
  onInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  onProviderChange: (value: string) => void;
  onTokenSelect: (id: string) => void;
  onNewToken: () => void;
  onTokenAdded: (newId?: string) => void;
}

const ServerBasicInfoFields: React.FC<ServerBasicInfoFieldsProps> = ({
  formData,
  provedores,
  providerTokens,
  fetchingTokens,
  showAddToken,
  onInputChange,
  onProviderChange,
  onTokenSelect,
  onNewToken,
  onTokenAdded,
}) => {
  return (
    <Card className="bg-card/50 border-border">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center space-x-2">
          <Server className="h-5 w-5 text-primary" />
          <span>Informações Básicas</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Nome do Servidor */}
          <div className="space-y-2">
            <Label htmlFor="nome" className="text-foreground">Nome do Servidor</Label>
            <Input
              id="nome"
              name="nome"
              placeholder="Ex: Servidor Web 01"
              value={formData.nome}
              onChange={onInputChange}
              className="bg-background border-border"
              required
            />
          </div>
          {/* IP do Servidor */}
          <div className="space-y-2">
            <Label htmlFor="ip" className="text-foreground">IP do Servidor</Label>
            <div className="relative">
              <Globe className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="ip"
                name="ip"
                placeholder="192.168.1.100"
                value={formData.ip}
                onChange={onInputChange}
                className="bg-background border-border pl-10"
                required
              />
            </div>
          </div>
        </div>

        {/* Provedor */}
        <div className="space-y-2">
          <Label className="text-foreground">Provedor</Label>
          <div className="relative">
            <Cloud className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground z-10" />
            <Select value={formData.provedor} onValueChange={onProviderChange}>
              <SelectTrigger className="bg-background border-border pl-10">
                <SelectValue placeholder="Selecione o provedor" />
              </SelectTrigger>
              <SelectContent>
                {provedores.map((provedor) => (
                  <SelectItem key={provedor.value} value={provedor.value}>
                    {provedor.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Token do Provedor */}
        {formData.provedor !== "outros" && (
          <div className="space-y-2">
            <Label className="text-foreground">Token de API do provedor</Label>
            {fetchingTokens ? (
              <div className="text-sm text-muted-foreground">Carregando tokens...</div>
            ) : providerTokens.length > 0 && !showAddToken ? (
              <div className="flex flex-col gap-2">
                <select
                  value={formData.provider_token_id}
                  onChange={e => onTokenSelect(e.target.value)}
                  className="border rounded px-3 py-2"
                  required
                >
                  <option value="" disabled>Selecione um token</option>
                  {providerTokens.map(token => (
                    <option key={token.id} value={token.id}>
                      {token.nickname || token.token.slice(0,5)+"..."+token.token.slice(-4)}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  className="text-xs text-primary underline w-fit pl-1 hover:opacity-80"
                  onClick={onNewToken}
                  style={{ background: "none", border: "none", padding: 0 }}
                >
                  Não tem token? Cadastre aqui
                </button>
              </div>
            ) : (
              <AddProviderTokenInline
                provider={formData.provedor}
                onSuccess={onTokenAdded}
              />
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ServerBasicInfoFields;
