
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { AlertRequest } from "./types.ts";
import { processAlert } from "./alert-processor.ts";
import { handleTestMode } from "./test-handler.ts";
import { fetchAlertData } from "./alert-fetcher.ts";
import { corsHeaders } from "./utils.ts";

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

    // Verificar se há body na requisição
    let requestBody: AlertRequest;
    
    try {
      const bodyText = await req.text();
      console.log('📨 Body recebido (raw):', bodyText);
      
      if (!bodyText || bodyText.trim() === '') {
        const errorMsg = "Body vazio na requisição para send-alerts";
        console.error('❌', errorMsg);
        return new Response(JSON.stringify({ 
          error: errorMsg, 
          success: false,
          received_body: bodyText 
        }), {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders }
        });
      }
      
      requestBody = JSON.parse(bodyText);
      console.log('📨 Request body parseado:', requestBody);
    } catch (parseError) {
      const errorMsg = `Erro ao parsear JSON do body: ${parseError.message}`;
      console.error('❌', errorMsg, parseError);
      return new Response(JSON.stringify({ 
        error: errorMsg, 
        success: false 
      }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders }
      });
    }

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
      return new Response(JSON.stringify({ 
        error: errorMsg, 
        success: false,
        required_fields: ['alerta_id', 'servidor_id or aplicacao_id', 'tipo_alerta', 'valor_atual', 'limite']
      }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders }
      });
    }

    const alertaCompleto = await fetchAlertData(supabase, alerta_id, servidor_id, aplicacao_id);
    return await processAlert(supabase, alertaCompleto, valor_atual, limite);

  } catch (error: any) {
    console.error('❌ ERRO CRÍTICO em send-alerts:', error);
    console.error('📍 Stack trace:', error.stack);
    
    // Registrar erro no sistema com mais detalhes
    try {
      const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
      await supabase
        .from('notificacoes')
        .insert({
          alerta_id: null,
          servidor_id: null,
          canal: 'sistema',
          destinatario: 'send-alerts-function',
          mensagem: `Erro crítico em send-alerts: ${error.message} | Stack: ${error.stack?.substring(0, 500)}`,
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
        success: false,
        details: error.stack?.substring(0, 200)
      }),
      { 
        status: 500, 
        headers: { 'Content-Type': 'application/json', ...corsHeaders } 
      }
    );
  }
};

serve(handler);
