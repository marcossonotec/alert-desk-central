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

    // CORREÇÃO: Garantir que body JSON está presente antes de dar parse
    let bodyString = "";
    try {
      bodyString = await req.text();
      if (!bodyString) {
        throw new Error("Request sem JSON body");
      }
    } catch (err) {
      const message = "Body ausente ou inválido em send-alerts";
      console.error('❌', message, err);
      return new Response(JSON.stringify({ error: message, success: false }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders }
      });
    }

    let requestBody: AlertRequest;
    try {
      requestBody = JSON.parse(bodyString);
    } catch (err) {
      const message = "Body JSON inválido em send-alerts";
      console.error('❌', message, err);
      return new Response(JSON.stringify({ error: message, success: false }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders }
      });
    }
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

    // CORREÇÃO: Buscar alerta primeiro sem relacionamentos
    console.log('📋 Buscando configurações básicas do alerta...');
    const { data: alertaBase, error: alertaError } = await supabase
      .from('alertas')
      .select('*')
      .eq('id', alerta_id)
      .single();

    if (alertaError || !alertaBase) {
      const errorMsg = `Alerta não encontrado: ${alerta_id}`;
      console.error('❌', errorMsg, alertaError);
      throw new Error(errorMsg);
    }

    console.log('✅ Alerta base encontrado:', {
      id: alertaBase.id,
      tipo: alertaBase.tipo_alerta,
      usuario_id: alertaBase.usuario_id,
      limite: alertaBase.limite_valor,
      canais: alertaBase.canal_notificacao
    });

    // Verificar se o alerta está ativo
    if (!alertaBase.ativo) {
      const errorMsg = 'Alerta está inativo';
      console.error('⚠️', errorMsg);
      throw new Error(errorMsg);
    }

    // CORREÇÃO: Buscar dados do servidor OU aplicação condicionalmente
    let servidorData = null;
    let aplicacaoData = null;

    if (servidor_id) {
      console.log('🖥️ Buscando dados do servidor...');
      const { data: servidor, error: servidorError } = await supabase
        .from('servidores')
        .select('nome, ip')
        .eq('id', servidor_id)
        .single();

      if (servidorError) {
        console.log('⚠️ Erro ao buscar servidor:', servidorError);
      } else {
        servidorData = servidor;
        console.log('✅ Servidor encontrado:', servidor.nome);
      }
    }

    if (aplicacao_id) {
      console.log('📱 Buscando dados da aplicação...');
      const { data: aplicacao, error: aplicacaoError } = await supabase
        .from('aplicacoes')
        .select('nome')
        .eq('id', aplicacao_id)
        .single();

      if (aplicacaoError) {
        console.log('⚠️ Erro ao buscar aplicação:', aplicacaoError);
      } else {
        aplicacaoData = aplicacao;
        console.log('✅ Aplicação encontrada:', aplicacao.nome);
      }
    }

    // Construir objeto alerta completo
    const alertaCompleto = {
      ...alertaBase,
      servidores: servidorData,
      aplicacoes: aplicacaoData
    };

    console.log('🎯 Alerta completo preparado para envio:', {
      id: alertaCompleto.id,
      servidor: servidorData?.nome || 'N/A',
      aplicacao: aplicacaoData?.nome || 'N/A'
    });

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
