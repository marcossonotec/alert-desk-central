
export async function fetchAlertData(supabase: any, alerta_id: string, servidor_id?: string, aplicacao_id?: string) {
  console.log('📋 Buscando configurações básicas do alerta...');
  const { data: alertaBase, error: alertaError } = await supabase
    .from('alertas')
    .select('*')
    .eq('id', alerta_id)
    .single();

  if (alertaError || !alertaBase) {
    const errorMsg = `Alerta não encontrado: ${alerta_id}`;
    console.error('❌', errorMsg, alertaError);
    throw new Error(errorMsg);
  }

  console.log('✅ Alerta base encontrado:', {
    id: alertaBase.id,
    tipo: alertaBase.tipo_alerta,
    usuario_id: alertaBase.usuario_id,
    limite: alertaBase.limite_valor,
    canais: alertaBase.canal_notificacao
  });

  // Verificar se o alerta está ativo
  if (!alertaBase.ativo) {
    const errorMsg = 'Alerta está inativo';
    console.error('⚠️', errorMsg);
    throw new Error(errorMsg);
  }

  // Buscar dados do servidor OU aplicação condicionalmente
  let servidorData = null;
  let aplicacaoData = null;

  if (servidor_id) {
    console.log('🖥️ Buscando dados do servidor...');
    const { data: servidor, error: servidorError } = await supabase
      .from('servidores')
      .select('nome, ip')
      .eq('id', servidor_id)
      .single();

    if (servidorError) {
      console.log('⚠️ Erro ao buscar servidor:', servidorError);
    } else {
      servidorData = servidor;
      console.log('✅ Servidor encontrado:', servidor.nome);
    }
  }

  if (aplicacao_id) {
    console.log('📱 Buscando dados da aplicação...');
    const { data: aplicacao, error: aplicacaoError } = await supabase
      .from('aplicacoes')
      .select('nome')
      .eq('id', aplicacao_id)
      .single();

    if (aplicacaoError) {
      console.log('⚠️ Erro ao buscar aplicação:', aplicacaoError);
    } else {
      aplicacaoData = aplicacao;
      console.log('✅ Aplicação encontrada:', aplicacao.nome);
    }
  }

  // Construir objeto alerta completo
  const alertaCompleto = {
    ...alertaBase,
    servidores: servidorData,
    aplicacoes: aplicacaoData
  };

  console.log('🎯 Alerta completo preparado para envio:', {
    id: alertaCompleto.id,
    servidor: servidorData?.nome || 'N/A',
    aplicacao: aplicacaoData?.nome || 'N/A'
  });

  return alertaCompleto;
}
