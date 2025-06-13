
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-api-key',
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Verificar API key para autenticação simples
    const apiKey = req.headers.get('x-api-key');
    if (!apiKey) {
      throw new Error('API key necessária');
    }

    const { 
      servidor_id,
      aplicacao_id,
      tipo_servidor,
      metricas,
      timestamp = new Date().toISOString()
    } = await req.json();

    console.log('Coletando métricas:', { servidor_id, aplicacao_id, tipo_servidor, metricas });

    // Verificar se o servidor existe e pertence ao usuário com essa API key
    if (servidor_id) {
      const { data: servidor, error } = await supabase
        .from('servidores')
        .select('*')
        .eq('id', servidor_id)
        .eq('api_key', apiKey)
        .single();

      if (error || !servidor) {
        throw new Error('Servidor não encontrado ou API key inválida');
      }

      // Salvar métricas do servidor
      const { error: metricasError } = await supabase
        .from('metricas')
        .insert({
          servidor_id,
          cpu_usage: metricas.cpu,
          memoria_usage: metricas.memoria,
          disco_usage: metricas.disco,
          rede_in: metricas.rede_in || 0,
          rede_out: metricas.rede_out || 0,
          uptime: metricas.uptime || '0',
          timestamp
        });

      if (metricasError) {
        console.error('Erro ao salvar métricas do servidor:', metricasError);
        throw metricasError;
      }

      // Verificar alertas para cada métrica
      const metricasParaVerificar = [
        { tipo: 'cpu_usage', valor: metricas.cpu },
        { tipo: 'memoria_usage', valor: metricas.memoria },
        { tipo: 'disco_usage', valor: metricas.disco }
      ];

      for (const metrica of metricasParaVerificar) {
        if (metrica.valor !== undefined && metrica.valor !== null) {
          try {
            await supabase.functions.invoke('trigger-alerts', {
              body: {
                servidor_id,
                tipo_metrica: metrica.tipo,
                valor_atual: metrica.valor
              }
            });
          } catch (alertError) {
            console.error('Erro ao verificar alertas:', alertError);
          }
        }
      }
    }

    // Se for métrica de aplicação
    if (aplicacao_id) {
      const { data: aplicacao, error } = await supabase
        .from('aplicacoes')
        .select('*, servidores(api_key)')
        .eq('id', aplicacao_id)
        .single();

      if (error || !aplicacao || aplicacao.servidores?.api_key !== apiKey) {
        throw new Error('Aplicação não encontrada ou API key inválida');
      }

      // Salvar métricas da aplicação
      const { error: appMetricasError } = await supabase
        .from('aplicacao_metricas')
        .insert({
          aplicacao_id,
          tipo_metrica: tipo_servidor || 'custom',
          valor: metricas,
          timestamp
        });

      if (appMetricasError) {
        console.error('Erro ao salvar métricas da aplicação:', appMetricasError);
        throw appMetricasError;
      }

      // Verificar alertas específicos da aplicação se houver
      if (metricas.response_time) {
        try {
          await supabase.functions.invoke('trigger-alerts', {
            body: {
              aplicacao_id,
              tipo_metrica: 'response_time',
              valor_atual: metricas.response_time
            }
          });
        } catch (alertError) {
          console.error('Erro ao verificar alertas da aplicação:', alertError);
        }
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Métricas coletadas com sucesso',
        timestamp 
      }),
      { 
        status: 200, 
        headers: { 'Content-Type': 'application/json', ...corsHeaders } 
      }
    );

  } catch (error: any) {
    console.error('Erro na coleta de métricas:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500, 
        headers: { 'Content-Type': 'application/json', ...corsHeaders } 
      }
    );
  }
};

serve(handler);
