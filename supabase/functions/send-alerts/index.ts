
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

    const requestBody = await req.json();
    console.log('Request body recebido:', requestBody);

    // Verificar se é modo de teste
    if (requestBody.test_mode) {
      return await handleTestMode(supabase, requestBody);
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

    console.log('Enviando alerta:', { alerta_id, servidor_id, aplicacao_id, tipo_alerta });

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
      throw new Error('Alerta não encontrado');
    }

    return await processAlert(supabase, alerta, valor_atual, limite);

  } catch (error: any) {
    console.error('Erro ao enviar alerta:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500, 
        headers: { 'Content-Type': 'application/json', ...corsHeaders } 
      }
    );
  }
};

async function handleTestMode(supabase: any, requestBody: any) {
  console.log('=== INICIANDO MODO DE TESTE ===');
  
  // Para modo de teste, buscar o primeiro usuário admin ou usar dados padrão
  const { data: users } = await supabase
    .from('profiles')
    .select('*')
    .eq('plano_ativo', 'admin')
    .limit(1);

  let profile;
  if (users && users.length > 0) {
    profile = users[0];
  } else {
    // Fallback: buscar qualquer usuário para teste
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

  console.log('Usuário encontrado para teste:', profile.email);

  // Criar objeto de alerta fictício para teste
  const alertaFicticio = {
    id: 'test-alert-' + Date.now(),
    usuario_id: profile.id,
    tipo_alerta: requestBody.tipo_alerta,
    canal_notificacao: ['email', 'whatsapp'],
    ativo: true,
    servidores: {
      nome: requestBody.test_data?.servidor_nome || 'Servidor-Teste',
      ip: requestBody.test_data?.ip_servidor || '192.168.1.100'
    },
    aplicacoes: null
  };

  // Usar dados de teste fornecidos
  const valor_atual = requestBody.valor_atual || 85;
  const limite = requestBody.limite || 80;

  console.log('Dados do teste:', { valor_atual, limite, tipo_alerta: requestBody.tipo_alerta });

  // Processar como alerta normal, mas com dados de teste
  return await processAlert(supabase, alertaFicticio, valor_atual, limite, profile, true);
}

async function processAlert(supabase: any, alerta: any, valor_atual: any, limite: any, testProfile: any = null, isTestMode: boolean = false) {
  console.log('=== PROCESSANDO ALERTA ===');
  console.log('Modo teste:', isTestMode);
  
  let profile = testProfile;
  
  if (!profile) {
    // Buscar perfil do usuário com email de notificações
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('nome_completo, email, email_notificacoes, whatsapp, empresa')
      .eq('id', alerta.usuario_id)
      .single();

    if (profileError || !profileData) {
      throw new Error('Perfil do usuário não encontrado');
    }
    profile = profileData;
  }

  // Determinar qual email usar para notificações
  const notificationEmail = profile.email_notificacoes || profile.email;
  console.log('Email para notificação:', notificationEmail);

  // Preparar dados para as mensagens
  const recursoNome = alerta.servidores?.nome || alerta.aplicacoes?.nome || 'Recurso desconhecido';
  const tipoRecurso = alerta.servidor_id ? 'Servidor' : 'Aplicação';
  const dataHora = new Date().toLocaleString('pt-BR');
  const ipServidor = alerta.servidores?.ip || 'N/A';
  
  function getTipoAlertaName(tipo: string) {
    const tipos = {
      'cpu_usage': 'Alto uso de CPU',
      'memoria_usage': 'Alto uso de memória',
      'disco_usage': 'Alto uso de disco',
      'response_time': 'Tempo de resposta alto',
      'status': 'Servidor/Aplicação offline',
      'cpu': 'Alto uso de CPU',
      'memoria': 'Alto uso de memória',
      'disco': 'Alto uso de disco'
    };
    return tipos[tipo] || tipo;
  }

  function getStatusFromTipoAlerta(tipo: string) {
    if (tipo === 'status') return 'OFFLINE';
    if (tipo.includes('cpu') || tipo.includes('memoria') || tipo.includes('disco')) return 'CRÍTICO';
    return 'ALERTA';
  }

  // Preparar mensagem de email
  const emailSubject = `🚨 ${isTestMode ? 'TESTE - ' : ''}ALERTA: ${getTipoAlertaName(alerta.tipo_alerta)} - ${recursoNome}`;
  const emailContent = `
    <h1>${isTestMode ? 'TESTE - ' : ''}Alerta de Monitoramento</h1>
    <p><strong>Olá ${profile.nome_completo || 'Usuário'},</strong></p>
    ${isTestMode ? '<p style="color: #ff6b00; font-weight: bold;">⚠️ Este é um email de teste do sistema de alertas!</p>' : ''}
    <p>Foi detectado um alerta no seu ${tipoRecurso.toLowerCase()}: <strong>${recursoNome}</strong></p>
    
    <div style="background-color: #f8f9fa; padding: 15px; border-left: 4px solid #dc3545; margin: 20px 0;">
      <h3 style="color: #dc3545; margin-top: 0;">⚠️ ${getTipoAlertaName(alerta.tipo_alerta)}</h3>
      <p><strong>Valor atual:</strong> ${valor_atual}${alerta.tipo_alerta.includes('time') ? 'ms' : '%'}</p>
      <p><strong>Limite configurado:</strong> ${limite}${alerta.tipo_alerta.includes('time') ? 'ms' : '%'}</p>
      ${ipServidor !== 'N/A' ? `<p><strong>IP do servidor:</strong> ${ipServidor}</p>` : ''}
      <p><strong>Data/Hora:</strong> ${dataHora}</p>
    </div>
    
    <p>Este é um alerta ${isTestMode ? 'de teste ' : ''}automático do sistema de monitoramento DeskTools.</p>
  `;

  console.log('=== TENTANDO ENVIAR EMAIL ===');
  console.log('Para:', notificationEmail);
  console.log('Assunto:', emailSubject);

  // Registrar notificação de email no banco (somente se não for teste)
  if (!isTestMode) {
    const emailNotificationData = {
      alerta_id: alerta.id,
      servidor_id: alerta.servidor_id || null,
      canal: 'email',
      destinatario: notificationEmail,
      mensagem: emailContent,
      status: 'enviado'
    };

    const { error: notificationError } = await supabase
      .from('notificacoes')
      .insert(emailNotificationData);

    if (notificationError) {
      console.error('Erro ao registrar notificação de email:', notificationError);
    } else {
      console.log('Notificação de email registrada com sucesso');
    }
  } else {
    console.log('Modo teste: pulando registro da notificação no banco');
  }

  // Se WhatsApp configurado e canais incluem WhatsApp, enviar via WhatsApp
  if (profile.whatsapp && alerta.canal_notificacao?.includes('whatsapp')) {
    console.log('=== TENTANDO ENVIAR WHATSAPP ===');
    console.log('Para:', profile.whatsapp);
    
    // Buscar instância Evolution API do usuário
    const { data: evolutionInstance } = await supabase
      .from('evolution_instances')
      .select('*')
      .eq('usuario_id', alerta.usuario_id)
      .eq('status', 'connected')
      .limit(1)
      .single();

    if (evolutionInstance) {
      try {
        console.log('Instância Evolution encontrada:', evolutionInstance.instance_name);
        
        // Buscar template de WhatsApp personalizado ou usar padrão
        let whatsappMessage = evolutionInstance.message_template || `🚨 *${isTestMode ? 'TESTE - ' : ''}ALERTA: ${getTipoAlertaName(alerta.tipo_alerta)}*

📊 *${tipoRecurso}:* ${recursoNome}
📍 *IP:* ${ipServidor}
⚠️ *Problema:* ${getTipoAlertaName(alerta.tipo_alerta)} em ${valor_atual}% (limite: ${limite}%)

🕒 *Data/Hora:* ${dataHora}

${isTestMode ? '⚠️ *Este é um teste do sistema de alertas!*\n\n' : ''}_Mensagem automática do DeskTools_`;

        console.log('Enviando WhatsApp para:', profile.whatsapp);
        console.log('URL da API:', `${evolutionInstance.api_url}/message/sendText/${evolutionInstance.instance_name}`);

        // Enviar WhatsApp via Evolution API
        const whatsappResponse = await fetch(`${evolutionInstance.api_url}/message/sendText/${evolutionInstance.instance_name}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': evolutionInstance.api_key
          },
          body: JSON.stringify({
            number: profile.whatsapp.replace(/\D/g, ''),
            text: whatsappMessage
          })
        });

        const whatsappResult = await whatsappResponse.text();
        console.log('Resposta da Evolution API:', whatsappResult);

        if (whatsappResponse.ok) {
          console.log('WhatsApp enviado com sucesso para:', profile.whatsapp);
          
          // Registrar notificação WhatsApp (somente se não for teste)
          if (!isTestMode) {
            const whatsappNotificationData = {
              alerta_id: alerta.id,
              servidor_id: alerta.servidor_id || null,
              canal: 'whatsapp',
              destinatario: profile.whatsapp,
              mensagem: whatsappMessage,
              status: 'enviado'
            };

            await supabase
              .from('notificacoes')
              .insert(whatsappNotificationData);
          }
        } else {
          console.error('Erro na resposta da Evolution API:', whatsappResponse.status, whatsappResult);
        }

      } catch (whatsappError) {
        console.error('Erro ao enviar WhatsApp:', whatsappError);
      }
    } else {
      console.log('Nenhuma instância Evolution conectada encontrada para o usuário');
    }
  } else {
    console.log('WhatsApp não configurado ou não incluído nos canais de notificação');
  }

  console.log('=== FINALIZANDO PROCESSAMENTO ===');

  return new Response(
    JSON.stringify({ 
      success: true, 
      message: `Alerta ${isTestMode ? 'de teste ' : ''}enviado com sucesso`,
      notification_email: notificationEmail,
      test_mode: isTestMode,
      whatsapp_configured: !!profile.whatsapp,
      channels_attempted: {
        email: true,
        whatsapp: profile.whatsapp && alerta.canal_notificacao?.includes('whatsapp')
      }
    }),
    { 
      status: 200, 
      headers: { 'Content-Type': 'application/json', ...corsHeaders } 
    }
  );
}

serve(handler);
