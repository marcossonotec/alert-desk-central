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

  // Mensagem de reforço
  const infoBox = (
    <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-400 dark:border-blue-600 px-5 py-4 rounded-lg mb-4">
      <strong>Importante:</strong> Para <span className="text-primary font-semibold">enviar dados reais do seu servidor</span>, você precisa:
      <ol className="list-decimal ml-5 my-2 space-y-1 text-sm">
        <li>Configurar um servidor e, ao cadastrá-lo, <span className="font-bold text-primary">copiar a API Key exclusiva gerada</span> e o <span className="font-bold">ID do Servidor</span> (ambos estão na plataforma).</li>
        <li>Instalar e agendar o script abaixo <b>no seu servidor real</b>.</li>
        <li>Não serão aceitos dados simulados. O monitoramento só funciona se o agente enviar métricas genuínas usando sua API Key.</li>
      </ol>
      <span className="text-xs text-muted-foreground">Atenção: Sem a API Key correta, seus dados não serão recebidos!</span>
    </div>
  );

  // Adiciona aviso se os campos obrigatórios não estiverem preenchidos
  const shouldWarn = !selectedServer || !apiKey;

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
    collect_metrics();
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
            Guia de Monitoramento Real para VPS
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {infoBox}
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
          {shouldWarn && (
            <div className="bg-yellow-50 dark:bg-yellow-900/10 text-yellow-700 dark:text-yellow-400 rounded px-4 py-2 mt-2 text-xs mb-2">
              Preencha o <strong>ID do Servidor</strong> e a <strong>API Key</strong> antes de copiar ou baixar o script.
            </div>
          )}
          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
            <h4 className="font-medium mb-2">Como usar:</h4>
            <ol className="list-decimal list-inside space-y-1 text-sm">
              <li>Copie o <b>ID do Servidor</b> e a <b>API Key</b> gerados ao cadastrar seu servidor.</li>
              <li>Personalize o script Bash ou Python abaixo com esses valores.</li>
              <li>Instale e agende como <code>cron</code> na sua VPS.</li>
              <li>As métricas reais aparecerão automaticamente no dashboard.</li>
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
                onClick={() => {
                  if (shouldWarn) {
                    toast({
                      title: "Preencha dados!",
                      description: "ID de servidor e API Key obrigatórios para um script funcional.",
                      variant: "destructive"
                    });
                  } else {
                    navigator.clipboard.writeText(bashScript);
                    toast({
                      title: "Copiado!",
                      description: `Script Bash copiado para a área de transferência.`,
                    });
                  }
                }}
                className="flex items-center gap-2"
              >
                <Copy className="h-4 w-4" />
                Copiar
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  if (shouldWarn) {
                    toast({
                      title: "Preencha dados!",
                      description: "ID de servidor e API Key obrigatórios para um script funcional.",
                      variant: "destructive"
                    });
                  } else {
                    const blob = new Blob([bashScript], { type: 'text/plain' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = 'monitor.sh';
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                    URL.revokeObjectURL(url);

                    toast({
                      title: "Download iniciado!",
                      description: `Script monitor.sh baixado com sucesso.`,
                    });
                  }
                }}
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
                onClick={() => {
                  if (shouldWarn) {
                    toast({
                      title: "Preencha dados!",
                      description: "ID de servidor e API Key obrigatórios para um script funcional.",
                      variant: "destructive"
                    });
                  } else {
                    navigator.clipboard.writeText(pythonScript);
                    toast({
                      title: "Copiado!",
                      description: `Script Python copiado para a área de transferência.`,
                    });
                  }
                }}
                className="flex items-center gap-2"
              >
                <Copy className="h-4 w-4" />
                Copiar
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  if (shouldWarn) {
                    toast({
                      title: "Preencha dados!",
                      description: "ID de servidor e API Key obrigatórios para um script funcional.",
                      variant: "destructive"
                    });
                  } else {
                    const blob = new Blob([pythonScript], { type: 'text/plain' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = 'monitor.py';
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                    URL.revokeObjectURL(url);

                    toast({
                      title: "Download iniciado!",
                      description: `Script monitor.py baixado com sucesso.`,
                    });
                  }
                }}
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
