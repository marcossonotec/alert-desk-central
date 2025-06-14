
-- Adiciona a coluna provider_token_id referenciando o id da provider_tokens (nullable)
ALTER TABLE public.servidores
  ADD COLUMN provider_token_id uuid NULL REFERENCES public.provider_tokens(id);

-- Remove coluna api_key (se não houver dados importantes)
ALTER TABLE public.servidores
  DROP COLUMN IF EXISTS api_key;

-- Opcional: Comente se quiser manter a coluna api_key para uso futuro, mas o plano é migrar totalmente para provider_token_id.
