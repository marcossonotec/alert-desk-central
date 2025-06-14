
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Tipos e interfaces
interface AlertRequest {
  alerta_id?: string;
  servidor_id?: string;
  aplicacao_id?: string;
  tipo_alerta: string;
  valor_atual: number;
  limite: number;
  test_mode?: boolean;
  test_data?: {
    servidor_nome?: string;
    ip_servidor?: string;
  };
}

interface AlertData {
  id: string;
  usuario_id: string;
  tipo_alerta: string;
  canal_notificacao: string[];
  ativo: boolean;
  limite_valor: number;
  servidor_id?: string;
  aplicacao_id?: string;
  servidores?: {
    nome: string;
    ip: string;
  };
  aplicacoes?: {
    nome: string;
  };
}

interface UserProfile {
  id: string;
  nome_completo: string;
  email: string;
  email_notificacoes?: string;
  whatsapp?: string;
  empresa?: string;
}

interface NotificationResult {
  success: boolean;
  message: string;
  notification_email: string;
  test_mode: boolean;
  channels_attempted: {
    email: { attempted: boolean; sent: boolean; error: string | null };
    whatsapp: { attempted: boolean; sent: boolean; error: string | null };
  };
  alert_details: {
    tipo_alerta: string;
    valor_atual: number;
    limite: number;
    servidor_nome: string;
  };
}

