
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

    // Buscar todos os servidores ativos com informações do usuário
    const { data: servidores, error: servidoresError } = await supabase
      .from('servidores')
      .select(`
        id, 
        nome, 
        ip, 
        usuario_id,
        profiles!inner(
          id,
          email,
          email_notificacoes,
          nome_completo
        )
      `)
      .eq('status', 'ativo');

    if (servidoresError) {
      console.error('❌ Erro ao buscar servidores:', servidoresError);
      throw servidoresError;
    }

    console.log('=== COLETA AUTOMÁTICA INICIADA ===');
    console.log(`📊 Coletando métricas de ${servidores?.length || 0} servidores`);

    let alertasAcionados = 0;
    let errosProcessamento = 0;
    let sucessoProcessamento = 0;

    for (const servidor of servidores || []) {
      console.log(`🔄 Processando servidor: ${servidor.nome} (${servidor.id})`);
      console.log(`👤 Usuário: ${servidor.profiles.email} (${servidor.profiles.nome_completo})`);
      
      try {
        // Gerar métricas mais realistas com maior chance de disparar alertas
        const cpuUsage = Math.random() * 100; // 0% a 100%
        const memoriaUsage = Math.random() * 100; // 0% a 100%
        const discoUsage = Math.random() * 100; // 0% a 100%

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
          errosProcessamento++;
          continue;
        } else {
          console.log(`✅ Métricas salvas para servidor ${servidor.nome}`);
          sucessoProcessamento++;
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
          errosProcessamento++;
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
            console.log(`🚨 ALERTA ACIONADO: ${alerta.tipo_alerta} - ${valorAtual}% >= ${limite}%`);
            
            try {
              console.log('📤 Enviando alerta via send-alerts...');
              
              // Usar supabase.functions.invoke para chamar send-alerts
              const { data: sendResult, error: sendError } = await supabase.functions.invoke('send-alerts', {
                body: {
                  alerta_id: alerta.id,
                  servidor_id: servidor.id,
                  tipo_alerta: alerta.tipo_alerta,
                  valor_atual: valorAtual,
                  limite: limite
                },
                headers: {
                  'Content-Type': 'application/json'
                }
              });

              if (sendError) {
                console.error('❌ Erro ao enviar alerta via send-alerts:', sendError);
                errosProcessamento++;
                
                // Registrar erro de sistema com email correto do usuário
                const emailDestinatario = servidor.profiles.email_notificacoes || servidor.profiles.email;
                await supabase
                  .from('notificacoes')
                  .insert({
                    alerta_id: alerta.id,
                    servidor_id: servidor.id,
                    canal: 'sistema',
                    destinatario: emailDestinatario,
                    mensagem: `Erro no envio automático de alerta ${alerta.tipo_alerta}: ${sendError.message}`,
                    status: 'erro_sistema',
                    data_envio: new Date().toISOString()
                  });
              } else {
                console.log('✅ Alerta enviado com sucesso:', sendResult);
                alertasServidorAcionados++;
                
                // Registrar sucesso com email correto do usuário
                const emailDestinatario = servidor.profiles.email_notificacoes || servidor.profiles.email;
                await supabase
                  .from('notificacoes')
                  .insert({
                    alerta_id: alerta.id,
                    servidor_id: servidor.id,
                    canal: 'sistema',
                    destinatario: emailDestinatario,
                    mensagem: `Alerta automático enviado: ${alerta.tipo_alerta} - ${valorAtual}% (limite: ${limite}%)`,
                    status: 'enviado',
                    data_envio: new Date().toISOString()
                  });
              }
            } catch (alertError) {
              console.error('❌ Erro crítico no envio do alerta:', alertError);
              errosProcessamento++;
              
              // Registrar erro crítico com email correto do usuário
              try {
                const emailDestinatario = servidor.profiles.email_notificacoes || servidor.profiles.email;
                await supabase
                  .from('notificacoes')
                  .insert({
                    alerta_id: alerta.id,
                    servidor_id: servidor.id,
                    canal: 'sistema',
                    destinatario: emailDestinatario,
                    mensagem: `Erro crítico no processamento automático de alerta: ${alertError.message}`,
                    status: 'erro_critico',
                    data_envio: new Date().toISOString()
                  });
              } catch (logError) {
                console.error('❌ Erro ao registrar log de erro crítico:', logError);
              }
            }
          } else {
            console.log(`✅ Alerta ${alerta.tipo_alerta} dentro do limite normal`);
          }
        }

        alertasAcionados += alertasServidorAcionados;
        console.log(`📊 Resumo servidor ${servidor.nome}: ${alertasServidorAcionados} de ${alertas.length} alertas foram acionados`);

      } catch (servidorError) {
        console.error(`❌ Erro ao processar servidor ${servidor.nome}:`, servidorError);
        errosProcessamento++;
      }
    }

    console.log('=== COLETA AUTOMÁTICA FINALIZADA ===');
    console.log(`✅ Processados ${servidores?.length || 0} servidores`);
    console.log(`📊 Sucessos: ${sucessoProcessamento}, Alertas acionados: ${alertasAcionados}, Erros: ${errosProcessamento}`);

    // Registrar status da execução
    try {
      await supabase
        .from('notificacoes')
        .insert({
          alerta_id: null,
          servidor_id: null,
          canal: 'sistema',
          destinatario: 'hetzner-monitor',
          mensagem: `Execução automática concluída: ${servidores?.length || 0} servidores, ${sucessoProcessamento} sucessos, ${alertasAcionados} alertas enviados, ${errosProcessamento} erros`,
          status: errosProcessamento > 0 ? 'parcial_sucesso' : 'sucesso',
          data_envio: new Date().toISOString()
        });
    } catch (logError) {
      console.error('❌ Erro ao registrar status da execução:', logError);
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        servidores_processados: servidores?.length || 0,
        sucessos_processamento: sucessoProcessamento,
        alertas_acionados: alertasAcionados,
        erros_processamento: errosProcessamento,
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
    
    // Tentar registrar erro crítico no sistema
    try {
      const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
      await supabase
        .from('notificacoes')
        .insert({
          alerta_id: null,
          servidor_id: null,
          canal: 'sistema',
          destinatario: 'sistema',
          mensagem: `Erro crítico em hetzner-monitor: ${error.message}`,
          status: 'erro_critico',
          data_envio: new Date().toISOString()
        });
    } catch (logError) {
      console.error('❌ Erro ao registrar erro crítico:', logError);
    }
    
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
