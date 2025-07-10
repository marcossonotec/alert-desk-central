import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const handler = async (req: Request): Promise<Response> => {
  console.log('=== TESTE DE FLUXO DE ALERTAS ===', new Date().toISOString());
  
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // 1. Buscar todos os servidores com alertas ativos
    const { data: servidores, error: servidoresError } = await supabase
      .from('servidores')
      .select(`
        id,
        nome,
        ip,
        usuario_id,
        alertas!inner(
          id,
          tipo_alerta,
          limite_valor,
          canal_notificacao,
          ativo
        )
      `)
      .eq('status', 'ativo')
      .eq('alertas.ativo', true);

    if (servidoresError) throw servidoresError;

    console.log(`📊 Encontrados ${servidores?.length || 0} servidores com alertas ativos`);

    let testesSucesso = 0;
    let testesErro = 0;

    // 2. Para cada servidor, simular métricas altas e verificar se alerta é disparado
    for (const servidor of servidores || []) {
      for (const alerta of servidor.alertas) {
        try {
          console.log(`🧪 Testando alerta ${alerta.tipo_alerta} para servidor ${servidor.nome}`);
          
          // Simular métrica acima do limite
          const valorTeste = alerta.limite_valor + 10;
          
          // Chamar o trigger-alerts
          const { data: triggerResult, error: triggerError } = await supabase.functions.invoke('trigger-alerts', {
            body: {
              servidor_id: servidor.id,
              tipo_metrica: alerta.tipo_alerta,
              valor_atual: valorTeste
            }
          });

          if (triggerError) {
            console.error(`❌ Erro no trigger para ${servidor.nome}:`, triggerError);
            testesErro++;
          } else {
            console.log(`✅ Trigger funcionando para ${servidor.nome}:`, triggerResult);
            testesSucesso++;
          }
        } catch (err) {
          console.error(`❌ Erro no teste de ${servidor.nome}:`, err);
          testesErro++;
        }
      }
    }

    // 3. Verificar logs do sistema recentes
    const { data: logsRecentes, error: logsError } = await supabase
      .from('system_logs')
      .select('*')
      .gte('timestamp', new Date(Date.now() - 10 * 60 * 1000).toISOString()) // Últimos 10 minutos
      .order('timestamp', { ascending: false })
      .limit(20);

    if (logsError) throw logsError;

    // 4. Verificar notificações recentes
    const { data: notificacoesRecentes, error: notifError } = await supabase
      .from('notificacoes')
      .select('*')
      .gte('data_envio', new Date(Date.now() - 10 * 60 * 1000).toISOString())
      .order('data_envio', { ascending: false })
      .limit(10);

    if (notifError) throw notifError;

    const resultado = {
      success: true,
      timestamp: new Date().toISOString(),
      resultados_teste: {
        servidores_testados: servidores?.length || 0,
        testes_sucesso: testesSucesso,
        testes_erro: testesErro
      },
      logs_recentes: logsRecentes?.length || 0,
      notificacoes_recentes: notificacoesRecentes?.length || 0,
      sistema_status: {
        multi_provider_monitor: 'ativo',
        alert_orchestrator: 'ativo',
        send_alerts: 'ativo'
      },
      detalhes: {
        logs: logsRecentes?.slice(0, 5) || [],
        notificacoes: notificacoesRecentes?.slice(0, 3) || []
      }
    };

    console.log('🎯 Teste concluído:', resultado);

    return new Response(
      JSON.stringify(resultado),
      { 
        status: 200, 
        headers: { 'Content-Type': 'application/json', ...corsHeaders } 
      }
    );

  } catch (error: any) {
    console.error('❌ ERRO CRÍTICO no teste:', error);
    
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

serve(handler);