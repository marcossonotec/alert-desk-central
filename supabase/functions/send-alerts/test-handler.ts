
import { AlertRequest, AlertData, UserProfile } from "./types.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

export async function handleTestMode(
  supabase: any, 
  requestBody: AlertRequest,
  authUserId?: string
): Promise<{ alerta: AlertData; profile: UserProfile }> {
  console.log('=== INICIANDO MODO DE TESTE ===');
  console.log('Auth User ID:', authUserId);
  
  let profile: UserProfile;
  
  if (authUserId) {
    // Para modo de teste, buscar o usuário autenticado atual
    const { data: currentUser, error: userError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', authUserId)
      .single();

    if (userError || !currentUser) {
      console.error('Erro ao buscar usuário atual:', userError);
      throw new Error('Usuário atual não encontrado para teste');
    }
    
    profile = currentUser;
    console.log('Usuário autenticado encontrado para teste:', profile.email);
  } else {
    // Fallback: buscar o primeiro usuário admin se não houver autenticação
    const { data: users } = await supabase
      .from('profiles')
      .select('*')
      .eq('plano_ativo', 'admin')
      .limit(1);

    if (users && users.length > 0) {
      profile = users[0];
    } else {
      // Último fallback: buscar qualquer usuário para teste
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
    console.log('Usuário fallback encontrado para teste:', profile.email);
  }

  // Criar objeto de alerta fictício para teste
  const alertaFicticio: AlertData = {
    id: 'test-alert-' + Date.now(),
    usuario_id: profile.id,
    tipo_alerta: requestBody.tipo_alerta,
    canal_notificacao: ['email', 'whatsapp'],
    ativo: true,
    limite_valor: requestBody.limite,
    servidores: {
      nome: requestBody.test_data?.servidor_nome || 'Servidor-Teste',
      ip: requestBody.test_data?.ip_servidor || '192.168.1.100'
    },
    aplicacoes: null
  };

  console.log('Dados do teste:', { 
    valor_atual: requestBody.valor_atual, 
    limite: requestBody.limite, 
    tipo_alerta: requestBody.tipo_alerta,
    usuario_id: profile.id,
    email_principal: profile.email,
    email_notificacoes: profile.email_notificacoes,
    whatsapp: profile.whatsapp
  });

  return { alerta: alertaFicticio, profile };
}
