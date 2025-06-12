
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { 
      aplicacao_id, 
      tipo_aplicacao, 
      metricas 
    } = await req.json();

    console.log('Coletando métricas da aplicação:', { aplicacao_id, tipo_aplicacao });

    // Validar se a aplicação existe
    const { data: aplicacao, error: appError } = await supabase
      .from('aplicacoes')
      .select('*')
      .eq('id', aplicacao_id)
      .single();

    if (appError || !aplicacao) {
      throw new Error('Aplicação não encontrada');
    }

    // Processar métricas baseado no tipo de aplicação
    let processedMetrics = {};

    switch (tipo_aplicacao) {
      case 'nodejs':
        processedMetrics = {
          status: metricas.status || 'unknown',
          response_time: metricas.response_time || 0,
          memory_usage: metricas.memory_usage || 0,
          cpu_usage: metricas.cpu_usage || 0,
          error_count: metricas.error_count || 0,
          uptime: metricas.uptime || 0
        };
        break;

      case 'wordpress':
        processedMetrics = {
          site_status: metricas.site_status || 'unknown',
          response_time: metricas.response_time || 0,
          plugins_active: metricas.plugins_active || 0,
          updates_available: metricas.updates_available || 0,
          disk_usage: metricas.disk_usage || 0,
          database_size: metricas.database_size || 0
        };
        break;

      case 'php':
        processedMetrics = {
          status: metricas.status || 'unknown',
          response_time: metricas.response_time || 0,
          memory_usage: metricas.memory_usage || 0,
          error_count: metricas.error_count || 0,
          session_count: metricas.session_count || 0,
          slow_queries: metricas.slow_queries || 0
        };
        break;

      case 'docker':
        processedMetrics = {
          container_status: metricas.container_status || 'unknown',
          cpu_usage: metricas.cpu_usage || 0,
          memory_usage: metricas.memory_usage || 0,
          network_in: metricas.network_in || 0,
          network_out: metricas.network_out || 0,
          disk_usage: metricas.disk_usage || 0
        };
        break;

      case 'database':
        processedMetrics = {
          status: metricas.status || 'unknown',
          connections_active: metricas.connections_active || 0,
          connections_max: metricas.connections_max || 0,
          slow_queries: metricas.slow_queries || 0,
          database_size: metricas.database_size || 0,
          buffer_pool_usage: metricas.buffer_pool_usage || 0
        };
        break;

      default:
        processedMetrics = metricas;
    }

    // Salvar métricas no banco
    const metricsToSave = [
      {
        aplicacao_id,
        tipo_metrica: 'status',
        valor: { status: processedMetrics.status || processedMetrics.site_status || processedMetrics.container_status }
      },
      {
        aplicacao_id,
        tipo_metrica: 'performance',
        valor: processedMetrics
      }
    ];

    const { error: metricsError } = await supabase
      .from('aplicacao_metricas')
      .insert(metricsToSave);

    if (metricsError) {
      throw metricsError;
    }

    // Verificar alertas se necessário
    await checkApplicationAlerts(supabase, aplicacao_id, processedMetrics);

    return new Response(
      JSON.stringify({ success: true, metrics: processedMetrics }),
      { 
        status: 200, 
        headers: { 'Content-Type': 'application/json', ...corsHeaders } 
      }
    );

  } catch (error: any) {
    console.error('Erro ao coletar métricas da aplicação:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500, 
        headers: { 'Content-Type': 'application/json', ...corsHeaders } 
      }
    );
  }
};

async function checkApplicationAlerts(supabase: any, aplicacaoId: string, metricas: any) {
  // Buscar alertas configurados para esta aplicação
  const { data: alertas } = await supabase
    .from('alertas')
    .select('*')
    .eq('aplicacao_id', aplicacaoId)
    .eq('ativo', true);

  if (!alertas || alertas.length === 0) return;

  for (const alerta of alertas) {
    let shouldAlert = false;
    let valorAtual = 0;

    // Verificar condições de alerta baseado no tipo
    switch (alerta.tipo_alerta) {
      case 'response_time':
        valorAtual = metricas.response_time || 0;
        shouldAlert = valorAtual > alerta.limite_valor;
        break;
      case 'memory_usage':
        valorAtual = metricas.memory_usage || 0;
        shouldAlert = valorAtual > alerta.limite_valor;
        break;
      case 'error_count':
        valorAtual = metricas.error_count || 0;
        shouldAlert = valorAtual > alerta.limite_valor;
        break;
      case 'status':
        shouldAlert = metricas.status === 'down' || metricas.site_status === 'down';
        break;
    }

    if (shouldAlert) {
      // Enviar alerta usando a função existente
      try {
        await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/send-alerts`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`
          },
          body: JSON.stringify({
            alerta_id: alerta.id,
            aplicacao_id: aplicacaoId,
            tipo_alerta: alerta.tipo_alerta,
            valor_atual: valorAtual,
            limite: alerta.limite_valor
          })
        });
      } catch (error) {
        console.error('Erro ao enviar alerta de aplicação:', error);
      }
    }
  }
}

serve(handler);
