
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { AlertRequest } from "./types.ts";
import { corsHeaders } from "./utils.ts";
import { handleTestMode } from "./test-mode-handler.ts";
import { processAlert } from "./alert-processor.ts";

const handler = async (req: Request): Promise<Response> => {
  console.log('=== SEND-ALERTS INICIADO ===', new Date().toISOString());
  
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Extrair token de autorização para identificar o usuário
    const authHeader = req.headers.get('Authorization');
    let authUserId: string | undefined;
    
    if (authHeader) {
      try {
        const token = authHeader.replace('Bearer ', '');
        const { data: { user }, error } = await supabase.auth.getUser(token);
        if (user && !error) {
          authUserId = user.id;
          console.log('👤 Usuário autenticado identificado:', user.email);
        }
      } catch (error) {
        console.log('⚠️ Erro ao identificar usuário:', error);
      }
    }

    const requestBody: AlertRequest = await req.json();
    console.log('📨 Request body recebido:', requestBody);

    // Verificar se é modo de teste
    if (requestBody.test_mode) {
      console.log('🧪 Modo de teste ativado');
      const { alerta, profile } = await handleTestMode(supabase, requestBody, authUserId);
      return await processAlert(supabase, alerta, requestBody.valor_atual || 85, requestBody.limite || 80, profile, true);
    }

    // Modo normal - buscar alerta no banco
    const { 
      alerta_id, 
      servidor_id, 
      aplicacao_id, 
      tipo_alerta, 
      valor_atual, 
      limite 
    } = requestBody;

    console.log('🔍 Processando alerta normal:', { 
      alerta_id, 
      servidor_id, 
      aplicacao_id, 
      tipo_alerta,
      valor_atual,
      limite
    });

    // Validar dados obrigatórios
    if (!alerta_id || (!servidor_id && !aplicacao_id) || !tipo_alerta || valor_atual === undefined || limite === undefined) {
      const errorMsg = 'Dados obrigatórios ausentes no request';
      console.error('❌', errorMsg, requestBody);
      throw new Error(errorMsg);
    }

    // Buscar configurações do alerta
    const { data: alerta, error: alertaError } = await supabase
      .from('alertas')
      .select(`
        *,
        servidores(nome, ip),
        aplicacoes(nome)
      `)
      .eq('id', alerta_id)
      .single();

    if (alertaError || !alerta) {
      const errorMsg = `Alerta não encontrado: ${alerta_id}`;
      console.error('❌', errorMsg, alertaError);
      throw new Error(errorMsg);
    }

    console.log('✅ Alerta encontrado:', {
      id: alerta.id,
      tipo: alerta.tipo_alerta,
      usuario_id: alerta.usuario_id,
      limite: alerta.limite_valor,
      canais: alerta.canal_notificacao
    });

    // Verificar se o alerta está ativo
    if (!alerta.ativo) {
      const errorMsg = 'Alerta está inativo';
      console.error('⚠️', errorMsg);
      throw new Error(errorMsg);
    }

    return await processAlert(supabase, alerta, valor_atual, limite);

  } catch (error: any) {
    console.error('❌ ERRO CRÍTICO em send-alerts:', error);
    
    // Registrar erro no sistema
    try {
      const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
      await supabase
        .from('notificacoes')
        .insert({
          alerta_id: null,
          servidor_id: null,
          canal: 'sistema',
          destinatario: 'send-alerts-function',
          mensagem: `Erro crítico: ${error.message}`,
          status: 'erro_critico',
          data_envio: new Date().toISOString()
        });
    } catch (logError) {
      console.error('❌ Erro ao registrar log de erro:', logError);
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
