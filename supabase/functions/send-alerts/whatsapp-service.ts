
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
  try {
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

    if (!evolutionInstance) {
      throw new Error('Nenhuma instância Evolution conectada encontrada para o usuário');
    }

    console.log('Instância Evolution encontrada:', evolutionInstance.instance_name);
    
    const recursoNome = alerta.servidores?.nome || alerta.aplicacoes?.nome || 'Recurso desconhecido';
    const tipoRecurso = alerta.servidor_id ? 'Servidor' : 'Aplicação';
    const dataHora = new Date().toLocaleString('pt-BR');
    const ipServidor = alerta.servidores?.ip || 'N/A';
    
    // Template padrão se não houver personalizado
    const defaultTemplate = `🚨 *${isTestMode ? 'TESTE - ' : ''}ALERTA: {{tipo_alerta}}*

📊 *${tipoRecurso}:* {{servidor_nome}}
📍 *IP:* {{ip_servidor}}
⚠️ *Problema:* {{tipo_alerta}} em {{valor_atual}}% (limite: {{limite}}%)

🕒 *Data/Hora:* {{data_hora}}

${isTestMode ? '⚠️ *Este é um teste do sistema de alertas!*\n\n' : ''}_Mensagem automática do DeskTools_`;

    // Usar template personalizado ou padrão
    const template = evolutionInstance.message_template || defaultTemplate;
    
    // Substituir variáveis no template
    const whatsappMessage = replaceTemplateVariables(template, {
      tipo_alerta: getTipoAlertaName(alerta.tipo_alerta),
      servidor_nome: recursoNome,
      ip_servidor: ipServidor,
      valor_atual: valor_atual,
      limite: limite,
      data_hora: dataHora
    });

    console.log('Mensagem formatada:', whatsappMessage);
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

    if (!whatsappResponse.ok) {
      throw new Error(`Erro na resposta da Evolution API: ${whatsappResponse.status} - ${whatsappResult}`);
    }

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

    return { sent: true, error: null };

  } catch (error: any) {
    console.error('Erro ao enviar WhatsApp:', error);
    return { sent: false, error: error.message };
  }
}
