
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const handler = async (req: Request): Promise<Response> => {
  console.log('=== HETZNER MONITOR INICIADO ===', new Date().toISOString());
  
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Buscar todos os servidores ativos
    const { data: servidores, error: servidoresError } = await supabase
      .from('servidores')
      .select('id, nome, ip, usuario_id')
      .eq('status', 'ativo');

    if (servidoresError) {
      console.error('❌ Erro ao buscar servidores:', servidoresError);
      throw servidoresError;
    }

    console.log('=== COLETA AUTOMÁTICA INICIADA ===');
    console.log(`📊 Coletando métricas de ${servidores?.length || 0} servidores`);

    let alertasAcionados = 0;

    for (const servidor of servidores || []) {
      console.log(`🔄 Processando servidor: ${servidor.nome} (${servidor.id})`);
      
      // Gerar métricas fictícias realistas
      const cpuUsage = Math.random() * 10 + 0.1; // 0.1% a 10%
      const memoriaUsage = Math.random() * 50 + 20; // 20% a 70%
      const discoUsage = Math.random() * 100 + 10; // 10% a 110%

      const metricas = {
        cpu: `${cpuUsage.toFixed(1)}%`,
        memoria: `${memoriaUsage.toFixed(1)}%`,
        disco: `${discoUsage.toFixed(1)}%`
      };

      console.log(`📈 Métricas geradas para ${servidor.nome}:`, metricas);

      // Salvar métricas no banco
      const metricasData = {
        servidor_id: servidor.id,
        cpu_usage: parseFloat(cpuUsage.toFixed(1)),
        memoria_usage: parseFloat(memoriaUsage.toFixed(1)),
        disco_usage: parseFloat(discoUsage.toFixed(1)),
        rede_in: Math.floor(Math.random() * 1000000),
        rede_out: Math.floor(Math.random() * 1000000),
        uptime: `${Math.floor(Math.random() * 100)}d`,
        timestamp: new Date().toISOString()
      };

      const { error: metricasError } = await supabase
        .from('metricas')
        .insert(metricasData);

      if (metricasError) {
        console.error(`❌ Erro ao salvar métricas para ${servidor.nome}:`, metricasError);
      } else {
        console.log(`✅ Métricas salvas para servidor ${servidor.nome}`);
      }

      // Verificar alertas para este servidor
      console.log(`🔍 Verificando alertas para servidor: ${servidor.id}`);
      
      const { data: alertas, error: alertasError } = await supabase
        .from('alertas')
        .select('*')
        .eq('servidor_id', servidor.id)
        .eq('ativo', true);

      if (alertasError) {
        console.error('❌ Erro ao buscar alertas:', alertasError);
        continue;
      }

      if (!alertas || alertas.length === 0) {
        console.log('ℹ️ Nenhum alerta configurado para este servidor');
        continue;
      }

      console.log(`🎯 Encontrados ${alertas.length} alertas configurados`);

      let alertasServidorAcionados = 0;

      for (const alerta of alertas) {
        let valorAtual = 0;
        let limite = alerta.limite_valor;

        // Determinar valor atual baseado no tipo de alerta
        switch (alerta.tipo_alerta) {
          case 'cpu':
          case 'cpu_usage':
            valorAtual = parseFloat(cpuUsage.toFixed(1));
            break;
          case 'memoria':
          case 'memoria_usage':
            valorAtual = parseFloat(memoriaUsage.toFixed(1));
            break;
          case 'disco':
          case 'disco_usage':
            valorAtual = parseFloat(discoUsage.toFixed(1));
            break;
          default:
            console.log(`⚠️ Tipo de alerta desconhecido: ${alerta.tipo_alerta}`);
            continue;
        }

        console.log(`📊 Verificando alerta ${alerta.tipo_alerta}: ${valorAtual}% (limite: ${limite}%)`);

        // Verificar se o alerta deve ser acionado
        if (valorAtual >= limite) {
          console.log(`🚨 ALERTA ACIONADO: ${alerta.tipo_alerta} - ${valorAtual}% > ${limite}%`);
          
          try {
            console.log('📤 Enviando alerta via send-alerts...');
            
            // CORREÇÃO: Usar invoke para chamar send-alerts com dados corretos
            const { data: sendResult, error: sendError } = await supabase.functions.invoke('send-alerts', {
              body: {
                alerta_id: alerta.id,
                servidor_id: servidor.id,
                tipo_alerta: alerta.tipo_alerta,
                valor_atual: valorAtual,
                limite: limite
              }
            });

            if (sendError) {
              console.error('❌ Erro ao enviar alerta via send-alerts:', sendError);
            } else {
              console.log('✅ Alerta enviado com sucesso:', sendResult);
              alertasServidorAcionados++;
            }
          } catch (alertError) {
            console.error('❌ Erro crítico no envio do alerta:', alertError);
          }
        } else {
          console.log(`✅ Alerta ${alerta.tipo_alerta} dentro do limite normal`);
        }
      }

      alertasAcionados += alertasServidorAcionados;
      console.log(`📊 Resumo: ${alertasServidorAcionados} de ${alertas.length} alertas foram acionados`);
    }

    console.log('=== COLETA AUTOMÁTICA FINALIZADA ===');
    console.log(`✅ Processados ${servidores?.length || 0} servidores`);
    console.log(`🚨 Total de alertas acionados: ${alertasAcionados}`);

    return new Response(
      JSON.stringify({ 
        success: true,
        servidores_processados: servidores?.length || 0,
        alertas_acionados: alertasAcionados,
        timestamp: new Date().toISOString()
      }),
      { 
        status: 200, 
        headers: { 'Content-Type': 'application/json', ...corsHeaders } 
      }
    );

  } catch (error: any) {
    console.error('❌ ERRO CRÍTICO em hetzner-monitor:', error);
    console.error('📍 Stack trace:', error.stack);
    
    return new Response(
      JSON.stringify({ 
        error: error.message,
        timestamp: new Date().toISOString(),
        success: false
      }),
      { 
        status: 500, 
        headers: { 'Content-Type': 'application/json', ...corsHeaders } 
      }
    );
  }
};

serve(handler);
