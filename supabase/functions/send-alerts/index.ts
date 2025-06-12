
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
      .select('nome_completo, email, email_notificacoes, whatsapp')
      .eq('id', alerta.usuario_id)
      .single();

    if (profileError || !profile) {
      throw new Error('Perfil do usuário não encontrado');
    }

    // Determinar qual email usar para notificações
    const notificationEmail = profile.email_notificacoes || profile.email;
    
    console.log('Email para notificação:', notificationEmail);

    // Preparar dados para a mensagem
    const recursoNome = alerta.servidores?.nome || alerta.aplicacoes?.nome || 'Recurso desconhecido';
    const tipoRecurso = servidor_id ? 'Servidor' : 'Aplicação';
    
    let mensagem = `🚨 ALERTA: ${tipoRecurso} "${recursoNome}"\n\n`;
    
    switch (tipo_alerta) {
      case 'cpu_usage':
        mensagem += `⚠️ Alto uso de CPU: ${valor_atual}% (limite: ${limite}%)`;
        break;
      case 'memoria_usage':
        mensagem += `⚠️ Alto uso de memória: ${valor_atual}% (limite: ${limite}%)`;
        break;
      case 'disco_usage':
        mensagem += `⚠️ Alto uso de disco: ${valor_atual}% (limite: ${limite}%)`;
        break;
      case 'response_time':
        mensagem += `⚠️ Tempo de resposta alto: ${valor_atual}ms (limite: ${limite}ms)`;
        break;
      case 'status':
        mensagem += `🔴 Servidor/Aplicação está OFFLINE`;
        break;
      default:
        mensagem += `⚠️ ${tipo_alerta}: ${valor_atual} (limite: ${limite})`;
    }

    if (servidor_id && alerta.servidores?.ip) {
      mensagem += `\n\n📍 IP: ${alerta.servidores.ip}`;
    }

    mensagem += `\n\n🕒 ${new Date().toLocaleString('pt-BR')}`;

    // Registrar notificação no banco
    const notificationData = {
      alerta_id,
      servidor_id: servidor_id || null,
      canal: 'email',
      destinatario: notificationEmail,
      mensagem,
      status: 'enviado'
    };

    const { error: notificationError } = await supabase
      .from('notificacoes')
      .insert(notificationData);

    if (notificationError) {
      console.error('Erro ao registrar notificação:', notificationError);
    }

    // Enviar por email (implementar integração com serviço de email)
    // Por enquanto apenas registra no banco

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
          // Enviar WhatsApp via Evolution API
          await fetch(`${evolutionInstance.api_url}/message/sendText/${evolutionInstance.instance_name}`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'apikey': evolutionInstance.api_key
            },
            body: JSON.stringify({
              number: profile.whatsapp.replace(/\D/g, ''),
              text: mensagem
            })
          });

          console.log('WhatsApp enviado para:', profile.whatsapp);

          // Registrar notificação WhatsApp
          await supabase
            .from('notificacoes')
            .insert({
              ...notificationData,
              canal: 'whatsapp',
              destinatario: profile.whatsapp
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
