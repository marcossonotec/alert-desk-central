
-- Tabela para configurações de pagamento
CREATE TABLE public.payment_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  gateway_type TEXT NOT NULL CHECK (gateway_type IN ('mercadopago', 'stripe')),
  mode TEXT NOT NULL DEFAULT 'test' CHECK (mode IN ('test', 'production')),
  mercadopago_access_token TEXT,
  mercadopago_public_key TEXT,
  mercadopago_webhook_url TEXT,
  stripe_secret_key TEXT,
  stripe_publishable_key TEXT,
  stripe_webhook_secret TEXT,
  is_active BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tabela para configurações de notificações/email
CREATE TABLE public.notification_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  email_provider TEXT NOT NULL DEFAULT 'smtp' CHECK (email_provider IN ('smtp', 'sendgrid', 'google', 'amazon_ses', 'resend')),
  smtp_host TEXT,
  smtp_port INTEGER DEFAULT 587,
  smtp_username TEXT,
  smtp_password TEXT,
  smtp_secure BOOLEAN DEFAULT true,
  api_key TEXT, -- Para provedores como SendGrid
  from_email TEXT NOT NULL,
  from_name TEXT NOT NULL DEFAULT 'DeskTools',
  is_active BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tabela para templates de email
CREATE TABLE public.email_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  template_type TEXT NOT NULL CHECK (template_type IN ('welcome', 'alert', 'invoice', 'report', 'custom')),
  subject TEXT NOT NULL,
  html_content TEXT NOT NULL,
  text_content TEXT,
  variables JSONB DEFAULT '{}',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS para payment_settings
ALTER TABLE public.payment_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their payment settings" ON public.payment_settings
  FOR ALL USING (auth.uid() = usuario_id);

-- RLS para notification_settings
ALTER TABLE public.notification_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their notification settings" ON public.notification_settings
  FOR ALL USING (auth.uid() = usuario_id);

-- RLS para email_templates
ALTER TABLE public.email_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their email templates" ON public.email_templates
  FOR ALL USING (auth.uid() = usuario_id);

-- Índices para melhor performance
CREATE INDEX idx_payment_settings_usuario_id ON public.payment_settings(usuario_id);
CREATE INDEX idx_notification_settings_usuario_id ON public.notification_settings(usuario_id);
CREATE INDEX idx_email_templates_usuario_id ON public.email_templates(usuario_id);
CREATE INDEX idx_email_templates_type ON public.email_templates(template_type);
