import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface AlertData {
  id: string;
  usuario_id: string;
  servidor_id: string | null;
  evolution_instance_id: string | null;
  tipo_alerta: string;
  limite_valor: number;
  ativo: boolean;
  canal_notificacao: string[];
}

interface MetricData {
  servidor_id: string;
  cpu_usage: number | null;
  memoria_usage: number | null;
  disco_usage: number | null;
  timestamp: string;
}

const handler = async (req: Request): Promise<Response> => {
  console.log('=== ALERT ORCHESTRATOR INICIADO ===', new Date().toISOString());
  
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    await logSystem(supabase, 'info', 'alert-orchestrator', 'Iniciando processamento de alertas', {});

    // 1. Buscar todas as métricas recentes (últimos 5 minutos)
    const { data: metricas, error: metricasError } = await supabase
      .from('metricas')
      .select('*')
      .gte('timestamp', new Date(Date.now() - 5 * 60 * 1000).toISOString())
      .order('timestamp', { ascending: false });

    if (metricasError) {
      await logSystem(supabase, 'error', 'alert-orchestrator', 'Erro ao buscar métricas', { error: metricasError });
      throw metricasError;
    }

    console.log(`📊 Encontradas ${metricas?.length || 0} métricas recentes`);

    // 2. Buscar todos os alertas ativos
    const { data: alertas, error: alertasError } = await supabase
      .from('alertas')
      .select(`
        *,
        servidores!inner(id, nome, usuario_id, status),
        profiles!inner(id, email, nome_completo, whatsapp)
      `)
      .eq('ativo', true);

    if (alertasError) {
      await logSystem(supabase, 'error', 'alert-orchestrator', 'Erro ao buscar alertas', { error: alertasError });
      throw alertasError;
    }

    console.log(`🚨 Encontrados ${alertas?.length || 0} alertas ativos`);

    let alertasProcessados = 0;
    let alertasDisparodNos = 0;

    // 3. Processar cada alerta
    for (const alerta of alertas || []) {
      try {
        alertasProcessados++;

        // Buscar métricas específicas para este servidor
        const metricasServidor = metricas?.filter(m => 
          m.servidor_id === alerta.servidor_id
        ).slice(0, 3); // Últimas 3 métricas

        if (!metricasServidor || metricasServidor.length === 0) {
          console.log(`⚠️ Nenhuma métrica encontrada para servidor ${alerta.servidor_id}`);
          continue;
        }

        // Verificar se o alerta deve ser disparado
        const shouldTrigger = await checkAlertCondition(alerta, metricasServidor[0]);
        
        if (shouldTrigger) {
          // Verificar cooldown
          const isInCooldown = await checkAlertCooldown(supabase, alerta);
          
          if (!isInCooldown) {
            // Disparar alerta
            await triggerAlert(supabase, alerta, metricasServidor[0]);
            alertasDisparodNos++;
            
            // Registrar cooldown
            await registerAlertCooldown(supabase, alerta);
            
            await logSystem(supabase, 'info', 'alert-orchestrator', 
              `Alerta disparado: ${alerta.tipo_alerta}`, 
              { 
                alerta_id: alerta.id, 
                servidor_id: alerta.servidor_id,
                valor_atual: getCurrentMetricValue(alerta, metricasServidor[0])
              }
            );
          } else {
            console.log(`⏰ Alerta ${alerta.id} em cooldown`);
          }
        }

      } catch (alertError) {
        console.error(`❌ Erro ao processar alerta ${alerta.id}:`, alertError);
        await logSystem(supabase, 'error', 'alert-orchestrator', 
          `Erro ao processar alerta ${alerta.id}`, 
          { error: alertError.message, alerta_id: alerta.id }
        );
      }
    }

    await logSystem(supabase, 'info', 'alert-orchestrator', 
      'Processamento de alertas concluído', 
      { 
        alertas_processados: alertasProcessados,
        alertas_disparados: alertasDisparodNos,
        metricas_analisadas: metricas?.length || 0
      }
    );

    console.log(`✅ Processamento concluído: ${alertasProcessados} alertas processados, ${alertasDisparodNos} disparados`);

    return new Response(
      JSON.stringify({ 
        success: true,
        alertas_processados: alertasProcessados,
        alertas_disparados: alertasDisparodNos,
        metricas_analisadas: metricas?.length || 0,
        timestamp: new Date().toISOString()
      }),
      { 
        status: 200, 
        headers: { 'Content-Type': 'application/json', ...corsHeaders } 
      }
    );

  } catch (error: any) {
    console.error('❌ ERRO CRÍTICO em alert-orchestrator:', error);
    
    try {
      const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
      await logSystem(supabase, 'error', 'alert-orchestrator', 
        `Erro crítico: ${error.message}`, 
        { stack: error.stack?.substring(0, 500) }
      );
    } catch (logError) {
      console.error('❌ Erro ao registrar log:', logError);
    }
    
    return new Response(
      JSON.stringify({ 
        error: error.message,
        timestamp: new Date().toISOString(),
        success: false
      }),
      { 
        status: 500, 
        headers: { 'Content-Type': 'application/json', ...corsHeaders } 
      }
    );
  }
};

