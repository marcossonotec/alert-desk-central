
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

    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    if (!resendApiKey) {
      const error = 'RESEND_API_KEY não configurado nas variáveis de ambiente';
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
    
    // Buscar template personalizado de email
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
      // Usar template personalizado
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
      // Template padrão
      emailContent = `
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
    }

    console.log('📤 Enviando email via Resend...');
    
    const emailResult = await resend.emails.send({
      from: 'DeskTools <noreply@tools.flowserv.com.br>',
      to: [notificationEmail],
      subject: emailSubject,
      html: emailContent,
    });

    console.log('✅ Email enviado com sucesso via Resend:', emailResult);

    // Registrar notificação de email no banco (somente se não for teste)
    if (!isTestMode) {
      const emailNotificationData = {
        alerta_id: alerta.id,
        servidor_id: alerta.servidor_id || null,
        canal: 'email',
        destinatario: notificationEmail,
        mensagem: emailContent,
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
