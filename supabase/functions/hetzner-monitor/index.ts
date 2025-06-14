
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { processaServidor } from "./server-processor.ts";

// Configuração de CORS para requisições web
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Serve handler principal
const handler = async (req: Request): Promise<Response> => {
  console.log('=== HETZNER MONITOR INICIADO ===', new Date().toISOString());
  
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // 1. Busca todos servidores ativos
    const { data: servidores, error: servidoresError } = await supabase
      .from('servidores')
      .select(`
        id, 
        nome, 
        ip, 
        usuario_id,
        provedor,
        provider_token_id,
        profiles!inner(
          id,
          email,
          email_notificacoes,
          nome_completo
        )
      `)
      .eq('status', 'ativo');

    if (servidoresError) {
      console.error('❌ Erro ao buscar servidores:', servidoresError);
      throw servidoresError;
    }

    console.log('=== COLETA AUTOMÁTICA INICIADA ===');
    console.log(`📊 Coletando métricas de ${servidores?.length || 0} servidores`);

    // Contadores para reporting final
    let alertasAcionados = 0;
    let errosProcessamento = 0;
    let sucessoProcessamento = 0;

    // 2. Processa cada servidor individualmente
    for (const servidor of servidores || []) {
      try {
        const { sucesso, alertasAcionados: alertasSvr } = await processaServidor(supabase, servidor);
        if (sucesso) {
          sucessoProcessamento++;
        } else {
          errosProcessamento++;
        }
        alertasAcionados += alertasSvr;
        console.log(`📊 Resumo servidor ${servidor.nome}: ${alertasSvr} alertas acionados`);
      } catch (err) {
        console.error(`❌ Erro ao processar servidor ${servidor.nome}:`, err);
        errosProcessamento++;
      }
    }

    console.log('=== COLETA AUTOMÁTICA FINALIZADA ===');
    console.log(`✅ Processados ${servidores?.length || 0} servidores`);
    console.log(`📊 Sucessos: ${sucessoProcessamento}, Alertas acionados: ${alertasAcionados}, Erros: ${errosProcessamento}`);

    // 3. Registra status de execução como notificação geral
    try {
      await supabase
        .from('notificacoes')
        .insert({
          alerta_id: null,
          servidor_id: null,
          canal: 'sistema',
          destinatario: 'hetzner-monitor',
          mensagem: `Execução automática concluída: ${servidores?.length || 0} servidores, ${sucessoProcessamento} sucessos, ${alertasAcionados} alertas enviados, ${errosProcessamento} erros`,
          status: errosProcessamento > 0 ? 'parcial_sucesso' : 'sucesso',
          data_envio: new Date().toISOString()
        });
    } catch (logError) {
      console.error('❌ Erro ao registrar status da execução:', logError);
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        servidores_processados: servidores?.length || 0,
        sucessos_processamento: sucessoProcessamento,
        alertas_acionados: alertasAcionados,
        erros_processamento: errosProcessamento,
        timestamp: new Date().toISOString()
      }),
      { 
        status: 200, 
        headers: { 'Content-Type': 'application/json', ...corsHeaders } 
      }
    );

  } catch (error: any) {
    console.error('❌ ERRO CRÍTICO em hetzner-monitor:', error);
    console.error('📍 Stack trace:', error.stack);
    
    // Tenta registrar erro crítico no sistema
    try {
      const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
      await supabase
        .from('notificacoes')
        .insert({
          alerta_id: null,
          servidor_id: null,
          canal: 'sistema',
          destinatario: 'sistema',
          mensagem: `Erro crítico em hetzner-monitor: ${error.message}`,
          status: 'erro_critico',
          data_envio: new Date().toISOString()
        });
    } catch (logError) {
      console.error('❌ Erro ao registrar erro crítico:', logError);
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

serve(handler);