async function checkAlertCondition(alerta: any, metrica: MetricData): Promise<boolean> {
  const currentValue = getCurrentMetricValue(alerta, metrica);
  
  if (currentValue === null) {
    return false;
  }

  // Verificar se o valor atual excede o limite
  return currentValue >= alerta.limite_valor;
}

function getCurrentMetricValue(alerta: any, metrica: MetricData): number | null {
  switch (alerta.tipo_alerta) {
    case 'cpu_usage':
      return metrica.cpu_usage;
    case 'memoria_usage':
      return metrica.memoria_usage;
    case 'disco_usage':
      return metrica.disco_usage;
    default:
      return null;
  }
}

async function checkAlertCooldown(supabase: any, alerta: any): Promise<boolean> {
  const { data: cooldown } = await supabase
    .from('alert_cooldowns')
    .select('*')
    .eq('alerta_id', alerta.id)
    .eq('servidor_id', alerta.servidor_id)
    .eq('tipo_alerta', alerta.tipo_alerta)
    .single();

  if (!cooldown) {
    return false; // Não há cooldown registrado
  }

  const cooldownEnd = new Date(cooldown.last_sent);
  cooldownEnd.setMinutes(cooldownEnd.getMinutes() + cooldown.cooldown_minutes);

  return new Date() < cooldownEnd;
}

async function registerAlertCooldown(supabase: any, alerta: any): Promise<void> {
  await supabase
    .from('alert_cooldowns')
    .upsert({
      alerta_id: alerta.id,
      servidor_id: alerta.servidor_id,
      tipo_alerta: alerta.tipo_alerta,
      last_sent: new Date().toISOString(),
      cooldown_minutes: 15 // 15 minutos de cooldown padrão
    }, {
      onConflict: 'alerta_id,servidor_id,tipo_alerta'
    });
}

async function triggerAlert(supabase: any, alerta: any, metrica: MetricData): Promise<void> {
  const valorAtual = getCurrentMetricValue(alerta, metrica);
  
  // Chamar função de envio de alertas para cada canal
  for (const canal of alerta.canal_notificacao || ['email']) {
    try {
      const { error: sendError } = await supabase.functions.invoke('send-alerts', {
        body: {
          alerta_id: alerta.id,
          servidor_id: alerta.servidor_id,
          tipo_alerta: alerta.tipo_alerta,
          valor_atual: valorAtual,
          limite: alerta.limite_valor,
          canal_preferido: canal
        }
      });

      if (sendError) {
        console.error(`❌ Erro ao enviar alerta via ${canal}:`, sendError);
        await logSystem(supabase, 'error', 'alert-orchestrator', 
          `Erro ao enviar alerta via ${canal}`, 
          { error: sendError, alerta_id: alerta.id, canal }
        );
      } else {
        console.log(`✅ Alerta enviado via ${canal} para alerta ${alerta.id}`);
      }
    } catch (error) {
      console.error(`❌ Erro crítico ao enviar alerta via ${canal}:`, error);
    }
  }
}

async function logSystem(supabase: any, level: string, service: string, message: string, metadata: any): Promise<void> {
  try {
    await supabase
      .from('system_logs')
      .insert({
        level,
        service,
        message,
        metadata,
        timestamp: new Date().toISOString()
      });
  } catch (error) {
    console.error('❌ Erro ao registrar log do sistema:', error);
  }
}

serve(handler);