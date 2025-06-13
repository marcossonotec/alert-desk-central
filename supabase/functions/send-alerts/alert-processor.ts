
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

  let emailResult = { sent: false, error: null };
  let whatsappResult = { sent: false, error: null };

  // Enviar email
  emailResult = await sendEmailNotification(alerta, profile, valor_atual, limite, supabase, isTestMode);

  // Enviar WhatsApp se configurado
  if (profile.whatsapp && alerta.canal_notificacao?.includes('whatsapp')) {
    whatsappResult = await sendWhatsAppNotification(alerta, profile, valor_atual, limite, supabase, isTestMode);
  } else {
    console.log('WhatsApp não configurado ou não incluído nos canais de notificação');
  }

  console.log('=== FINALIZANDO PROCESSAMENTO ===');
  console.log('Resultados:', { 
    emailSent: emailResult.sent, 
    whatsappSent: whatsappResult.sent, 
    emailError: emailResult.error, 
    whatsappError: whatsappResult.error 
  });

  // Retornar resultado detalhado
  const result: NotificationResult = {
    success: emailResult.sent || whatsappResult.sent,
    message: emailResult.sent && whatsappResult.sent ? 
      `Alerta ${isTestMode ? 'de teste ' : ''}enviado com sucesso para email e WhatsApp` :
      emailResult.sent ? 
        `Alerta ${isTestMode ? 'de teste ' : ''}enviado com sucesso para email` :
        whatsappResult.sent ?
          `Alerta ${isTestMode ? 'de teste ' : ''}enviado com sucesso para WhatsApp` :
          'Falha ao enviar alerta por todos os canais',
    notification_email: notificationEmail,
    test_mode: isTestMode,
    channels_attempted: {
      email: { attempted: true, sent: emailResult.sent, error: emailResult.error },
      whatsapp: { 
        attempted: profile.whatsapp && alerta.canal_notificacao?.includes('whatsapp'), 
        sent: whatsappResult.sent, 
        error: whatsappResult.error 
      }
    }
  };

  return new Response(
    JSON.stringify(result),
    { 
      status: emailResult.sent || whatsappResult.sent ? 200 : 500, 
      headers: { 'Content-Type': 'application/json', ...corsHeaders } 
    }
  );
}
