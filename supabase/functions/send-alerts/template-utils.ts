
export function replaceTemplateVariables(
  template: string,
  variables: {
    tipo_alerta?: string;
    servidor_nome?: string;
    ip_servidor?: string;
    valor_atual?: number;
    limite?: number;
    data_hora?: string;
  }
): string {
  let result = template;
  
  // Mapear variáveis para substituição
  const replacements = {
    '{{tipo_alerta}}': variables.tipo_alerta || 'N/A',
    '{{servidor_nome}}': variables.servidor_nome || 'Servidor desconhecido',
    '{{ip_servidor}}': variables.ip_servidor || 'N/A',
    '{{valor_atual}}': variables.valor_atual?.toString() || 'N/A',
    '{{limite}}': variables.limite?.toString() || 'N/A',
    '{{data_hora}}': variables.data_hora || new Date().toLocaleString('pt-BR')
  };
  
  // Substituir todas as variáveis
  for (const [placeholder, value] of Object.entries(replacements)) {
    result = result.replace(new RegExp(placeholder, 'g'), value);
  }
  
  return result;
}

export function getTipoAlertaName(tipo: string): string {
  const tipos = {
    'cpu_usage': 'Alto uso de CPU',
    'memoria_usage': 'Alto uso de memória',
    'disco_usage': 'Alto uso de disco',
    'response_time': 'Tempo de resposta alto',
    'status': 'Servidor/Aplicação offline',
    'cpu': 'Alto uso de CPU',
    'memoria': 'Alto uso de memória',
    'disco': 'Alto uso de disco'
  };
  return tipos[tipo] || tipo;
}
