
-- Adicionar colunas para WhatsApp e melhorar a estrutura de profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS whatsapp text,
ADD COLUMN IF NOT EXISTS tema_preferido text DEFAULT 'light';

-- Criar tabela para planos de assinatura
CREATE TABLE IF NOT EXISTS public.planos_assinatura (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  preco_mensal numeric NOT NULL,
  descricao text,
  max_servidores integer NOT NULL,
  recursos jsonb NOT NULL DEFAULT '{}',
  ativo boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Inserir os planos padrão
INSERT INTO public.planos_assinatura (nome, preco_mensal, descricao, max_servidores, recursos) 
VALUES 
  ('free', 0, 'Plano gratuito por 7 dias', 1, '{"metricas_basicas": true, "alertas_email": true, "duracao_dias": 7}'),
  ('profissional', 69, 'Plano profissional', 3, '{"metricas_avancadas": true, "alertas_whatsapp": true, "suporte_prioritario": true}'),
  ('empresarial', 247, 'Plano empresarial', 999, '{"metricas_avancadas": true, "alertas_whatsapp": true, "suporte_prioritario": true, "recursos_ilimitados": true}')
ON CONFLICT DO NOTHING;

-- Atualizar tabela de assinaturas para referenciar planos
ALTER TABLE public.assinaturas 
ADD COLUMN IF NOT EXISTS plano_id uuid REFERENCES public.planos_assinatura(id);

-- Habilitar RLS para planos
ALTER TABLE public.planos_assinatura ENABLE ROW LEVEL SECURITY;

-- Política para permitir leitura dos planos por todos os usuários autenticados
CREATE POLICY "Usuarios podem ver planos" ON public.planos_assinatura
FOR SELECT TO authenticated
USING (true);
