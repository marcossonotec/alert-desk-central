
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

export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};
