
-- Corrigir a coluna webhook_url para ser nullable em servidores
ALTER TABLE public.servidores 
ALTER COLUMN webhook_url DROP NOT NULL;
