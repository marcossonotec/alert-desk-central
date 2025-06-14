export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      alertas: {
        Row: {
          ativo: boolean | null
          canal_notificacao: string[] | null
          data_criacao: string | null
          evolution_instance_id: string | null
          id: string
          limite_valor: number
          servidor_id: string | null
          tipo_alerta: string
          usuario_id: string
        }
        Insert: {
          ativo?: boolean | null
          canal_notificacao?: string[] | null
          data_criacao?: string | null
          evolution_instance_id?: string | null
          id?: string
          limite_valor: number
          servidor_id?: string | null
          tipo_alerta: string
          usuario_id: string
        }
        Update: {
          ativo?: boolean | null
          canal_notificacao?: string[] | null
          data_criacao?: string | null
          evolution_instance_id?: string | null
          id?: string
          limite_valor?: number
          servidor_id?: string | null
          tipo_alerta?: string
          usuario_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "alertas_evolution_instance_id_fkey"
            columns: ["evolution_instance_id"]
            isOneToOne: false
            referencedRelation: "evolution_instances"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "alertas_servidor_id_fkey"
            columns: ["servidor_id"]
            isOneToOne: false
            referencedRelation: "servidores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "alertas_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      aplicacao_metricas: {
        Row: {
          aplicacao_id: string
          id: string
          timestamp: string
          tipo_metrica: string
          valor: Json
        }
        Insert: {
          aplicacao_id: string
          id?: string
          timestamp?: string
          tipo_metrica: string
          valor: Json
        }
        Update: {
          aplicacao_id?: string
          id?: string
          timestamp?: string
          tipo_metrica?: string
          valor?: Json
        }
        Relationships: [
          {
            foreignKeyName: "aplicacao_metricas_aplicacao_id_fkey"
            columns: ["aplicacao_id"]
            isOneToOne: false
            referencedRelation: "aplicacoes"
            referencedColumns: ["id"]
          },
        ]
      }
      aplicacoes: {
        Row: {
          caminho: string | null
          configuracao: Json
          data_atualizacao: string
          data_criacao: string
          descricao: string | null
          id: string
          nome: string
          porta: number | null
          servidor_id: string
          status: string
          tipo_aplicacao_id: string
          url_monitoramento: string | null
          usuario_id: string
        }
        Insert: {
          caminho?: string | null
          configuracao?: Json
          data_atualizacao?: string
          data_criacao?: string
          descricao?: string | null
          id?: string
          nome: string
          porta?: number | null
          servidor_id: string
          status?: string
          tipo_aplicacao_id: string
          url_monitoramento?: string | null
          usuario_id: string
        }
        Update: {
          caminho?: string | null
          configuracao?: Json
          data_atualizacao?: string
          data_criacao?: string
          descricao?: string | null
          id?: string
          nome?: string
          porta?: number | null
          servidor_id?: string
          status?: string
          tipo_aplicacao_id?: string
          url_monitoramento?: string | null
          usuario_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "aplicacoes_servidor_id_fkey"
            columns: ["servidor_id"]
            isOneToOne: false
            referencedRelation: "servidores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "aplicacoes_tipo_aplicacao_id_fkey"
            columns: ["tipo_aplicacao_id"]
            isOneToOne: false
            referencedRelation: "tipos_aplicacao"
            referencedColumns: ["id"]
          },
        ]
      }
      assinatura_aplicacoes: {
        Row: {
          aplicacao_id: string
          created_at: string
          data_fim: string | null
          data_inicio: string
          id: string
          preco_mensal: number
          status: string
          tipo_aplicacao_id: string
          usuario_id: string
        }
        Insert: {
          aplicacao_id: string
          created_at?: string
          data_fim?: string | null
          data_inicio?: string
          id?: string
          preco_mensal: number
          status?: string
          tipo_aplicacao_id: string
          usuario_id: string
        }
        Update: {
          aplicacao_id?: string
          created_at?: string
          data_fim?: string | null
          data_inicio?: string
          id?: string
          preco_mensal?: number
          status?: string
          tipo_aplicacao_id?: string
          usuario_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "assinatura_aplicacoes_aplicacao_id_fkey"
            columns: ["aplicacao_id"]
            isOneToOne: false
            referencedRelation: "aplicacoes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assinatura_aplicacoes_tipo_aplicacao_id_fkey"
            columns: ["tipo_aplicacao_id"]
            isOneToOne: false
            referencedRelation: "tipos_aplicacao"
            referencedColumns: ["id"]
          },
        ]
      }
      assinaturas: {
        Row: {
          data_criacao: string | null
          data_fim: string | null
          data_inicio: string | null
          id: string
          plano: string
          plano_id: string | null
          preco_mensal: number
          provedor_pagamento: string
          status: string | null
          subscription_id: string | null
          usuario_id: string
        }
        Insert: {
          data_criacao?: string | null
          data_fim?: string | null
          data_inicio?: string | null
          id?: string
          plano: string
          plano_id?: string | null
          preco_mensal: number
          provedor_pagamento: string
          status?: string | null
          subscription_id?: string | null
          usuario_id: string
        }
        Update: {
          data_criacao?: string | null
          data_fim?: string | null
          data_inicio?: string | null
          id?: string
          plano?: string
          plano_id?: string | null
          preco_mensal?: number
          provedor_pagamento?: string
          status?: string | null
          subscription_id?: string | null
          usuario_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "assinaturas_plano_id_fkey"
            columns: ["plano_id"]
            isOneToOne: false
            referencedRelation: "planos_assinatura"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assinaturas_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      email_templates: {
        Row: {
          created_at: string
          html_content: string
          id: string
          is_active: boolean
          subject: string
          template_type: string
          text_content: string | null
          updated_at: string
          usuario_id: string
          variables: Json | null
        }
        Insert: {
          created_at?: string
          html_content: string
          id?: string
          is_active?: boolean
          subject: string
          template_type: string
          text_content?: string | null
          updated_at?: string
          usuario_id: string
          variables?: Json | null
        }
        Update: {
          created_at?: string
          html_content?: string
          id?: string
          is_active?: boolean
          subject?: string
          template_type?: string
          text_content?: string | null
          updated_at?: string
          usuario_id?: string
          variables?: Json | null
        }
        Relationships: []
      }
      evolution_instances: {
        Row: {
          api_key: string
          api_url: string
          created_at: string | null
          id: string
          instance_name: string
          message_template: string | null
          qr_code: string | null
          status: string | null
          updated_at: string | null
          usuario_id: string
          webhook_url: string | null
        }
        Insert: {
          api_key: string
          api_url: string
          created_at?: string | null
          id?: string
          instance_name: string
          message_template?: string | null
          qr_code?: string | null
          status?: string | null
          updated_at?: string | null
          usuario_id: string
          webhook_url?: string | null
        }
        Update: {
          api_key?: string
          api_url?: string
          created_at?: string | null
          id?: string
          instance_name?: string
          message_template?: string | null
          qr_code?: string | null
          status?: string | null
          updated_at?: string | null
          usuario_id?: string
          webhook_url?: string | null
        }
        Relationships: []
      }
      metricas: {
        Row: {
          cpu_usage: number | null
          disco_usage: number | null
          id: string
          memoria_usage: number | null
          rede_in: number | null
          rede_out: number | null
          servidor_id: string
          timestamp: string | null
          uptime: string | null
        }
        Insert: {
          cpu_usage?: number | null
          disco_usage?: number | null
          id?: string
          memoria_usage?: number | null
          rede_in?: number | null
          rede_out?: number | null
          servidor_id: string
          timestamp?: string | null
          uptime?: string | null
        }
        Update: {
          cpu_usage?: number | null
          disco_usage?: number | null
          id?: string
          memoria_usage?: number | null
          rede_in?: number | null
          rede_out?: number | null
          servidor_id?: string
          timestamp?: string | null
          uptime?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "metricas_servidor_id_fkey"
            columns: ["servidor_id"]
            isOneToOne: false
            referencedRelation: "servidores"
            referencedColumns: ["id"]
          },
        ]
      }
      notificacoes: {
        Row: {
          alerta_id: string
          canal: string
          data_envio: string | null
          destinatario: string
          id: string
          mensagem: string
          servidor_id: string
          status: string | null
        }
        Insert: {
          alerta_id: string
          canal: string
          data_envio?: string | null
          destinatario: string
          id?: string
          mensagem: string
          servidor_id: string
          status?: string | null
        }
        Update: {
          alerta_id?: string
          canal?: string
          data_envio?: string | null
          destinatario?: string
          id?: string
          mensagem?: string
          servidor_id?: string
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "notificacoes_alerta_id_fkey"
            columns: ["alerta_id"]
            isOneToOne: false
            referencedRelation: "alertas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notificacoes_servidor_id_fkey"
            columns: ["servidor_id"]
            isOneToOne: false
            referencedRelation: "servidores"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_settings: {
        Row: {
          api_key: string | null
          created_at: string
          email_provider: string
          from_email: string
          from_name: string
          id: string
          is_active: boolean
          smtp_host: string | null
          smtp_password: string | null
          smtp_port: number | null
          smtp_secure: boolean | null
          smtp_username: string | null
          updated_at: string
          usuario_id: string
        }
        Insert: {
          api_key?: string | null
          created_at?: string
          email_provider?: string
          from_email: string
          from_name?: string
          id?: string
          is_active?: boolean
          smtp_host?: string | null
          smtp_password?: string | null
          smtp_port?: number | null
          smtp_secure?: boolean | null
          smtp_username?: string | null
          updated_at?: string
          usuario_id: string
        }
        Update: {
          api_key?: string | null
          created_at?: string
          email_provider?: string
          from_email?: string
          from_name?: string
          id?: string
          is_active?: boolean
          smtp_host?: string | null
          smtp_password?: string | null
          smtp_port?: number | null
          smtp_secure?: boolean | null
          smtp_username?: string | null
          updated_at?: string
          usuario_id?: string
        }
        Relationships: []
      }
      payment_settings: {
        Row: {
          created_at: string
          gateway_type: string
          id: string
          is_active: boolean
          mercadopago_access_token: string | null
          mercadopago_public_key: string | null
          mercadopago_webhook_url: string | null
          mode: string
          stripe_publishable_key: string | null
          stripe_secret_key: string | null
          stripe_webhook_secret: string | null
          updated_at: string
          usuario_id: string
        }
        Insert: {
          created_at?: string
          gateway_type: string
          id?: string
          is_active?: boolean
          mercadopago_access_token?: string | null
          mercadopago_public_key?: string | null
          mercadopago_webhook_url?: string | null
          mode?: string
          stripe_publishable_key?: string | null
          stripe_secret_key?: string | null
          stripe_webhook_secret?: string | null
          updated_at?: string
          usuario_id: string
        }
        Update: {
          created_at?: string
          gateway_type?: string
          id?: string
          is_active?: boolean
          mercadopago_access_token?: string | null
          mercadopago_public_key?: string | null
          mercadopago_webhook_url?: string | null
          mode?: string
          stripe_publishable_key?: string | null
          stripe_secret_key?: string | null
          stripe_webhook_secret?: string | null
          updated_at?: string
          usuario_id?: string
        }
        Relationships: []
      }
      planos_assinatura: {
        Row: {
          ativo: boolean | null
          created_at: string | null
          descricao: string | null
          id: string
          max_servidores: number
          nome: string
          preco_mensal: number
          recursos: Json
        }
        Insert: {
          ativo?: boolean | null
          created_at?: string | null
          descricao?: string | null
          id?: string
          max_servidores: number
          nome: string
          preco_mensal: number
          recursos?: Json
        }
        Update: {
          ativo?: boolean | null
          created_at?: string | null
          descricao?: string | null
          id?: string
          max_servidores?: number
          nome?: string
          preco_mensal?: number
          recursos?: Json
        }
        Relationships: []
      }
      profiles: {
        Row: {
          data_atualizacao: string | null
          data_criacao: string | null
          email: string
          email_notificacoes: string | null
          empresa: string | null
          id: string
          nome_completo: string | null
          plano_ativo: string | null
          telefone: string | null
          tema_preferido: string | null
          whatsapp: string | null
        }
        Insert: {
          data_atualizacao?: string | null
          data_criacao?: string | null
          email: string
          email_notificacoes?: string | null
          empresa?: string | null
          id: string
          nome_completo?: string | null
          plano_ativo?: string | null
          telefone?: string | null
          tema_preferido?: string | null
          whatsapp?: string | null
        }
        Update: {
          data_atualizacao?: string | null
          data_criacao?: string | null
          email?: string
          email_notificacoes?: string | null
          empresa?: string | null
          id?: string
          nome_completo?: string | null
          plano_ativo?: string | null
          telefone?: string | null
          tema_preferido?: string | null
          whatsapp?: string | null
        }
        Relationships: []
      }
      provider_tokens: {
        Row: {
          created_at: string
          id: string
          nickname: string | null
          provider: string
          token: string
          usuario_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          nickname?: string | null
          provider: string
          token: string
          usuario_id: string
        }
        Update: {
          created_at?: string
          id?: string
          nickname?: string | null
          provider?: string
          token?: string
          usuario_id?: string
        }
        Relationships: []
      }
      servidores: {
        Row: {
          api_key: string
          data_atualizacao: string | null
          data_criacao: string | null
          id: string
          ip: string
          nome: string
          provedor: string | null
          provider_token_id: string | null
          status: string | null
          ultima_verificacao: string | null
          usuario_id: string
          webhook_url: string | null
        }
        Insert: {
          api_key?: string
          data_atualizacao?: string | null
          data_criacao?: string | null
          id?: string
          ip: string
          nome: string
          provedor?: string | null
          provider_token_id?: string | null
          status?: string | null
          ultima_verificacao?: string | null
          usuario_id: string
          webhook_url?: string | null
        }
        Update: {
          api_key?: string
          data_atualizacao?: string | null
          data_criacao?: string | null
          id?: string
          ip?: string
          nome?: string
          provedor?: string | null
          provider_token_id?: string | null
          status?: string | null
          ultima_verificacao?: string | null
          usuario_id?: string
          webhook_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_servidores_provider_token"
            columns: ["provider_token_id"]
            isOneToOne: false
            referencedRelation: "provider_tokens"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "servidores_provider_token_id_fkey"
            columns: ["provider_token_id"]
            isOneToOne: false
            referencedRelation: "provider_tokens"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "servidores_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      tipos_aplicacao: {
        Row: {
          ativo: boolean
          created_at: string
          descricao: string | null
          id: string
          nome: string
          preco_mensal: number
          recursos: Json
        }
        Insert: {
          ativo?: boolean
          created_at?: string
          descricao?: string | null
          id?: string
          nome: string
          preco_mensal: number
          recursos?: Json
        }
        Update: {
          ativo?: boolean
          created_at?: string
          descricao?: string | null
          id?: string
          nome?: string
          preco_mensal?: number
          recursos?: Json
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
