-- Fase 1: Implementar Sistema Admin

-- Criar enum para roles
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

-- Criar tabela user_roles
CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE (user_id, role)
);

-- Habilitar RLS
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Criar função security definer para verificar se usuário é admin
CREATE OR REPLACE FUNCTION public.is_admin(user_id_param UUID DEFAULT auth.uid())
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = user_id_param
      AND role = 'admin'
  )
$$;

-- Política para user_roles - admins podem gerenciar tudo, usuários podem ver apenas seus próprios roles
CREATE POLICY "Admins can manage all user roles" 
ON public.user_roles 
FOR ALL
USING (public.is_admin());

CREATE POLICY "Users can view their own roles" 
ON public.user_roles 
FOR SELECT
USING (auth.uid() = user_id);

-- Atualizar políticas existentes para dar acesso total aos admins

-- Política para profiles
CREATE POLICY "Admins can manage all profiles" 
ON public.profiles 
FOR ALL
USING (public.is_admin());

-- Política para servidores  
CREATE POLICY "Admins can manage all servers" 
ON public.servidores 
FOR ALL
USING (public.is_admin());

-- Política para evolution_instances
CREATE POLICY "Admins can manage all evolution instances" 
ON public.evolution_instances 
FOR ALL
USING (public.is_admin());

-- Política para alertas
CREATE POLICY "Admins can manage all alerts" 
ON public.alertas 
FOR ALL
USING (public.is_admin());

-- Política para assinaturas
CREATE POLICY "Admins can manage all subscriptions" 
ON public.assinaturas 
FOR ALL
USING (public.is_admin());

-- Política para provider_tokens
CREATE POLICY "Admins can manage all provider tokens" 
ON public.provider_tokens 
FOR ALL
USING (public.is_admin());

-- Fase 2: Corrigir Planos WhatsApp - Atualizar recursos dos planos
UPDATE public.planos_assinatura 
SET recursos = jsonb_set(
    recursos, 
    '{max_whatsapp_instances}', 
    '1'::jsonb
)
WHERE nome = 'free';

UPDATE public.planos_assinatura 
SET recursos = jsonb_set(
    recursos, 
    '{max_whatsapp_instances}', 
    '3'::jsonb
)
WHERE nome = 'profissional';

UPDATE public.planos_assinatura 
SET recursos = jsonb_set(
    recursos, 
    '{max_whatsapp_instances}', 
    '-1'::jsonb
)
WHERE nome = 'empresarial';

-- Inserir role admin para o primeiro usuário (será o usuário atual)
-- Assumindo que existe pelo menos um perfil na tabela profiles
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'::app_role
FROM public.profiles 
WHERE email ILIKE '%admin%' OR email ILIKE '%suporte%'
ON CONFLICT (user_id, role) DO NOTHING;

-- Se não encontrou por email, inserir para o primeiro usuário da tabela
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'::app_role
FROM public.profiles 
ORDER BY data_criacao ASC
LIMIT 1
ON CONFLICT (user_id, role) DO NOTHING;