
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { AlertRequest } from "./types.ts";
import { corsHeaders } from "./utils.ts";
import { handleTestMode } from "./test-mode-handler.ts";
import { processAlert } from "./alert-processor.ts";

const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Extrair token de autorização para identificar o usuário
    const authHeader = req.headers.get('Authorization');
    let authUserId: string | undefined;
    
    if (authHeader) {
      try {
        const token = authHeader.replace('Bearer ', '');
        const { data: { user }, error } = await supabase.auth.getUser(token);
        if (user && !error) {
          authUserId = user.id;
          console.log('Usuário autenticado identificado:', user.email);
        }
      } catch (error) {
        console.log('Erro ao identificar usuário:', error);
      }
    }

    const requestBody: AlertRequest = await req.json();
    console.log('Request body recebido:', requestBody);

    // Verificar se é modo de teste
    if (requestBody.test_mode) {
      const { alerta, profile } = await handleTestMode(supabase, requestBody, authUserId);
      return await processAlert(supabase, alerta, requestBody.valor_atual || 85, requestBody.limite || 80, profile, true);
    }

    // Modo normal - buscar alerta no banco
    const { 
      alerta_id, 
      servidor_id, 
      aplicacao_id, 
      tipo_alerta, 
      valor_atual, 
      limite 
    } = requestBody;

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

    return await processAlert(supabase, alerta, valor_atual, limite);

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
