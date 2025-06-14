
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { AlertRequest, AlertData, UserProfile, NotificationResult } from "./types.ts";
import { processAlert } from "./alert-processor.ts";
import { corsHeaders } from "./utils.ts";

// Função para modo de teste
async function handleTestMode(
  supabase: any, 
  requestBody: AlertRequest,
  authUserId?: string
): Promise<{ alerta: AlertData; profile: UserProfile }> {
  console.log('=== INICIANDO MODO DE TESTE ===');
  console.log('Auth User ID:', authUserId);
  
  let profile: UserProfile;
  
  if (authUserId) {
    // Para modo de teste, buscar o usuário autenticado atual
    const { data: currentUser, error: userError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', authUserId)
      .single();

    if (userError || !currentUser) {
      console.error('Erro ao buscar usuário atual:', userError);
      throw new Error('Usuário atual não encontrado para teste');
    }
    
    profile = currentUser;
    console.log('Usuário autenticado encontrado para teste:', profile.email);
  } else {
    // Fallback: buscar o primeiro usuário admin se não houver autenticação
    const { data: users } = await supabase
      .from('profiles')
      .select('*')
      .eq('plano_ativo', 'admin')
      .limit(1);

    if (users && users.length > 0) {
      profile = users[0];
    } else {
      // Último fallback: buscar qualquer usuário para teste
      const { data: fallbackUsers } = await supabase
        .from('profiles')
        .select('*')
        .limit(1);
      
      if (fallbackUsers && fallbackUsers.length > 0) {
        profile = fallbackUsers[0];
      } else {
        throw new Error('Nenhum usuário encontrado para teste');
      }
    }
    console.log('Usuário fallback encontrado para teste:', profile.email);
  }

  // Criar objeto de alerta fictício para teste
  const alertaFicticio: AlertData = {
    id: 'test-alert-' + Date.now(),
    usuario_id: profile.id,
    tipo_alerta: requestBody.tipo_alerta,
    canal_notificacao: ['email', 'whatsapp'],
    ativo: true,
    limite_valor: requestBody.limite,
    servidores: {
      nome: requestBody.test_data?.servidor_nome || 'Servidor-Teste',
      ip: requestBody.test_data?.ip_servidor || '192.168.1.100'
    },
    aplicacoes: null
  };

  console.log('Dados do teste:', { 
    valor_atual: requestBody.valor_atual, 
    limite: requestBody.limite, 
    tipo_alerta: requestBody.tipo_alerta,
    usuario_id: profile.id,
    email_principal: profile.email,
    email_notificacoes: profile.email_notificacoes,
    whatsapp: profile.whatsapp
  });

  return { alerta: alertaFicticio, profile };
}

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

    // Buscar alerta primeiro sem relacionamentos
    console.log('📋 Buscando configurações básicas do alerta...');
    const { data: alertaBase, error: alertaError } = await supabase
      .from('alertas')
      .select('*')
      .eq('id', alerta_id)
      .single();

    if (alertaError || !alertaBase) {
      const errorMsg = `Alerta não encontrado: ${alerta_id}`;
      console.error('❌', errorMsg, alertaError);
      return new Response(JSON.stringify({ 
        error: errorMsg, 
        success: false 
      }), {
        status: 404,
        headers: { "Content-Type": "application/json", ...corsHeaders }
      });
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
      return new Response(JSON.stringify({ 
        error: errorMsg, 
        success: false 
      }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders }
      });
    }

    // Buscar dados do servidor OU aplicação condicionalmente
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
