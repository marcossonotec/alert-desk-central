
export interface AlertRequest {
  alerta_id?: string;
  servidor_id?: string;
  aplicacao_id?: string;
  tipo_alerta: string;
  valor_atual: number;
  limite: number;
  test_mode?: boolean;
  test_data?: {
    servidor_nome?: string;
    ip_servidor?: string;
  };
}

export interface AlertData {
  id: string;
  usuario_id: string;
  tipo_alerta: string;
  canal_notificacao: string[];
  ativo: boolean;
  limite_valor: number;
  servidor_id?: string;
  aplicacao_id?: string;
  servidores?: {
    nome: string;
    ip: string;
  };
  aplicacoes?: {
    nome: string;
  };
}

export interface UserProfile {
  id: string;
  nome_completo: string;
  email: string;
  email_notificacoes?: string;
  whatsapp?: string;
  empresa?: string;
}

export interface NotificationResult {
  success: boolean;
  message: string;
  notification_email: string;
  test_mode: boolean;
  channels_attempted: {
    email: { attempted: boolean; sent: boolean; error: string | null };
    whatsapp: { attempted: boolean; sent: boolean; error: string | null };
  };
  alert_details: {
    tipo_alerta: string;
    valor_atual: number;
    limite: number;
    servidor_nome: string;
  };
}
