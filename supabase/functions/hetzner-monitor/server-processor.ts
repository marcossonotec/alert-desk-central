
import { coletarMetricasHetzner, gerarMetricasSimuladas } from "./metrics-collector.ts";
import { processarAlertas } from "./alert-processor.ts";

export async function processaServidor(supabase: any, servidor: any) {
  console.log(`🔄 Processando servidor: ${servidor.nome} (${servidor.id})`);
  console.log(`👤 Usuário: ${servidor.profiles.email} (${servidor.profiles.nome_completo})`);
  console.log(`🔧 Provedor: ${servidor.provedor}, Token ID: ${servidor.provider_token_id || 'não configurado'}`);

  let cpuUsage: number | undefined;
  let memoriaUsage: number | undefined;
  let discoUsage: number | undefined;
  let dataColetaReal = false;

  // Tenta coletar métricas reais
  const resultadoHetzner = await coletarMetricasHetzner(supabase, servidor);
  if (resultadoHetzner.real) {
    cpuUsage = resultadoHetzner.cpuUsage;
    memoriaUsage = resultadoHetzner.memoriaUsage;
    discoUsage = resultadoHetzner.discoUsage;
    dataColetaReal = true;
    console.log('✅ Métricas coletadas da Hetzner API:', { cpuUsage, memoriaUsage, discoUsage });
  }
  
  // Caso não tenha dado real, usa fallback simulado
  if (!dataColetaReal) {
    const fake = gerarMetricasSimuladas();
    cpuUsage = fake.cpuUsage;
    memoriaUsage = fake.memoriaUsage;
    discoUsage = fake.discoUsage;
    console.log('ℹ️ Usando métricas simuladas:', { cpuUsage, memoriaUsage, discoUsage });
  }

  // Monta dados de métricas
  const metricasData = {
    servidor_id: servidor.id,
    cpu_usage: parseFloat(cpuUsage!.toFixed(1)),
    memoria_usage: parseFloat(memoriaUsage!.toFixed(1)),
    disco_usage: parseFloat(discoUsage!.toFixed(1)),
    rede_in: Math.floor(Math.random() * 1000000),
    rede_out: Math.floor(Math.random() * 1000000),
    uptime: `${Math.floor(Math.random() * 100)}d`,
    timestamp: new Date().toISOString()
  };

  // Salva métricas no banco
  const { error: metricasError } = await supabase
    .from('metricas')
    .insert(metricasData);

  if (metricasError) {
    console.error(`❌ Erro ao salvar métricas para ${servidor.nome}:`, metricasError);
    return { sucesso: false, alertasAcionados: 0 };
  } else {
    console.log(`✅ Métricas salvas para servidor ${servidor.nome}`);
  }

  // Processa alertas para o servidor
  const { alertasAcionados, erro } = await processarAlertas(supabase, servidor, cpuUsage!, memoriaUsage!, discoUsage!);

  return { sucesso: !erro, alertasAcionados };
}
