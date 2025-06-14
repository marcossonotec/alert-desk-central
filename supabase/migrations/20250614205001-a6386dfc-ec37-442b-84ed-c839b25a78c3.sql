
-- Adicionar RLS à tabela provider_tokens (se ainda não estiver ativo)
ALTER TABLE public.provider_tokens ENABLE ROW LEVEL SECURITY;

-- Remover políticas existentes se houver
DROP POLICY IF EXISTS "Usuários podem visualizar seus próprios tokens" ON public.provider_tokens;
DROP POLICY IF EXISTS "Usuários podem inserir seus próprios tokens" ON public.provider_tokens;
DROP POLICY IF EXISTS "Usuários podem atualizar seus próprios tokens" ON public.provider_tokens;
DROP POLICY IF EXISTS "Usuários podem deletar seus próprios tokens" ON public.provider_tokens;

-- Política para usuários verem apenas seus próprios tokens
CREATE POLICY "Usuários podem visualizar seus próprios tokens"
  ON public.provider_tokens
  FOR SELECT
  USING (auth.uid() = usuario_id);

-- Política para usuários inserirem apenas seus próprios tokens
CREATE POLICY "Usuários podem inserir seus próprios tokens"
  ON public.provider_tokens
  FOR INSERT
  WITH CHECK (auth.uid() = usuario_id);

-- Política para usuários atualizarem apenas seus próprios tokens
CREATE POLICY "Usuários podem atualizar seus próprios tokens"
  ON public.provider_tokens
  FOR UPDATE
  USING (auth.uid() = usuario_id);

-- Política para usuários deletarem apenas seus próprios tokens
CREATE POLICY "Usuários podem deletar seus próprios tokens"
  ON public.provider_tokens
  FOR DELETE
  USING (auth.uid() = usuario_id);

-- Remover constraint se já existir
ALTER TABLE public.servidores DROP CONSTRAINT IF EXISTS fk_servidores_provider_token;

-- Adicionar foreign key entre servidores e provider_tokens
ALTER TABLE public.servidores
  ADD CONSTRAINT fk_servidores_provider_token
  FOREIGN KEY (provider_token_id) REFERENCES public.provider_tokens(id)
  ON DELETE SET NULL;

-- Remover constraint se já existir
ALTER TABLE public.provider_tokens DROP CONSTRAINT IF EXISTS valid_provider;

-- Adicionar constraint para provedores válidos
ALTER TABLE public.provider_tokens
  ADD CONSTRAINT valid_provider
  CHECK (provider IN ('hetzner', 'aws', 'digitalocean', 'vultr', 'linode'));
