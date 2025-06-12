
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
      tipo_alerta, 
      valor_atual, 
      limite
    } = await req.json();

    console.log('Enviando alertas:', { alerta_id, servidor_id, tipo_alerta, valor_atual, limite });

    // Buscar informações do servidor e usuário
    const { data: servidor, error: serverError } = await supabase
      .from('servidores')
      .select(`
        *,
        profiles (
          email,
          nome_completo,
          whatsapp
        )
      `)
      .eq('id', servidor_id)
      .single();

    if (serverError || !servidor) {
      throw new Error('Servidor não encontrado');
    }

    const mensagem = `🚨 ALERTA: ${tipo_alerta.toUpperCase()} do servidor "${servidor.nome}" (${servidor.ip}) está em ${valor_atual.toFixed(1)}%, ultrapassando o limite de ${limite}%`;

    const results = [];

    // Enviar por email sempre
    try {
      const emailResult = await sendEmailAlert(servidor.profiles.email, mensagem, servidor);
      results.push({ canal: 'email', status: 'enviado', resultado: emailResult });
      
      // Registrar notificação
      await supabase.from('notificacoes').insert({
        alerta_id,
        servidor_id,
        canal: 'email',
        destinatario: servidor.profiles.email,
        mensagem,
        status: 'enviado'
      });
    } catch (error) {
      console.error('Erro ao enviar email:', error);
      results.push({ canal: 'email', status: 'erro', erro: error.message });
    }

    // Enviar por WhatsApp se configurado no perfil
    if (servidor.profiles.whatsapp) {
      try {
        // Buscar instância Evolution conectada do usuário
        const { data: instance } = await supabase
          .from('evolution_instances')
          .select('*')
          .eq('usuario_id', servidor.usuario_id)
          .eq('status', 'connected')
          .limit(1)
          .single();

        if (instance) {
          const whatsappResult = await sendWhatsAppAlert(
            servidor.profiles.whatsapp, 
            mensagem, 
            instance
          );
          results.push({ canal: 'whatsapp', status: 'enviado', resultado: whatsappResult });
          
          // Registrar notificação
          await supabase.from('notificacoes').insert({
            alerta_id,
            servidor_id,
            canal: 'whatsapp',
            destinatario: servidor.profiles.whatsapp,
            mensagem,
            status: 'enviado'
          });
        } else {
          results.push({ 
            canal: 'whatsapp', 
            status: 'erro', 
            erro: 'Nenhuma instância Evolution conectada' 
          });
        }
      } catch (error) {
        console.error('Erro ao enviar WhatsApp:', error);
        results.push({ canal: 'whatsapp', status: 'erro', erro: error.message });
      }
    }

    return new Response(
      JSON.stringify({ success: true, results }),
      { 
        status: 200, 
        headers: { 'Content-Type': 'application/json', ...corsHeaders } 
      }
    );

  } catch (error: any) {
    console.error('Erro ao enviar alertas:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500, 
        headers: { 'Content-Type': 'application/json', ...corsHeaders } 
      }
    );
  }
};

async function sendEmailAlert(email: string, mensagem: string, servidor: any) {
  const resendApiKey = Deno.env.get('RESEND_API_KEY');
  
  if (!resendApiKey) {
    throw new Error('RESEND_API_KEY não configurada');
  }

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${resendApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: 'DeskTools <alerts@desktools.com>',
      to: [email],
      subject: `🚨 Alerta de Servidor - ${servidor.nome}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #dc2626;">🚨 Alerta de Monitoramento</h2>
          <div style="background: #fee2e2; padding: 20px; border-radius: 8px; border-left: 4px solid #dc2626;">
            <p style="margin: 0; font-size: 16px; color: #991b1b;">
              ${mensagem}
            </p>
          </div>
          
          <div style="margin-top: 20px; padding: 20px; background: #f3f4f6; border-radius: 8px;">
            <h3 style="margin-top: 0; color: #374151;">Detalhes do Servidor</h3>
            <ul style="color: #6b7280;">
              <li><strong>Nome:</strong> ${servidor.nome}</li>
              <li><strong>IP:</strong> ${servidor.ip}</li>
              <li><strong>Provedor:</strong> ${servidor.provedor}</li>
              <li><strong>Data/Hora:</strong> ${new Date().toLocaleString('pt-BR')}</li>
            </ul>
          </div>
          
          <p style="margin-top: 20px; color: #6b7280; font-size: 14px;">
            Este é um alerta automático do sistema FlowServ de monitoramento de servidores.
          </p>
        </div>
      `,
    }),
  });

  if (!response.ok) {
    const errorData = await response.text();
    throw new Error(`Erro ao enviar email: ${errorData}`);
  }

  return await response.json();
}

async function sendWhatsAppAlert(telefone: string, mensagem: string, instance: any) {
  // Formatar número removendo caracteres especiais e garantindo formato correto
  const numeroLimpo = telefone.replace(/\D/g, '');
  const numeroFormatado = numeroLimpo + '@s.whatsapp.net';

  const response = await fetch(`${instance.api_url}/message/sendText/${instance.instance_name}`, {
    method: 'POST',
    headers: {
      'apikey': instance.api_key,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      number: numeroFormatado,
      text: mensagem
    }),
  });

  if (!response.ok) {
    const errorData = await response.text();
    throw new Error(`Erro ao enviar WhatsApp: ${errorData}`);
  }

  return await response.json();
}

serve(handler);
