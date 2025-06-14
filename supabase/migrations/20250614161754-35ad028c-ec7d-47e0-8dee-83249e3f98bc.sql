
-- Adiciona coluna api_key na tabela servidores
ALTER TABLE public.servidores
  ADD COLUMN api_key TEXT UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(24), 'hex');

-- Garante que todos os registros existentes tenham api_key
UPDATE public.servidores
SET api_key = encode(gen_random_bytes(24), 'hex')
WHERE api_key IS NULL;
