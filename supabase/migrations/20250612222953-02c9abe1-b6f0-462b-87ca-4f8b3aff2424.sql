
-- Primeiro, adicionar o campo message_template à tabela evolution_instances (esta parte deve funcionar)
ALTER TABLE public.evolution_instances 
ADD COLUMN IF NOT EXISTS message_template TEXT;

-- Remover duplicados da tabela payment_settings, mantendo apenas o mais recente
DELETE FROM public.payment_settings a USING public.payment_settings b 
WHERE a.id < b.id AND a.usuario_id = b.usuario_id;

-- Remover duplicados da tabela notification_settings, mantendo apenas o mais recente
DELETE FROM public.notification_settings a USING public.notification_settings b 
WHERE a.id < b.id AND a.usuario_id = b.usuario_id;

-- Agora adicionar as constraints únicas
ALTER TABLE public.payment_settings 
ADD CONSTRAINT payment_settings_usuario_id_key UNIQUE (usuario_id);

ALTER TABLE public.notification_settings 
ADD CONSTRAINT notification_settings_usuario_id_key UNIQUE (usuario_id);
