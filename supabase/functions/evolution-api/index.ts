
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

    const url = new URL(req.url);
    const action = url.searchParams.get('action');

    if (req.method === 'POST') {
      const body = await req.json();

      switch (action) {
        case 'create-instance':
          return await createInstance(supabase, body);
        case 'get-qr':
          return await getQRCode(supabase, body);
        case 'check-status':
          return await checkInstanceStatus(supabase, body);
        case 'delete-instance':
          return await deleteInstance(supabase, body);
        default:
          return new Response(
            JSON.stringify({ error: 'Ação não encontrada' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
      }
    }

    if (req.method === 'GET') {
      const userId = url.searchParams.get('user_id');
      return await getUserInstances(supabase, userId);
    }

    return new Response(
      JSON.stringify({ error: 'Método não permitido' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Erro na função evolution-api:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
};

async function createInstance(supabase: any, body: any) {
  const { usuario_id, instance_name, api_url, api_key } = body;

  try {
    // Criar instância no Evolution API
    const evolutionResponse = await fetch(`${api_url}/instance/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': api_key,
      },
      body: JSON.stringify({
        instanceName: instance_name,
        qrcode: true,
        integration: 'WHATSAPP-BAILEYS'
      }),
    });

    if (!evolutionResponse.ok) {
      throw new Error('Erro ao criar instância no Evolution API');
    }

    // Salvar no banco de dados
    const { data, error } = await supabase
      .from('evolution_instances')
      .insert({
        usuario_id,
        instance_name,
        api_url,
        api_key,
        status: 'connecting'
      })
      .select()
      .single();

    if (error) throw error;

    return new Response(
      JSON.stringify({ success: true, instance: data }),
      { status: 200, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );

  } catch (error: any) {
    console.error('Erro ao criar instância:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
  }
}

async function getQRCode(supabase: any, body: any) {
  const { instance_id } = body;

  try {
    // Buscar instância no banco
    const { data: instance, error } = await supabase
      .from('evolution_instances')
      .select('*')
      .eq('id', instance_id)
      .single();

    if (error || !instance) {
      throw new Error('Instância não encontrada');
    }

    // Buscar QR Code no Evolution API
    const evolutionResponse = await fetch(`${instance.api_url}/instance/connect/${instance.instance_name}`, {
      method: 'GET',
      headers: {
        'apikey': instance.api_key,
      },
    });

    if (!evolutionResponse.ok) {
      throw new Error('Erro ao buscar QR Code');
    }

    const qrData = await evolutionResponse.json();

    // Atualizar QR Code no banco
    await supabase
      .from('evolution_instances')
      .update({ qr_code: qrData.base64 || qrData.qrcode })
      .eq('id', instance_id);

    return new Response(
      JSON.stringify({ success: true, qr_code: qrData.base64 || qrData.qrcode }),
      { status: 200, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );

  } catch (error: any) {
    console.error('Erro ao buscar QR Code:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
  }
}

async function checkInstanceStatus(supabase: any, body: any) {
  const { instance_id } = body;

  try {
    const { data: instance, error } = await supabase
      .from('evolution_instances')
      .select('*')
      .eq('id', instance_id)
      .single();

    if (error || !instance) {
      throw new Error('Instância não encontrada');
    }

    // Verificar status no Evolution API
    const evolutionResponse = await fetch(`${instance.api_url}/instance/connectionState/${instance.instance_name}`, {
      method: 'GET',
      headers: {
        'apikey': instance.api_key,
      },
    });

    if (!evolutionResponse.ok) {
      await supabase
        .from('evolution_instances')
        .update({ status: 'error' })
        .eq('id', instance_id);

      return new Response(
        JSON.stringify({ success: true, status: 'error' }),
        { status: 200, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    const statusData = await evolutionResponse.json();
    const status = statusData.instance?.state === 'open' ? 'connected' : 'disconnected';

    // Atualizar status no banco
    await supabase
      .from('evolution_instances')
      .update({ status })
      .eq('id', instance_id);

    return new Response(
      JSON.stringify({ success: true, status }),
      { status: 200, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );

  } catch (error: any) {
    console.error('Erro ao verificar status:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
  }
}

async function deleteInstance(supabase: any, body: any) {
  const { instance_id } = body;

  try {
    const { data: instance, error } = await supabase
      .from('evolution_instances')
      .select('*')
      .eq('id', instance_id)
      .single();

    if (error || !instance) {
      throw new Error('Instância não encontrada');
    }

    // Deletar no Evolution API
    await fetch(`${instance.api_url}/instance/delete/${instance.instance_name}`, {
      method: 'DELETE',
      headers: {
        'apikey': instance.api_key,
      },
    });

    // Deletar do banco
    await supabase
      .from('evolution_instances')
      .delete()
      .eq('id', instance_id);

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );

  } catch (error: any) {
    console.error('Erro ao deletar instância:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
  }
}

async function getUserInstances(supabase: any, userId: string | null) {
  if (!userId) {
    return new Response(
      JSON.stringify({ error: 'User ID obrigatório' }),
      { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
  }

  try {
    const { data, error } = await supabase
      .from('evolution_instances')
      .select('*')
      .eq('usuario_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return new Response(
      JSON.stringify({ success: true, instances: data }),
      { status: 200, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );

  } catch (error: any) {
    console.error('Erro ao buscar instâncias:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
  }
}

serve(handler);
