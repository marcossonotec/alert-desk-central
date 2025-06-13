
import { AlertData, UserProfile } from "./types.ts";
import { replaceTemplateVariables, getTipoAlertaName } from "./template-utils.ts";

export async function sendWhatsAppNotification(
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
    
    // Buscar instância Evolution API do usuário
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
    
    // Template padrão melhorado se não houver personalizado
    const defaultTemplate = `🚨 *${isTestMode ? 'TESTE - ' : ''}ALERTA: {{tipo_alerta}}*

📊 *${tipoRecurso}:* {{servidor_nome}}
${ipServidor !== 'N/A' ? '📍 *IP:* {{ip_servidor}}' : ''}
⚠️ *Problema:* {{tipo_alerta}} em {{valor_atual}}% (limite: {{limite}}%)

🕒 *Data/Hora:* {{data_hora}}

${isTestMode ? '⚠️ *Este é um teste do sistema de alertas!*\n\n' : ''}_Mensagem automática do DeskTools_`;

    // Usar template personalizado ou padrão
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
    
    // Formatar número do WhatsApp (remover caracteres não numéricos e garantir formato correto)
    let whatsappNumber = profile.whatsapp.replace(/\D/g, '');
    
    // Adicionar código do país se não existir
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

    // Tentar parsear a resposta para verificar se foi bem-sucedida
    let parsedResult;
    try {
      parsedResult = JSON.parse(whatsappResult);
      console.log('✅ Resposta parseada:', parsedResult);
    } catch (parseError) {
      console.log('⚠️ Não foi possível parsear a resposta, mas status é OK');
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
        console.error('⚠️ Erro ao registrar notificação WhatsApp (mensagem foi enviada):', notificationError);
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
