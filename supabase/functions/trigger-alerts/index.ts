
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
      servidor_id, 
      aplicacao_id, 
      tipo_metrica, 
      valor_atual 
    } = await req.json();

    console.log('Verificando alertas para:', { servidor_id, aplicacao_id, tipo_metrica, valor_atual });

    // Buscar alertas ativos para o servidor ou aplicação
    let alertQuery = supabase
      .from('alertas')
      .select('*')
      .eq('ativo', true)
      .eq('tipo_alerta', tipo_metrica);

    if (servidor_id) {
      alertQuery = alertQuery.eq('servidor_id', servidor_id);
    } else if (aplicacao_id) {
      alertQuery = alertQuery.eq('aplicacao_id', aplicacao_id);
    }

    const { data: alertas, error } = await alertQuery;

    if (error) {
      console.error('Erro ao buscar alertas:', error);
      throw error;
    }

    console.log(`Encontrados ${alertas?.length || 0} alertas para verificar`);

    let alertasDisparados = 0;

    for (const alerta of alertas || []) {
      // Verificar se o valor atual excede o limite
      if (valor_atual >= alerta.limite_valor) {
        console.log(`Disparando alerta ${alerta.id} - valor ${valor_atual} >= limite ${alerta.limite_valor}`);

        try {
          // Chamar função de envio de alertas
          const { error: sendError } = await supabase.functions.invoke('send-alerts', {
            body: {
              alerta_id: alerta.id,
              servidor_id: servidor_id || null,
              aplicacao_id: aplicacao_id || null,
              tipo_alerta: tipo_metrica,
              valor_atual,
              limite: alerta.limite_valor
            }
          });

          if (sendError) {
            console.error('Erro ao enviar alerta:', sendError);
          } else {
            alertasDisparados++;
            console.log(`Alerta ${alerta.id} enviado com sucesso`);
          }
        } catch (alertError) {
          console.error('Erro no envio do alerta:', alertError);
        }
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        alertas_verificados: alertas?.length || 0,
        alertas_disparados: alertasDisparados
      }),
      { 
        status: 200, 
        headers: { 'Content-Type': 'application/json', ...corsHeaders } 
      }
    );

  } catch (error: any) {
    console.error('Erro na verificação de alertas:', error);
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
