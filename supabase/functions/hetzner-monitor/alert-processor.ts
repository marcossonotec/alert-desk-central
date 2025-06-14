
export async function processarAlertas(supabase: any, servidor: any, cpuUsage: number, memoriaUsage: number, discoUsage: number) {
  let alertasAcionados = 0;
  const { data: alertas, error: alertasError } = await supabase
    .from('alertas')
    .select('*')
    .eq('servidor_id', servidor.id)
    .eq('ativo', true);

  if (alertasError) {
    console.error('❌ Erro ao buscar alertas:', alertasError);
    return { alertasAcionados: 0, erro: true };
  }

  if (!alertas || alertas.length === 0) {
    console.log('ℹ️ Nenhum alerta configurado para este servidor');
    return { alertasAcionados: 0, erro: false };
  }

  for (const alerta of alertas) {
    let valorAtual = 0;
    let limite = alerta.limite_valor;

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
    
    if (valorAtual >= limite) {
      console.log(`🚨 ALERTA DISPARADO: ${alerta.tipo_alerta} - ${valorAtual}% >= ${limite}%`);
      
      try {
        const alertRequest = {
          alerta_id: alerta.id,
          servidor_id: servidor.id,
          tipo_alerta: alerta.tipo_alerta,
          valor_atual: valorAtual,
          limite: limite
        };

        console.log('📤 Enviando requisição para send-alerts:', alertRequest);

        const { data: sendResult, error: sendError } = await supabase.functions.invoke('send-alerts', {
          body: alertRequest,
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`
          }
        });

        if (sendError) {
          console.error('❌ Erro ao enviar alerta via send-alerts:', sendError);
          await registrarNotificacaoErro(supabase, alerta.id, servidor.id, servidor.profiles?.email || 'desconhecido', `Erro no envio automático de alerta ${alerta.tipo_alerta}: ${sendError.message}`, 'erro_sistema');
        } else {
          console.log('✅ Alerta enviado com sucesso:', sendResult);
          alertasAcionados++;
          await registrarNotificacaoSucesso(supabase, alerta.id, servidor.id, servidor.profiles?.email || 'desconhecido', `Alerta automático enviado: ${alerta.tipo_alerta} - ${valorAtual}% (limite: ${limite}%)`);
        }
      } catch (err) {
        console.error('❌ Erro crítico no envio do alerta:', err);
        await registrarNotificacaoErro(supabase, alerta.id, servidor.id, servidor.profiles?.email || 'desconhecido', `Erro crítico no processamento automático de alerta: ${err.message}`, 'erro_critico');
      }
    } else {
      console.log(`✅ Alerta ${alerta.tipo_alerta} dentro do limite normal`);
    }
  }
  return { alertasAcionados, erro: false };
}

async function registrarNotificacaoSucesso(supabase: any, alerta_id: string, servidor_id: string, destinatario: string, mensagem: string) {
  await supabase
    .from('notificacoes')
    .insert({
      alerta_id,
      servidor_id,
      canal: 'sistema',
      destinatario,
      mensagem,
      status: 'enviado',
      data_envio: new Date().toISOString()
    });
}

async function registrarNotificacaoErro(supabase: any, alerta_id: string, servidor_id: string, destinatario: string, mensagem: string, status: string) {
  await supabase
    .from('notificacoes')
    .insert({
      alerta_id,
      servidor_id,
      canal: 'sistema',
      destinatario,
      mensagem,
      status,
      data_envio: new Date().toISOString()
    });
}
