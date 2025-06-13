
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface HetznerServerMetrics {
  cpu_usage: number;
  memory_usage: number;
  disk_usage: number;
  network_in: number;
  network_out: number;
  uptime: string;
  timestamp: string;
}

const handler = async (req: Request): Promise<Response> => {
  console.log('=== HETZNER MONITOR INICIADO ===', new Date().toISOString());
  
  // Lidar com requisições CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    if (req.method === 'POST') {
      // Receber métricas do webhook
      const { servidor_id, metrics } = await req.json();
      
      console.log('=== WEBHOOK RECEBIDO ===');
      console.log('Servidor ID:', servidor_id);
      console.log('Métricas:', metrics);
      
      // Salvar métricas no banco de dados
      const { error: metricsError } = await supabase
        .from('metricas')
        .insert({
          servidor_id,
          cpu_usage: metrics.cpu_usage,
          memoria_usage: metrics.memory_usage,
          disco_usage: metrics.disk_usage,
          rede_in: metrics.network_in,
          rede_out: metrics.network_out,
          uptime: metrics.uptime,
          timestamp: new Date().toISOString()
        });

      if (metricsError) {
        console.error('❌ Erro ao salvar métricas:', metricsError);
        throw metricsError;
      }

      console.log('✅ Métricas salvas com sucesso');

      // Verificar alertas configurados
      await checkAndTriggerAlerts(supabase, servidor_id, metrics);

      return new Response(
        JSON.stringify({ success: true, message: 'Métricas salvas e alertas verificados' }),
        { 
          status: 200, 
          headers: { 'Content-Type': 'application/json', ...corsHeaders } 
        }
      );
    }

    if (req.method === 'GET') {
      console.log('=== COLETA AUTOMÁTICA INICIADA ===');
      
      // Coletar métricas de todos os servidores
      const { data: servidores, error } = await supabase
        .from('servidores')
        .select('*')
        .eq('status', 'ativo');

      if (error) {
        console.error('❌ Erro ao buscar servidores:', error);
        throw error;
      }

      console.log(`📊 Coletando métricas de ${servidores?.length || 0} servidores`);

      const results = [];
      
      for (const servidor of servidores || []) {
        try {
          console.log(`🔄 Processando servidor: ${servidor.nome} (${servidor.id})`);
          
          // Gerar métricas simuladas (em produção, aqui seria feita a coleta real)
          const metrics = await generateSimulatedMetrics(servidor);
          
          console.log(`📈 Métricas geradas para ${servidor.nome}:`, {
            cpu: `${metrics.cpu_usage.toFixed(1)}%`,
            memoria: `${metrics.memory_usage.toFixed(1)}%`,
            disco: `${metrics.disk_usage.toFixed(1)}%`
          });
          
          // Salvar métricas
          const { error: metricsError } = await supabase
            .from('metricas')
            .insert({
              servidor_id: servidor.id,
              cpu_usage: metrics.cpu_usage,
              memoria_usage: metrics.memory_usage,
              disco_usage: metrics.disk_usage,
              rede_in: metrics.network_in,
              rede_out: metrics.network_out,
              uptime: metrics.uptime,
              timestamp: new Date().toISOString()
            });

          if (metricsError) {
            console.error(`❌ Erro ao salvar métricas do servidor ${servidor.nome}:`, metricsError);
          } else {
            console.log(`✅ Métricas salvas para servidor ${servidor.nome}`);
          }

          // Verificar alertas
          const alertsTriggered = await checkAndTriggerAlerts(supabase, servidor.id, metrics);
          
          results.push({
            servidor_id: servidor.id,
            nome: servidor.nome,
            status: 'coletado',
            metrics,
            alerts_triggered: alertsTriggered
          });

        } catch (error) {
          console.error(`❌ Erro ao processar servidor ${servidor.nome}:`, error);
          results.push({
            servidor_id: servidor.id,
            nome: servidor.nome,
            status: 'erro',
            error: error.message
          });
        }
      }

      console.log('=== COLETA AUTOMÁTICA FINALIZADA ===');
      console.log(`✅ Processados ${results.length} servidores`);

      return new Response(
        JSON.stringify({ 
          success: true, 
          results, 
          total_servers: servidores?.length || 0,
          timestamp: new Date().toISOString()
        }),
        { 
          status: 200, 
          headers: { 'Content-Type': 'application/json', ...corsHeaders } 
        }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Método não permitido' }),
      { 
        status: 405, 
        headers: { 'Content-Type': 'application/json', ...corsHeaders } 
      }
    );

  } catch (error: any) {
    console.error('❌ ERRO CRÍTICO na função hetzner-monitor:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        timestamp: new Date().toISOString()
      }),
      { 
        status: 500, 
        headers: { 'Content-Type': 'application/json', ...corsHeaders } 
      }
    );
  }
};

