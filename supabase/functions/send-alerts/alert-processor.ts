
import { AlertData, UserProfile, NotificationResult } from "./types.ts";
import { sendEmailNotification } from "./email-service.ts";
import { sendWhatsAppNotification } from "./whatsapp-service.ts";
import { corsHeaders } from "./utils.ts";

export async function processAlert(
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
