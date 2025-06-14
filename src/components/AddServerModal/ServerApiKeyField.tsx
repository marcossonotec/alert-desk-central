
import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Key } from "lucide-react";

interface ServerApiKeyFieldProps {
  apiKeyValue: string;
  onInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

const ServerApiKeyField: React.FC<ServerApiKeyFieldProps> = ({ apiKeyValue, onInputChange }) => (
  <Card className="bg-card/50 border-border">
    <CardHeader className="pb-3">
      <CardTitle className="text-lg flex items-center space-x-2">
        <Key className="h-5 w-5 text-purple-500" />
        <span>API Key</span>
      </CardTitle>
    </CardHeader>
    <CardContent className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="api_key" className="text-foreground">API Key</Label>
        <div className="relative">
          <Key className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            id="api_key"
            name="api_key"
            type="password"
            placeholder="Sua API key para autenticação"
            value={apiKeyValue}
            onChange={onInputChange}
            className="bg-background border-border pl-10"
            required
          />
        </div>
      </div>
    </CardContent>
  </Card>
);

export default ServerApiKeyField;