async function generateSimulatedMetrics(servidor: any): Promise<HetznerServerMetrics> {
  // Gerar métricas simuladas realistas
  const baseTime = Date.now();
  const hour = new Date().getHours();
  
  // Simular variação baseada no horário (mais uso durante o dia)
  const dailyMultiplier = 0.3 + (Math.sin((hour - 6) * Math.PI / 12) * 0.4);
  
  // CPU: varia entre 10-90%, com picos ocasionais
  const cpuBase = 20 + (Math.random() * 30);
  const cpuSpike = Math.random() < 0.1 ? Math.random() * 40 : 0; // 10% chance de pico
  const cpu_usage = Math.min(95, (cpuBase + cpuSpike) * dailyMultiplier);
  
  // Memória: geralmente mais estável, 30-80%
  const memory_usage = 30 + (Math.random() * 50) * dailyMultiplier;
  
  // Disco: cresce lentamente, 20-95%
  const disk_usage = 20 + (Math.random() * 75);
  
  // Rede: varia bastante
  const network_in = Math.floor(Math.random() * 10000000); // até 10MB
  const network_out = Math.floor(Math.random() * 5000000); // até 5MB
  
  // Uptime: simular alguns dias
  const uptimeDays = Math.floor(Math.random() * 30) + 1;
  const uptimeHours = Math.floor(Math.random() * 24);
  const uptimeMinutes = Math.floor(Math.random() * 60);
  const uptime = `${uptimeDays}d ${uptimeHours}h ${uptimeMinutes}m`;

  return {
    cpu_usage: Number(cpu_usage.toFixed(2)),
    memory_usage: Number(memory_usage.toFixed(2)),
    disk_usage: Number(disk_usage.toFixed(2)),
    network_in,
    network_out,
    uptime,
    timestamp: new Date().toISOString()
  };
}

async function checkAndTriggerAlerts(supabase: any, servidor_id: string, metrics: any): Promise<number> {
  console.log('🔍 Verificando alertas para servidor:', servidor_id);
  
  try {
    // Buscar alertas configurados para este servidor
    const { data: alertas, error } = await supabase
      .from('alertas')
      .select('*')
      .eq('servidor_id', servidor_id)
      .eq('ativo', true);

    if (error) {
      console.error('❌ Erro ao buscar alertas:', error);
      return 0;
    }

    if (!alertas || alertas.length === 0) {
      console.log('ℹ️ Nenhum alerta configurado para este servidor');
      return 0;
    }

    console.log(`🎯 Encontrados ${alertas.length} alertas configurados`);

    let alertsTriggered = 0;

    for (const alerta of alertas) {
      let shouldAlert = false;
      let metricValue = 0;

      switch (alerta.tipo_alerta) {
        case 'cpu':
          metricValue = metrics.cpu_usage;
          shouldAlert = metrics.cpu_usage > alerta.limite_valor;
          break;
        case 'memoria':
          metricValue = metrics.memory_usage;
          shouldAlert = metrics.memory_usage > alerta.limite_valor;
          break;
        case 'disco':
          metricValue = metrics.disk_usage;
          shouldAlert = metrics.disk_usage > alerta.limite_valor;
          break;
      }

      console.log(`📊 Verificando alerta ${alerta.tipo_alerta}: ${metricValue.toFixed(1)}% (limite: ${alerta.limite_valor}%)`);

      if (shouldAlert) {
        console.log(`🚨 ALERTA ACIONADO: ${alerta.tipo_alerta} - ${metricValue.toFixed(1)}% > ${alerta.limite_valor}%`);
        
        try {
          // Chamar função send-alerts
          console.log('📤 Enviando alerta via send-alerts...');
          
          const { data: alertResult, error: alertError } = await supabase.functions.invoke('send-alerts', {
            body: {
              alerta_id: alerta.id,
              servidor_id: servidor_id,
              tipo_alerta: alerta.tipo_alerta,
              valor_atual: metricValue,
              limite: alerta.limite_valor
            }
          });

          if (alertError) {
            console.error('❌ Erro ao enviar alerta via send-alerts:', alertError);
            
            // Registrar falha de notificação no banco
            await supabase
              .from('notificacoes')
              .insert({
                alerta_id: alerta.id,
                servidor_id: servidor_id,
                canal: 'sistema',
                destinatario: 'auto-monitor',
                mensagem: `Falha ao enviar alerta: ${alerta.tipo_alerta} - ${metricValue.toFixed(1)}% (limite: ${alerta.limite_valor}%)`,
                status: 'erro_envio',
                data_envio: new Date().toISOString()
              });
          } else {
            console.log(`✅ Alerta enviado com sucesso:`, alertResult);
            alertsTriggered++;
          }
        } catch (alertError) {
          console.error('❌ Erro crítico ao processar alerta:', alertError);
          
          // Registrar erro crítico
          await supabase
            .from('notificacoes')
            .insert({
              alerta_id: alerta.id,
              servidor_id: servidor_id,
              canal: 'sistema',
              destinatario: 'auto-monitor',
              mensagem: `Erro crítico no envio: ${alertError.message}`,
              status: 'erro_critico',
              data_envio: new Date().toISOString()
            });
        }
      } else {
        console.log(`✅ Alerta ${alerta.tipo_alerta} dentro do limite normal`);
      }
    }

    console.log(`📊 Resumo: ${alertsTriggered} de ${alertas.length} alertas foram acionados`);
    return alertsTriggered;
    
  } catch (error) {
    console.error('❌ Erro crítico ao verificar alertas:', error);
    return 0;
  }
}

serve(handler);
