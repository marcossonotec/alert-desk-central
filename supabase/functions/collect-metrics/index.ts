
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

    // 1. Verificar API key - obrigatória e se pertence ao servidor
    const apiKey = req.headers.get('x-api-key') || req.headers.get('apikey');
    if (!apiKey) {
      return new Response(JSON.stringify({ error: "API key necessária no header 'x-api-key'" }), { status: 401, headers: corsHeaders });
    }

    // 2. Receber payload JSON
    let body;
    try {
      body = await req.json();
    } catch (err) {
      console.error("Payload inválido:", err);
      return new Response(JSON.stringify({ error: "Payload inválido: precisa ser um JSON válido" }), { status: 400, headers: corsHeaders });
    }

    const {
      servidor_id,
      aplicacao_id,
      tipo_servidor,
      metricas,
      timestamp = new Date().toISOString()
    } = body;

    if (!servidor_id && !aplicacao_id) {
      return new Response(JSON.stringify({ error: "Informe servidor_id OU aplicacao_id" }), { status: 400, headers: corsHeaders });
    }

    // 3. Checar servidor e API key
    if (servidor_id) {
      const { data: servidor, error: errorServidor } = await supabase
        .from('servidores')
        .select('*')
        .eq('id', servidor_id)
        .eq('api_key', apiKey)
        .maybeSingle();

      if (errorServidor || !servidor) {
        return new Response(JSON.stringify({ error: "Servidor não encontrado ou API key inválida" }), { status: 403, headers: corsHeaders });
      }

      // 4. Salvar métricas do servidor -- agora vindas do agente real!
      const metricasObj = {
        servidor_id,
        cpu_usage: metricas?.cpu,
        memoria_usage: metricas?.memoria,
        disco_usage: metricas?.disco,
        rede_in: metricas?.rede_in || 0,
        rede_out: metricas?.rede_out || 0,
        uptime: metricas?.uptime ? String(metricas?.uptime) : '0',
        timestamp
      };
      const { error: metricasError } = await supabase.from('metricas').insert(metricasObj);
      if (metricasError) {
        console.error('Erro ao salvar métricas do servidor:', metricasError);
        return new Response(JSON.stringify({ error: metricasError.message }), { status: 500, headers: corsHeaders });
      }

      // Disparar possíveis alertas
      // (mantém chamada para trigger-alerts conforme já implementado)
      const metricasParaVerificar = [
        { tipo: 'cpu_usage', valor: metricasObj.cpu_usage },
        { tipo: 'memoria_usage', valor: metricasObj.memoria_usage },
        { tipo: 'disco_usage', valor: metricasObj.disco_usage }
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
            console.error('Erro ao acionar alerta:', alertError);
          }
        }
      }
    }

    // 5. Se for aplicação
    if (aplicacao_id) {
      const { data: aplicacao, error: errorAplicacao } = await supabase
        .from('aplicacoes')
        .select('*, servidores(api_key)')
        .eq('id', aplicacao_id)
        .single();

      if (errorAplicacao || !aplicacao || aplicacao.servidores?.api_key !== apiKey) {
        return new Response(JSON.stringify({ error: "Aplicação não encontrada ou API key inválida" }), { status: 403, headers: corsHeaders });
      }

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
        return new Response(JSON.stringify({ error: appMetricasError.message }), { status: 500, headers: corsHeaders });
      }

      // Disparar possíveis alertas para aplicações
      // Exemplo: response_time
      if (metricas?.response_time) {
        try {
          await supabase.functions.invoke('trigger-alerts', {
            body: {
              aplicacao_id,
              tipo_metrica: 'response_time',
              valor_atual: metricas.response_time
            }
          });
        } catch (alertError) {
          console.error('Erro ao acionar alerta da aplicação:', alertError);
        }
      }
    }

    // Resposta final
    return new Response(
      JSON.stringify({
        success: true,
        message: 'Métricas coletadas com sucesso (dados reais)',
        received: {
          servidor_id, aplicacao_id, tipo_servidor, metricas,
        },
        timestamp
      }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );

  } catch (error: any) {
    console.error('Erro na coleta de métricas:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
