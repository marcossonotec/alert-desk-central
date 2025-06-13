
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Copy, Download, Server, Code } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const SimpleMonitoringGuide = () => {
  const [selectedServer, setSelectedServer] = useState('');
  const [apiKey, setApiKey] = useState('');
  const { toast } = useToast();

  const bashScript = `#!/bin/bash

# Script de Monitoramento Simples - DeskTools
# Coleta métricas básicas do servidor e envia para a plataforma

API_KEY="${apiKey || 'SUA_API_KEY_AQUI'}"
SERVIDOR_ID="${selectedServer || 'SEU_SERVIDOR_ID_AQUI'}"
API_URL="https://obclzswvwjslxexskvcf.supabase.co/functions/v1/collect-metrics"

# Função para coletar métricas
collect_metrics() {
    # CPU Usage
    CPU_USAGE=$(top -bn1 | grep "Cpu(s)" | awk '{print $2}' | awk -F'%' '{print $1}')
    
    # Memory Usage
    MEMORY_INFO=$(free | grep '^Mem:')
    MEMORY_TOTAL=$(echo $MEMORY_INFO | awk '{print $2}')
    MEMORY_USED=$(echo $MEMORY_INFO | awk '{print $3}')
    MEMORY_USAGE=$(echo "scale=2; ($MEMORY_USED * 100) / $MEMORY_TOTAL" | bc)
    
    # Disk Usage
    DISK_USAGE=$(df -h / | awk 'NR==2 {print $5}' | sed 's/%//')
    
    # Network (optional)
    NETWORK_IN=$(cat /proc/net/dev | grep eth0 | awk '{print $2}' || echo "0")
    NETWORK_OUT=$(cat /proc/net/dev | grep eth0 | awk '{print $10}' || echo "0")
    
    # Uptime
    UPTIME=$(uptime -p)
    
    # Criar JSON
    JSON_DATA=$(cat <<EOF
{
    "servidor_id": "$SERVIDOR_ID",
    "metricas": {
        "cpu": $CPU_USAGE,
        "memoria": $MEMORY_USAGE,
        "disco": $DISK_USAGE,
        "rede_in": $NETWORK_IN,
        "rede_out": $NETWORK_OUT,
        "uptime": "$UPTIME"
    }
}
EOF
)
    
    # Enviar dados
    curl -X POST "$API_URL" \\
         -H "Content-Type: application/json" \\
         -H "x-api-key: $API_KEY" \\
         -d "$JSON_DATA"
    
    echo "Métricas enviadas em $(date)"
}

# Executar coleta
collect_metrics
`;

  const pythonScript = `#!/usr/bin/env python3
"""
Script de Monitoramento Simples - DeskTools
Coleta métricas básicas do servidor usando psutil
"""

import psutil
import requests
import json
import time
from datetime import datetime

API_KEY = "${apiKey || 'SUA_API_KEY_AQUI'}"
SERVIDOR_ID = "${selectedServer || 'SEU_SERVIDOR_ID_AQUI'}"
API_URL = "https://obclzswvwjslxexskvcf.supabase.co/functions/v1/collect-metrics"

def collect_metrics():
    """Coleta métricas do sistema"""
    try:
        # CPU Usage
        cpu_usage = psutil.cpu_percent(interval=1)
        
        # Memory Usage
        memory = psutil.virtual_memory()
        memory_usage = memory.percent
        
        # Disk Usage
        disk = psutil.disk_usage('/')
        disk_usage = disk.percent
        
        # Network
        network = psutil.net_io_counters()
        network_in = network.bytes_recv
        network_out = network.bytes_sent
        
        # Uptime
        boot_time = psutil.boot_time()
        uptime_seconds = time.time() - boot_time
        uptime_hours = uptime_seconds / 3600
        
        # Dados para envio
        data = {
            "servidor_id": SERVIDOR_ID,
            "metricas": {
                "cpu": cpu_usage,
                "memoria": memory_usage,
                "disco": disk_usage,
                "rede_in": network_in,
                "rede_out": network_out,
                "uptime": f"{uptime_hours:.1f} hours"
            }
        }
        
        # Enviar dados
        headers = {
            "Content-Type": "application/json",
            "x-api-key": API_KEY
        }
        
        response = requests.post(API_URL, json=data, headers=headers)
        
        if response.status_code == 200:
            print(f"Métricas enviadas com sucesso em {datetime.now()}")
        else:
            print(f"Erro ao enviar métricas: {response.status_code} - {response.text}")
            
    except Exception as e:
        print(f"Erro na coleta de métricas: {e}")

if __name__ == "__main__":
    collect_metrics()
`;

  const copyToClipboard = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copiado!",
      description: `Script ${type} copiado para a área de transferência.`,
    });
  };

  const downloadScript = (content: string, filename: string) => {
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast({
      title: "Download iniciado!",
      description: `Script ${filename} baixado com sucesso.`,
    });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Code className="h-5 w-5" />
            Monitoramento Simplificado para VPS
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="servidor">ID do Servidor</Label>
              <Input
                id="servidor"
                placeholder="ID do servidor"
                value={selectedServer}
                onChange={(e) => setSelectedServer(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="apikey">API Key do Servidor</Label>
              <Input
                id="apikey"
                placeholder="API Key"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
              />
            </div>
          </div>
          
          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
            <h4 className="font-medium mb-2">Como usar:</h4>
            <ol className="list-decimal list-inside space-y-1 text-sm">
              <li>Configure um servidor na plataforma e copie o ID e API Key</li>
              <li>Escolha entre o script Bash ou Python abaixo</li>
              <li>Baixe o script e instale em sua VPS</li>
              <li>Configure um cron job para executar a cada 5 minutos</li>
              <li>As métricas aparecerão automaticamente no dashboard</li>
            </ol>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Script Bash */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Server className="h-4 w-4" />
                Script Bash (Linux)
              </div>
              <Badge variant="secondary">Recomendado</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              value={bashScript}
              readOnly
              className="font-mono text-xs h-64"
            />
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => copyToClipboard(bashScript, 'Bash')}
                className="flex items-center gap-2"
              >
                <Copy className="h-4 w-4" />
                Copiar
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => downloadScript(bashScript, 'monitor.sh')}
                className="flex items-center gap-2"
              >
                <Download className="h-4 w-4" />
                Baixar
              </Button>
            </div>
            <div className="text-xs text-muted-foreground">
              <strong>Instalação:</strong><br/>
              1. <code>chmod +x monitor.sh</code><br/>
              2. <code>crontab -e</code><br/>
              3. Adicionar: <code>*/5 * * * * /path/to/monitor.sh</code>
            </div>
          </CardContent>
        </Card>

        {/* Script Python */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Server className="h-4 w-4" />
              Script Python (Avançado)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              value={pythonScript}
              readOnly
              className="font-mono text-xs h-64"
            />
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => copyToClipboard(pythonScript, 'Python')}
                className="flex items-center gap-2"
              >
                <Copy className="h-4 w-4" />
                Copiar
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => downloadScript(pythonScript, 'monitor.py')}
                className="flex items-center gap-2"
              >
                <Download className="h-4 w-4" />
                Baixar
              </Button>
            </div>
            <div className="text-xs text-muted-foreground">
              <strong>Instalação:</strong><br/>
              1. <code>pip install psutil requests</code><br/>
              2. <code>chmod +x monitor.py</code><br/>
              3. <code>crontab -e</code><br/>
              4. Adicionar: <code>*/5 * * * * /usr/bin/python3 /path/to/monitor.py</code>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Healthcheck simples */}
      <Card>
        <CardHeader>
          <CardTitle>Healthcheck de Aplicações Web</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Para monitorar aplicações web simples, você pode adicionar esta função ao script:
            </p>
            <Textarea
              value={`# Adicione esta função ao script bash ou python
check_application() {
    APP_URL="http://localhost:3000"  # URL da sua aplicação
    APP_ID="SEU_APP_ID_AQUI"
    
    RESPONSE_TIME=$(curl -o /dev/null -s -w "%{time_total}" $APP_URL)
    STATUS_CODE=$(curl -o /dev/null -s -w "%{http_code}" $APP_URL)
    
    if [ "$STATUS_CODE" -eq 200 ]; then
        APP_STATUS="online"
    else
        APP_STATUS="offline"
    fi
    
    # Enviar dados da aplicação
    curl -X POST "$API_URL" \\
         -H "Content-Type: application/json" \\
         -H "x-api-key: $API_KEY" \\
         -d "{
             \\"aplicacao_id\\": \\"$APP_ID\\",
             \\"metricas\\": {
                 \\"response_time\\": $RESPONSE_TIME,
                 \\"status_code\\": $STATUS_CODE,
                 \\"status\\": \\"$APP_STATUS\\"
             }
         }"
}`}
              readOnly
              className="font-mono text-xs h-32"
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SimpleMonitoringGuide;
