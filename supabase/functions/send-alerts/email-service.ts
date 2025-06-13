
import { Resend } from "npm:resend@2.0.0";
import { AlertData, UserProfile } from "./types.ts";
import { replaceTemplateVariables, getTipoAlertaName } from "./template-utils.ts";

export async function sendEmailNotification(
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

    // Buscar configurações de Resend para este usuário específico
    const { data: notificationSettings, error: settingsError } = await supabase
      .from('notification_settings')
      .select('*')
      .eq('usuario_id', alerta.usuario_id)
      .eq('email_provider', 'resend')
      .eq('is_active', true)
      .maybeSingle();

    if (settingsError) {
      console.log('⚠️ Erro ao buscar configurações de Resend:', settingsError);
    }

    // Para testes, pode usar configuração global, mas para produção exige configuração do usuário
    if (!notificationSettings && !isTestMode) {
      const error = 'Resend não está configurado e ativo para este usuário';
      console.error('❌', error);
      throw new Error(error);
    }

    // Verificar API key (global para testes, do usuário para produção)
    let resendApiKey = Deno.env.get('RESEND_API_KEY');
    let fromEmail = 'DeskTools <noreply@tools.flowserv.com.br>';
    let fromName = 'DeskTools';
    
    if (notificationSettings) {
      // Usar configurações específicas do usuário se disponíveis
      if (notificationSettings.api_key) {
        resendApiKey = notificationSettings.api_key;
        console.log('✅ Usando API key específica do usuário');
      }
      
      if (notificationSettings.from_email) {
        fromEmail = `${notificationSettings.from_name || 'DeskTools'} <${notificationSettings.from_email}>`;
        fromName = notificationSettings.from_name || 'DeskTools';
        console.log('✉️ Usando email personalizado:', fromEmail);
      }
    }

    if (!resendApiKey) {
      const error = 'RESEND_API_KEY não configurado';
      console.error('❌', error);
      throw new Error(error);
    }

    console.log('✅ RESEND_API_KEY encontrado');
    const resend = new Resend(resendApiKey);
    
    const recursoNome = alerta.servidores?.nome || alerta.aplicacoes?.nome || 'Recurso desconhecido';
    const tipoRecurso = alerta.servidor_id ? 'Servidor' : 'Aplicação';
    const dataHora = new Date().toLocaleString('pt-BR');
    const ipServidor = alerta.servidores?.ip || 'N/A';
    
    const emailSubject = `🚨 ${isTestMode ? 'TESTE - ' : ''}ALERTA: ${getTipoAlertaName(alerta.tipo_alerta)} - ${recursoNome}`;
    
    console.log('📧 Assunto do email:', emailSubject);
    
    // Buscar template personalizado de email ativo para este usuário
    const { data: emailTemplate, error: templateError } = await supabase
      .from('email_templates')
      .select('*')
      .eq('usuario_id', alerta.usuario_id)
      .eq('template_type', 'alert')
      .eq('is_active', true)
      .maybeSingle();

    if (templateError) {
      console.log('⚠️ Erro ao buscar template personalizado (usando padrão):', templateError);
    }

    let emailContent;
    
    if (emailTemplate) {
      console.log('✅ Usando template personalizado de email');
      emailContent = replaceTemplateVariables(emailTemplate.html_content, {
        tipo_alerta: getTipoAlertaName(alerta.tipo_alerta),
        servidor_nome: recursoNome,
        ip_servidor: ipServidor,
        valor_atual: valor_atual,
        limite: limite,
        data_hora: dataHora
      });
    } else {
      console.log('📝 Usando template padrão de email');
      emailContent = `
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
                  <td style="padding: 5px 10px; border-bottom: 1px solid #f5c6cb; color: #dc3545; font-weight: bold;">${valor_atual}${alerta.tipo_alerta.includes('time') ? 'ms' : '%'}</td>
                </tr>
                <tr>
                  <td style="padding: 5px 10px; border-bottom: 1px solid #f5c6cb;"><strong>Limite configurado:</strong></td>
                  <td style="padding: 5px 10px; border-bottom: 1px solid #f5c6cb;">${limite}${alerta.tipo_alerta.includes('time') ? 'ms' : '%'}</td>
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
    }

    console.log('📤 Enviando email via Resend...');
    
    const emailResult = await resend.emails.send({
      from: fromEmail,
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
        console.error('⚠️ Erro ao registrar notificação de email (email foi enviado):', notificationError);
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
