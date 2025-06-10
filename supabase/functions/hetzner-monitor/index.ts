
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface HetznerServerMetrics {
  cpu_usage: number;
  memory_usage: number;
  disk_usage: number;
  network_in: number;
  network_out: number;
  uptime: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Lidar com requisições CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    if (req.method === 'POST') {
      // Receber métricas do webhook
      const { servidor_id, metrics } = await req.json();
      
      console.log('Recebendo métricas do servidor:', servidor_id);
      
      // Salvar métricas no banco de dados
      const { error: metricsError } = await supabase
        .from('metricas')
        .insert({
          servidor_id,
          cpu_usage: metrics.cpu_usage,
          memoria_usage: metrics.memory_usage,
          disco_usage: metrics.disk_usage,
          rede_in: metrics.network_in,
          rede_out: metrics.network_out,
          uptime: metrics.uptime,
          timestamp: new Date().toISOString()
        });

      if (metricsError) {
        throw metricsError;
      }

      // Verificar alertas configurados
      await checkAndTriggerAlerts(supabase, servidor_id, metrics);

      return new Response(
        JSON.stringify({ success: true, message: 'Métricas salvas com sucesso' }),
        { 
          status: 200, 
          headers: { 'Content-Type': 'application/json', ...corsHeaders } 
        }
      );
    }

    if (req.method === 'GET') {
      // Coletar métricas de todos os servidores Hetzner
      const { data: servidores, error } = await supabase
        .from('servidores')
        .select('*')
        .eq('provedor', 'hetzner');

      if (error) {
        throw error;
      }

      const results = [];
      
      for (const servidor of servidores || []) {
        try {
          const metrics = await collectHetznerMetrics(servidor);
          
          // Salvar métricas
          const { error: metricsError } = await supabase
            .from('metricas')
            .insert({
              servidor_id: servidor.id,
              cpu_usage: metrics.cpu_usage,
              memoria_usage: metrics.memory_usage,
              disco_usage: metrics.disk_usage,
              rede_in: metrics.network_in,
              rede_out: metrics.network_out,
              uptime: metrics.uptime
            });

          if (metricsError) {
            console.error('Erro ao salvar métricas:', metricsError);
          }

          // Verificar alertas
          await checkAndTriggerAlerts(supabase, servidor.id, metrics);
          
          results.push({
            servidor_id: servidor.id,
            nome: servidor.nome,
            status: 'coletado',
            metrics
          });

        } catch (error) {
          console.error(`Erro ao coletar métricas do servidor ${servidor.nome}:`, error);
          results.push({
            servidor_id: servidor.id,
            nome: servidor.nome,
            status: 'erro',
            error: error.message
          });
        }
      }

      return new Response(
        JSON.stringify({ success: true, results }),
        { 
          status: 200, 
          headers: { 'Content-Type': 'application/json', ...corsHeaders } 
        }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Método não permitido' }),
      { 
        status: 405, 
        headers: { 'Content-Type': 'application/json', ...corsHeaders } 
      }
    );

  } catch (error: any) {
    console.error('Erro na função hetzner-monitor:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500, 
        headers: { 'Content-Type': 'application/json', ...corsHeaders } 
      }
    );
  }
};

async function collectHetznerMetrics(servidor: any): Promise<HetznerServerMetrics> {
  const hetznerApiKey = Deno.env.get('HETZNER_API_KEY');
  
  if (!hetznerApiKey) {
    throw new Error('HETZNER_API_KEY não configurada');
  }

  // Simular coleta de métricas da API da Hetzner
  // Em produção, você faria chamadas reais para a API da Hetzner
  console.log(`Coletando métricas do servidor Hetzner: ${servidor.nome} (${servidor.ip})`);
  
  // Exemplo de chamada real para a API da Hetzner:
  // const response = await fetch(`https://api.hetzner.cloud/v1/servers/${servidor.hetzner_id}/metrics`, {
  //   headers: {
  //     'Authorization': `Bearer ${hetznerApiKey}`,
  //     'Content-Type': 'application/json'
  //   }
  // });
  
  // Para demonstração, retornamos dados simulados
  return {
    cpu_usage: Math.random() * 100,
    memory_usage: Math.random() * 100,
    disk_usage: Math.random() * 100,
    network_in: Math.floor(Math.random() * 1000000),
    network_out: Math.floor(Math.random() * 1000000),
    uptime: `${Math.floor(Math.random() * 30)}d ${Math.floor(Math.random() * 24)}h ${Math.floor(Math.random() * 60)}m`
  };
}

async function checkAndTriggerAlerts(supabase: any, servidor_id: string, metrics: any) {
  // Buscar alertas configurados para este servidor
  const { data: alertas, error } = await supabase
    .from('alertas')
    .select('*')
    .eq('servidor_id', servidor_id)
    .eq('ativo', true);

  if (error) {
    console.error('Erro ao buscar alertas:', error);
    return;
  }

  for (const alerta of alertas || []) {
    let shouldAlert = false;
    let metricValue = 0;

    switch (alerta.tipo_alerta) {
      case 'cpu':
        metricValue = metrics.cpu_usage;
        shouldAlert = metrics.cpu_usage > alerta.limite_valor;
        break;
      case 'memoria':
        metricValue = metrics.memory_usage;
        shouldAlert = metrics.memory_usage > alerta.limite_valor;
        break;
      case 'disco':
        metricValue = metrics.disk_usage;
        shouldAlert = metrics.disk_usage > alerta.limite_valor;
        break;
    }

    if (shouldAlert) {
      console.log(`Acionando alerta: ${alerta.tipo_alerta} - ${metricValue}% > ${alerta.limite_valor}%`);
      
      // Chamar função de envio de alertas
      await supabase.functions.invoke('send-alerts', {
        body: {
          alerta_id: alerta.id,
          servidor_id,
          tipo_alerta: alerta.tipo_alerta,
          valor_atual: metricValue,
          limite: alerta.limite_valor,
          canais: alerta.canal_notificacao
        }
      });
    }
  }
}

serve(handler);