// Configuração de CORS
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Função utilitária para nomes de alertas
function getTipoAlertaName(tipo: string): string {
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

// Função para substituir variáveis em templates
function replaceTemplateVariables(
  template: string,
  variables: {
    tipo_alerta?: string;
    servidor_nome?: string;
    ip_servidor?: string;
    valor_atual?: number;
    limite?: number;
    data_hora?: string;
  }
): string {
  let result = template;
  
  const replacements = {
    '{{tipo_alerta}}': variables.tipo_alerta || 'N/A',
    '{{servidor_nome}}': variables.servidor_nome || 'Servidor desconhecido',
    '{{ip_servidor}}': variables.ip_servidor || 'N/A',
    '{{valor_atual}}': variables.valor_atual?.toString() || 'N/A',
    '{{limite}}': variables.limite?.toString() || 'N/A',
    '{{data_hora}}': variables.data_hora || new Date().toLocaleString('pt-BR')
  };
  
  for (const [placeholder, value] of Object.entries(replacements)) {
    result = result.replace(new RegExp(placeholder, 'g'), value);
  }
  
  return result;
}

// Função para envio de email via Resend
async function sendEmailNotification(
  alerta: AlertData,
  profile: UserProfile,
  valor_atual: number,
  limite: number,
  supabase: any,
  isTestMode: boolean = false
): Promise<{ sent: boolean; error: string | null }> {
  console.log('=== TENTANDO ENVIAR EMAIL VIA RESEND ===');
  
  try {
    const notificationEmail = profile.email_notificacoes || profile.email;
    console.log('📧 Destinatário:', notificationEmail);
    console.log('🧪 Modo teste:', isTestMode);

    // Verificar se RESEND_API_KEY está configurado
    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    if (!resendApiKey) {
      const error = 'RESEND_API_KEY não configurado nas variáveis de ambiente';
      console.error('❌', error);
      throw new Error(error);
    }

    console.log('✅ RESEND_API_KEY encontrado');

    // Importar Resend dinamicamente
    const { Resend } = await import("npm:resend@2.0.0");
    const resend = new Resend(resendApiKey);
    
    const recursoNome = alerta.servidores?.nome || alerta.aplicacoes?.nome || 'Recurso desconhecido';
    const tipoRecurso = alerta.servidor_id ? 'Servidor' : 'Aplicação';
    const dataHora = new Date().toLocaleString('pt-BR');
    const ipServidor = alerta.servidores?.ip || 'N/A';
    
    const emailSubject = `🚨 ${isTestMode ? 'TESTE - ' : ''}ALERTA: ${getTipoAlertaName(alerta.tipo_alerta)} - ${recursoNome}`;
    
    console.log('📧 Assunto do email:', emailSubject);
    
    const emailContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Alerta de Monitoramento</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #dc3545; border-bottom: 3px solid #dc3545; padding-bottom: 10px;">
            ${isTestMode ? 'TESTE - ' : ''}Alerta de Monitoramento
          </h1>
          
          <p><strong>Olá ${profile.nome_completo || 'Usuário'},</strong></p>
          
          ${isTestMode ? '<div style="background-color: #fff3cd; border: 1px solid #ffeaa7; border-radius: 5px; padding: 15px; margin: 20px 0;"><p style="color: #856404; font-weight: bold; margin: 0;">⚠️ Este é um email de teste do sistema de alertas!</p></div>' : ''}
          
          <p>Foi detectado um alerta no seu ${tipoRecurso.toLowerCase()}: <strong>${recursoNome}</strong></p>
          
          <div style="background-color: #f8d7da; border: 1px solid #f5c6cb; border-left: 4px solid #dc3545; border-radius: 5px; padding: 15px; margin: 20px 0;">
            <h3 style="color: #721c24; margin-top: 0;">⚠️ ${getTipoAlertaName(alerta.tipo_alerta)}</h3>
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 5px 10px; border-bottom: 1px solid #f5c6cb;"><strong>Valor atual:</strong></td>
                <td style="padding: 5px 10px; border-bottom: 1px solid #f5c6cb; color: #dc3545; font-weight: bold;">${valor_atual}%</td>
              </tr>
              <tr>
                <td style="padding: 5px 10px; border-bottom: 1px solid #f5c6cb;"><strong>Limite configurado:</strong></td>
                <td style="padding: 5px 10px; border-bottom: 1px solid #f5c6cb;">${limite}%</td>
              </tr>
              ${ipServidor !== 'N/A' ? `<tr><td style="padding: 5px 10px; border-bottom: 1px solid #f5c6cb;"><strong>IP do servidor:</strong></td><td style="padding: 5px 10px; border-bottom: 1px solid #f5c6cb;">${ipServidor}</td></tr>` : ''}
              <tr>
                <td style="padding: 5px 10px;"><strong>Data/Hora:</strong></td>
                <td style="padding: 5px 10px;">${dataHora}</td>
              </tr>
            </table>
          </div>
          
          <p style="font-size: 14px; color: #666; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
            Este é um alerta ${isTestMode ? 'de teste ' : ''}automático do sistema de monitoramento DeskTools.<br>
            Para gerenciar seus alertas, acesse: <a href="https://tools.flowserv.com.br" style="color: #007bff;">tools.flowserv.com.br</a>
          </p>
        </div>
      </body>
      </html>
    `;

    console.log('📤 Enviando email via Resend...');
    
    const emailResult = await resend.emails.send({
      from: 'DeskTools <alertas@tools.flowserv.com.br>',
      to: [notificationEmail],
      subject: emailSubject,
      html: emailContent,
    });

    console.log('📧 Resposta do Resend:', emailResult);

    if (emailResult.error) {
      console.error('❌ Erro na resposta do Resend:', emailResult.error);
      throw new Error(`Erro Resend: ${emailResult.error.message || 'Erro desconhecido'}`);
    }

    console.log('✅ Email enviado com sucesso via Resend:', emailResult.data);

    // Registrar notificação de email no banco (somente se não for teste)
    if (!isTestMode) {
      const emailNotificationData = {
        alerta_id: alerta.id,
        servidor_id: alerta.servidor_id || null,
        canal: 'email',
        destinatario: notificationEmail,
        mensagem: `Email enviado com sucesso via Resend - ID: ${emailResult.data?.id || 'N/A'}`,
        status: 'enviado',
        data_envio: new Date().toISOString()
      };

      const { error: notificationError } = await supabase
        .from('notificacoes')
        .insert(emailNotificationData);

      if (notificationError) {
        console.error('⚠️ Erro ao registrar notificação de email:', notificationError);
      } else {
        console.log('✅ Notificação de email registrada com sucesso');
      }
    }

    return { sent: true, error: null };

  } catch (error: any) {
    console.error('❌ Erro ao enviar email via Resend:', error);
    
    // Tentar registrar o erro no banco
    if (!isTestMode) {
      try {
        await supabase
          .from('notificacoes')
          .insert({
            alerta_id: alerta.id,
            servidor_id: alerta.servidor_id || null,
            canal: 'email',
            destinatario: profile.email_notificacoes || profile.email,
            mensagem: `Erro ao enviar email: ${error.message}`,
            status: 'erro_envio',
            data_envio: new Date().toISOString()
          });
      } catch (logError) {
        console.error('❌ Erro ao registrar falha de email:', logError);
      }
    }
    
    return { sent: false, error: error.message };
  }
}

// Função para envio de WhatsApp via Evolution API
async function sendWhatsAppNotification(
  alerta: AlertData,
  profile: UserProfile,
  valor_atual: number,
  limite: number,
  supabase: any,
  isTestMode: boolean = false
): Promise<{ sent: boolean; error: string | null }> {
  console.log('=== TENTANDO ENVIAR WHATSAPP ===');
  
  try {
    console.log('📱 Destinatário:', profile.whatsapp);
    console.log('🧪 Modo teste:', isTestMode);
    
    if (!profile.whatsapp) {
      const error = 'Número de WhatsApp não configurado no perfil do usuário';
      console.error('❌', error);
      throw new Error(error);
    }
    
    // Buscar instância Evolution API ativa do usuário
    const { data: evolutionInstance, error: evolutionError } = await supabase
      .from('evolution_instances')
      .select('*')
      .eq('usuario_id', alerta.usuario_id)
      .eq('status', 'connected')
      .maybeSingle();

    if (evolutionError) {
      console.error('❌ Erro ao buscar instância Evolution:', evolutionError);
      throw new Error(`Erro ao buscar instância Evolution: ${evolutionError.message}`);
    }

    if (!evolutionInstance) {
      const error = 'Nenhuma instância Evolution conectada encontrada para o usuário';
      console.error('❌', error);
      throw new Error(error);
    }

    console.log('✅ Instância Evolution encontrada:', {
      instance_name: evolutionInstance.instance_name,
      status: evolutionInstance.status,
      api_url: evolutionInstance.api_url
    });
    
    const recursoNome = alerta.servidores?.nome || alerta.aplicacoes?.nome || 'Recurso desconhecido';
    const tipoRecurso = alerta.servidor_id ? 'Servidor' : 'Aplicação';
    const dataHora = new Date().toLocaleString('pt-BR');
    const ipServidor = alerta.servidores?.ip || 'N/A';
    
    // Template padrão otimizado para WhatsApp
    const defaultTemplate = `🚨 *${isTestMode ? 'TESTE - ' : ''}ALERTA: {{tipo_alerta}}*

📊 *${tipoRecurso}:* {{servidor_nome}}
${ipServidor !== 'N/A' ? '📍 *IP:* {{ip_servidor}}' : ''}
⚠️ *Problema:* {{tipo_alerta}} em {{valor_atual}}% (limite: {{limite}}%)

🕒 *Data/Hora:* {{data_hora}}

${isTestMode ? '⚠️ *Este é um teste do sistema de alertas!*\n\n' : ''}_Mensagem automática do DeskTools_`;

    // Usar template personalizado se existir ou padrão
    const template = evolutionInstance.message_template || defaultTemplate;
    console.log('📝 Template que será usado:', template.substring(0, 100) + '...');
    
    // Substituir variáveis no template
    const whatsappMessage = replaceTemplateVariables(template, {
      tipo_alerta: getTipoAlertaName(alerta.tipo_alerta),
      servidor_nome: recursoNome,
      ip_servidor: ipServidor,
      valor_atual: valor_atual,
      limite: limite,
      data_hora: dataHora
    });

    console.log('📱 Mensagem formatada:', whatsappMessage);
    
    // Formatar número do WhatsApp
    let whatsappNumber = profile.whatsapp.replace(/\D/g, '');
    
    if (!whatsappNumber.startsWith('55') && whatsappNumber.length <= 11) {
      whatsappNumber = '55' + whatsappNumber;
    }
    
    console.log('📞 Número formatado:', whatsappNumber);
    
    const apiUrl = `${evolutionInstance.api_url}/message/sendText/${evolutionInstance.instance_name}`;
    console.log('🔗 URL da API:', apiUrl);

    const requestBody = {
      number: whatsappNumber,
      text: whatsappMessage
    };

    console.log('📤 Dados sendo enviados:', requestBody);

    // Enviar WhatsApp via Evolution API
    const whatsappResponse = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': evolutionInstance.api_key
      },
      body: JSON.stringify(requestBody)
    });

    const whatsappResult = await whatsappResponse.text();
    console.log('📡 Status da resposta:', whatsappResponse.status);
    console.log('📄 Resposta da Evolution API:', whatsappResult);

    if (!whatsappResponse.ok) {
      const error = `Erro na resposta da Evolution API: ${whatsappResponse.status} - ${whatsappResult}`;
      console.error('❌', error);
      throw new Error(error);
    }

    console.log('✅ WhatsApp enviado com sucesso para:', profile.whatsapp);
    
    // Registrar notificação WhatsApp (somente se não for teste)
    if (!isTestMode) {
      const whatsappNotificationData = {
        alerta_id: alerta.id,
        servidor_id: alerta.servidor_id || null,
        canal: 'whatsapp',
        destinatario: profile.whatsapp,
        mensagem: whatsappMessage,
        status: 'enviado',
        data_envio: new Date().toISOString()
      };

      const { error: notificationError } = await supabase
        .from('notificacoes')
        .insert(whatsappNotificationData);

      if (notificationError) {
        console.error('⚠️ Erro ao registrar notificação WhatsApp:', notificationError);
      } else {
        console.log('✅ Notificação WhatsApp registrada com sucesso');
      }
    }

    return { sent: true, error: null };

  } catch (error: any) {
    console.error('❌ Erro ao enviar WhatsApp:', error);
    
    // Tentar registrar o erro no banco
    if (!isTestMode) {
      try {
        await supabase
          .from('notificacoes')
          .insert({
            alerta_id: alerta.id,
            servidor_id: alerta.servidor_id || null,
            canal: 'whatsapp',
            destinatario: profile.whatsapp || 'não_configurado',
            mensagem: `Erro ao enviar WhatsApp: ${error.message}`,
            status: 'erro_envio',
            data_envio: new Date().toISOString()
          });
      } catch (logError) {
        console.error('❌ Erro ao registrar falha de WhatsApp:', logError);
      }
    }
    
    return { sent: false, error: error.message };
  }
}

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

// Função principal de processamento de alertas
async function processAlert(
  supabase: any,
  alerta: AlertData,
  valor_atual: number,
  limite: number,
  testProfile: UserProfile | null = null,
  isTestMode: boolean = false
): Promise<Response> {
  console.log('=== PROCESSANDO ALERTA ===');
  console.log('🔧 Configurações:', {
    alerta_id: alerta.id,
    tipo: alerta.tipo_alerta,
    valor_atual,
    limite,
    test_mode: isTestMode,
    canais: alerta.canal_notificacao,
    tem_servidor: !!alerta.servidores,
    tem_aplicacao: !!alerta.aplicacoes
  });
  
  let profile = testProfile;
  
  if (!profile) {
    console.log('👤 Buscando perfil do usuário:', alerta.usuario_id);
    
    // Buscar perfil do usuário com email de notificações
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('id, nome_completo, email, email_notificacoes, whatsapp, empresa')
      .eq('id', alerta.usuario_id)
      .single();

    if (profileError || !profileData) {
      const errorMsg = `Perfil do usuário não encontrado: ${alerta.usuario_id}`;
      console.error('❌', errorMsg, profileError);
      throw new Error(errorMsg);
    }
    
    profile = profileData;
    console.log('✅ Perfil encontrado:', {
      id: profile.id,
      email: profile.email,
      email_notificacoes: profile.email_notificacoes,
      whatsapp: profile.whatsapp ? '***configurado***' : 'não configurado'
    });
  }

  // Determinar qual email usar para notificações
  const notificationEmail = profile.email_notificacoes || profile.email;
  console.log('📧 Email para notificação:', notificationEmail);

  let emailResult = { sent: false, error: null };
  let whatsappResult = { sent: false, error: null };

  const canaisNotificacao = alerta.canal_notificacao || ['email'];
  console.log('📢 Canais de notificação configurados:', canaisNotificacao);

  // Enviar email (sempre tenta, a menos que explicitamente desabilitado)
  if (canaisNotificacao.includes('email')) {
    console.log('📧 Enviando notificação por email...');
    try {
      emailResult = await sendEmailNotification(alerta, profile, valor_atual, limite, supabase, isTestMode);
      console.log('📧 Resultado email:', emailResult);
    } catch (emailError: any) {
      console.error('📧 Erro crítico no envio de email:', emailError);
      emailResult = { sent: false, error: emailError.message };
    }
  } else {
    console.log('📧 Email não está nos canais configurados');
  }

  // Enviar WhatsApp se configurado
  if (canaisNotificacao.includes('whatsapp')) {
    if (profile.whatsapp) {
      console.log('📱 Enviando notificação por WhatsApp...');
      try {
        whatsappResult = await sendWhatsAppNotification(alerta, profile, valor_atual, limite, supabase, isTestMode);
        console.log('📱 Resultado WhatsApp:', whatsappResult);
      } catch (whatsappError: any) {
        console.error('📱 Erro crítico no envio de WhatsApp:', whatsappError);
        whatsappResult = { sent: false, error: whatsappError.message };
      }
    } else {
      console.log('⚠️ WhatsApp solicitado mas não configurado no perfil');
      whatsappResult = { sent: false, error: 'WhatsApp não configurado no perfil do usuário' };
    }
  } else {
    console.log('📱 WhatsApp não está nos canais configurados');
  }

  // Registrar tentativa de notificação (mesmo que falhe)
  if (!isTestMode) {
    const statusNotificacao = (emailResult.sent || whatsappResult.sent) ? 'enviado' : 'erro_envio';
    const mensagemDetalhada = `Alerta ${alerta.tipo_alerta}: ${valor_atual}% (limite: ${limite}%) | Email: ${emailResult.sent ? 'OK' : 'FALHA'} | WhatsApp: ${whatsappResult.sent ? 'OK' : 'FALHA'}`;
    
    const notificationData = {
      alerta_id: alerta.id,
      servidor_id: alerta.servidor_id || null,
      canal: 'sistema',
      destinatario: notificationEmail,
      mensagem: mensagemDetalhada,
      status: statusNotificacao,
      data_envio: new Date().toISOString()
    };

    try {
      await supabase.from('notificacoes').insert(notificationData);
      console.log('✅ Log de notificação registrado:', statusNotificacao);
    } catch (logError) {
      console.error('❌ Erro ao registrar log de notificação:', logError);
    }
  }

  console.log('=== FINALIZANDO PROCESSAMENTO ===');
  console.log('📊 Resultados finais:', { 
    emailSent: emailResult.sent, 
    whatsappSent: whatsappResult.sent, 
    emailError: emailResult.error, 
    whatsappError: whatsappResult.error 
  });

  // Determinar sucesso geral
  const overallSuccess = emailResult.sent || whatsappResult.sent;
  const hasAttempts = canaisNotificacao.length > 0;

  // Retornar resultado detalhado
  const result: NotificationResult = {
    success: overallSuccess,
    message: overallSuccess ? 
      `Alerta ${isTestMode ? 'de teste ' : ''}enviado com sucesso` :
      hasAttempts ? 
        'Falha ao enviar alerta por todos os canais configurados' :
        'Nenhum canal de notificação configurado',
    notification_email: notificationEmail,
    test_mode: isTestMode,
    channels_attempted: {
      email: { 
        attempted: canaisNotificacao.includes('email'), 
        sent: emailResult.sent, 
        error: emailResult.error 
      },
      whatsapp: { 
        attempted: canaisNotificacao.includes('whatsapp'), 
        sent: whatsappResult.sent, 
        error: whatsappResult.error 
      }
    },
    alert_details: {
      tipo_alerta: alerta.tipo_alerta,
      valor_atual,
      limite,
      servidor_nome: alerta.servidores?.nome || alerta.aplicacoes?.nome || 'Recurso desconhecido'
    }
  };

  const statusCode = overallSuccess ? 200 : 500;
  console.log(`🎯 Retornando resposta com status ${statusCode}`);

  return new Response(
    JSON.stringify(result),
    { 
      status: statusCode, 
      headers: { 'Content-Type': 'application/json', ...corsHeaders } 
    }
  );
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

    // Garantir que body JSON está presente antes de dar parse
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
