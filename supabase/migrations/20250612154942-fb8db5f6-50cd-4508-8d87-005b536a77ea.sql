
-- Adicionar coluna email_notificacoes na tabela profiles
ALTER TABLE public.profiles 
ADD COLUMN email_notificacoes TEXT;

-- Adicionar comentário para documentar o campo
COMMENT ON COLUMN public.profiles.email_notificacoes IS 'Email específico para receber notificações e alertas. Se nulo, usa o email principal.';
