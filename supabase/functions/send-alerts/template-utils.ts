
export function replaceTemplateVariables(
  template: string,
  variables: {
    tipo_alerta?: string;
    servidor_nome?: string;
    ip_servidor?: string;
    valor_atual?: number;
    limite?: number;
    data_hora?: string;
    // Novas variáveis do usuário
    nome?: string;
    empresa?: string;
    telefone?: string;
    whatsapp?: string;
    email?: string;
  }
): string {
  let result = template;
  
  // Mapear variáveis para substituição
  const replacements = {
    // Variáveis técnicas do alerta
    '{{tipo_alerta}}': variables.tipo_alerta || 'N/A',
    '{{servidor_nome}}': variables.servidor_nome || 'Servidor desconhecido',
    '{{ip_servidor}}': variables.ip_servidor || 'N/A',
    '{{valor_atual}}': variables.valor_atual?.toString() || 'N/A',
    '{{limite}}': variables.limite?.toString() || 'N/A',
    '{{data_hora}}': variables.data_hora || new Date().toLocaleString('pt-BR'),
    
    // Variáveis do usuário/perfil
    '{{nome}}': variables.nome || 'Usuário',
    '{{empresa}}': variables.empresa || 'N/A',
    '{{telefone}}': variables.telefone || 'N/A',
    '{{whatsapp}}': variables.whatsapp || 'N/A',
    '{{email}}': variables.email || 'N/A'
  };
  
  // Substituir todas as variáveis
  for (const [placeholder, value] of Object.entries(replacements)) {
    result = result.replace(new RegExp(placeholder.replace(/[{}]/g, '\\$&'), 'g'), value);
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
