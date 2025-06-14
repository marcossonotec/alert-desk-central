
-- Cria tabela para tokens de provedores cloud (Hetzner, AWS, etc)
CREATE TABLE public.provider_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id UUID NOT NULL,
  provider TEXT NOT NULL, -- Ex: 'hetzner', 'aws', 'digitalocean'
  token TEXT NOT NULL,
  nickname TEXT,          -- Apelido visível do token
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Habilita Row Level Security (RLS)
ALTER TABLE public.provider_tokens ENABLE ROW LEVEL SECURITY;

-- Usuário pode ver apenas tokens próprios
CREATE POLICY "Usuário pode visualizar seus próprios tokens"
  ON public.provider_tokens
  FOR SELECT
  USING (auth.uid() = usuario_id);

-- Usuário insere apenas tokens próprios
CREATE POLICY "Usuário pode inserir seus próprios tokens"
  ON public.provider_tokens
  FOR INSERT
  WITH CHECK (auth.uid() = usuario_id);

-- Usuário DELETA apenas tokens próprios
CREATE POLICY "Usuário pode deletar seus próprios tokens"
  ON public.provider_tokens
  FOR DELETE
  USING (auth.uid() = usuario_id);

-- Usuário pode atualizar apenas tokens próprios
CREATE POLICY "Usuário pode atualizar seus próprios tokens"
  ON public.provider_tokens
  FOR UPDATE
  USING (auth.uid() = usuario_id);

