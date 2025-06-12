
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

    const { 
      alerta_id, 
      servidor_id, 
      aplicacao_id, 
      tipo_alerta, 
      valor_atual, 
      limite 
    } = await req.json();

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

    // Buscar perfil do usuário com email de notificações
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('nome_completo, email, email_notificacoes, whatsapp, empresa')
      .eq('id', alerta.usuario_id)
      .single();

    if (profileError || !profile) {
      throw new Error('Perfil do usuário não encontrado');
    }

    // Buscar template de email personalizado
    const { data: emailTemplate } = await supabase
      .from('email_templates')
      .select('*')
      .eq('usuario_id', alerta.usuario_id)
      .eq('template_type', 'alert')
      .eq('is_active', true)
      .single();

    // Determinar qual email usar para notificações
    const notificationEmail = profile.email_notificacoes || profile.email;
    
    console.log('Email para notificação:', notificationEmail);

    // Preparar dados para as mensagens
    const recursoNome = alerta.servidores?.nome || alerta.aplicacoes?.nome || 'Recurso desconhecido';
    const tipoRecurso = servidor_id ? 'Servidor' : 'Aplicação';
    const dataHora = new Date().toLocaleString('pt-BR');
    const ipServidor = alerta.servidores?.ip || 'N/A';
    
    // Função para substituir variáveis no template
    const replaceVariables = (template: string) => {
      return template
        .replace(/\{\{nome\}\}/g, profile.nome_completo || 'Usuário')
        .replace(/\{\{empresa\}\}/g, profile.empresa || 'Sua empresa')
        .replace(/\{\{servidor_nome\}\}/g, recursoNome)
        .replace(/\{\{tipo_alerta\}\}/g, getTipoAlertaName(tipo_alerta))
        .replace(/\{\{valor_atual\}\}/g, valor_atual?.toString() || 'N/A')
        .replace(/\{\{limite\}\}/g, limite?.toString() || 'N/A')
        .replace(/\{\{data_hora\}\}/g, dataHora)
        .replace(/\{\{ip_servidor\}\}/g, ipServidor)
        .replace(/\{\{status\}\}/g, getStatusFromTipoAlerta(tipo_alerta));
    };

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
    let emailContent = '';
    let emailSubject = '';

    if (emailTemplate) {
      // Usar template personalizado
      emailSubject = replaceVariables(emailTemplate.subject);
      emailContent = replaceVariables(emailTemplate.html_content);
    } else {
      // Usar template padrão
      emailSubject = `🚨 ALERTA: ${getTipoAlertaName(tipo_alerta)} - ${recursoNome}`;
      emailContent = `
        <h1>Alerta de Monitoramento</h1>
        <p><strong>Olá ${profile.nome_completo || 'Usuário'},</strong></p>
        <p>Foi detectado um alerta no seu ${tipoRecurso.toLowerCase()}: <strong>${recursoNome}</strong></p>
        
        <div style="background-color: #f8f9fa; padding: 15px; border-left: 4px solid #dc3545; margin: 20px 0;">
          <h3 style="color: #dc3545; margin-top: 0;">⚠️ ${getTipoAlertaName(tipo_alerta)}</h3>
          <p><strong>Valor atual:</strong> ${valor_atual}${tipo_alerta.includes('time') ? 'ms' : '%'}</p>
          <p><strong>Limite configurado:</strong> ${limite}${tipo_alerta.includes('time') ? 'ms' : '%'}</p>
          ${ipServidor !== 'N/A' ? `<p><strong>IP do servidor:</strong> ${ipServidor}</p>` : ''}
          <p><strong>Data/Hora:</strong> ${dataHora}</p>
        </div>
        
        <p>Este é um alerta automático do sistema de monitoramento DeskTools.</p>
      `;
    }

    // Registrar notificação de email no banco
    const emailNotificationData = {
      alerta_id,
      servidor_id: servidor_id || null,
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
    }

    // Se WhatsApp configurado e canais incluem WhatsApp, enviar via WhatsApp
    if (profile.whatsapp && alerta.canal_notificacao?.includes('whatsapp')) {
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
          // Buscar template de WhatsApp personalizado ou usar padrão
          let whatsappMessage = evolutionInstance.message_template || `🚨 *ALERTA: {{tipo_alerta}}*

📊 *${tipoRecurso}:* {{servidor_nome}}
📍 *IP:* {{ip_servidor}}
⚠️ *Problema:* {{tipo_alerta}} em {{valor_atual}}% (limite: {{limite}}%)

🕒 *Data/Hora:* {{data_hora}}

_Mensagem automática do DeskTools_`;

          // Substituir variáveis na mensagem do WhatsApp
          whatsappMessage = replaceVariables(whatsappMessage);

          // Enviar WhatsApp via Evolution API
          await fetch(`${evolutionInstance.api_url}/message/sendText/${evolutionInstance.instance_name}`, {
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

          console.log('WhatsApp enviado para:', profile.whatsapp);

          // Registrar notificação WhatsApp
          await supabase
            .from('notificacoes')
            .insert({
              ...emailNotificationData,
              canal: 'whatsapp',
              destinatario: profile.whatsapp,
              mensagem: whatsappMessage
            });

        } catch (whatsappError) {
          console.error('Erro ao enviar WhatsApp:', whatsappError);
        }
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Alerta enviado com sucesso',
        notification_email: notificationEmail 
      }),
      { 
        status: 200, 
        headers: { 'Content-Type': 'application/json', ...corsHeaders } 
      }
    );

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

serve(handler);
