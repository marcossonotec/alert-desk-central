
import { AlertRequest, UserProfile, AlertData } from "./types.ts";

export async function handleTestMode(supabase: any, requestBody: AlertRequest): Promise<{ alerta: AlertData; profile: UserProfile }> {
  console.log('=== INICIANDO MODO DE TESTE ===');
  
  // Para modo de teste, buscar o primeiro usuário admin ou usar dados padrão
  const { data: users } = await supabase
    .from('profiles')
    .select('*')
    .eq('plano_ativo', 'admin')
    .limit(1);

  let profile: UserProfile;
  if (users && users.length > 0) {
    profile = users[0];
  } else {
    // Fallback: buscar qualquer usuário para teste
    const { data: fallbackUsers } = await supabase
      .from('profiles')
      .select('*')
      .limit(1);
    
    if (fallbackUsers && fallbackUsers.length > 0) {
      profile = fallbackUsers[0];
    } else {
      throw new Error('Nenhum usuário encontrado para teste');
    }
  }

  console.log('Usuário encontrado para teste:', profile.email);

  // Criar objeto de alerta fictício para teste
  const alertaFicticio: AlertData = {
    id: 'test-alert-' + Date.now(),
    usuario_id: profile.id,
    tipo_alerta: requestBody.tipo_alerta,
    canal_notificacao: ['email', 'whatsapp'],
    ativo: true,
    servidores: {
      nome: requestBody.test_data?.servidor_nome || 'Servidor-Teste',
      ip: requestBody.test_data?.ip_servidor || '192.168.1.100'
    },
    aplicacoes: null
  };

  console.log('Dados do teste:', { 
    valor_atual: requestBody.valor_atual, 
    limite: requestBody.limite, 
    tipo_alerta: requestBody.tipo_alerta 
  });

  return { alerta: alertaFicticio, profile };
}
