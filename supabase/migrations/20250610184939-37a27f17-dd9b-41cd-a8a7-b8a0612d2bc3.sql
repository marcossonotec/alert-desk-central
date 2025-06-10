
-- Criar tabela de usuários/clientes (profiles)
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  nome_completo TEXT,
  empresa TEXT,
  telefone TEXT,
  plano_ativo TEXT DEFAULT 'free',
  data_criacao TIMESTAMPTZ DEFAULT NOW(),
  data_atualizacao TIMESTAMPTZ DEFAULT NOW()
);

-- Criar tabela de servidores
CREATE TABLE public.servidores (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  usuario_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  nome TEXT NOT NULL,
  ip TEXT NOT NULL,
  provedor TEXT DEFAULT 'hetzner',
  webhook_url TEXT NOT NULL,
  api_key TEXT NOT NULL,
  status TEXT DEFAULT 'ativo',
  ultima_verificacao TIMESTAMPTZ,
  data_criacao TIMESTAMPTZ DEFAULT NOW(),
  data_atualizacao TIMESTAMPTZ DEFAULT NOW()
);

-- Criar tabela de métricas coletadas
CREATE TABLE public.metricas (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  servidor_id UUID REFERENCES public.servidores(id) ON DELETE CASCADE NOT NULL,
  cpu_usage DECIMAL,
  memoria_usage DECIMAL,
  disco_usage DECIMAL,
  rede_in BIGINT,
  rede_out BIGINT,
  uptime TEXT,
  timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- Criar tabela de alertas configurados
CREATE TABLE public.alertas (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  usuario_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  servidor_id UUID REFERENCES public.servidores(id) ON DELETE CASCADE,
  tipo_alerta TEXT NOT NULL, -- 'cpu', 'memoria', 'disco', 'offline'
  limite_valor DECIMAL NOT NULL,
  canal_notificacao TEXT[] DEFAULT ARRAY['email'], -- 'email', 'whatsapp'
  ativo BOOLEAN DEFAULT TRUE,
  data_criacao TIMESTAMPTZ DEFAULT NOW()
);

-- Criar tabela de notificações enviadas
CREATE TABLE public.notificacoes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  alerta_id UUID REFERENCES public.alertas(id) ON DELETE CASCADE NOT NULL,
  servidor_id UUID REFERENCES public.servidores(id) ON DELETE CASCADE NOT NULL,
  canal TEXT NOT NULL,
  destinatario TEXT NOT NULL,
  mensagem TEXT NOT NULL,
  status TEXT DEFAULT 'enviado',
  data_envio TIMESTAMPTZ DEFAULT NOW()
);

-- Criar tabela de assinaturas/pagamentos
CREATE TABLE public.assinaturas (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  usuario_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  plano TEXT NOT NULL, -- 'basic', 'pro', 'enterprise'
  status TEXT DEFAULT 'ativa', -- 'ativa', 'cancelada', 'suspensa'
  preco_mensal DECIMAL NOT NULL,
  provedor_pagamento TEXT NOT NULL, -- 'stripe', 'mercadopago'
  subscription_id TEXT,
  data_inicio TIMESTAMPTZ DEFAULT NOW(),
  data_fim TIMESTAMPTZ,
  data_criacao TIMESTAMPTZ DEFAULT NOW()
);

-- Habilitar Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.servidores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.metricas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alertas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notificacoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assinaturas ENABLE ROW LEVEL SECURITY;

-- Políticas de segurança para profiles
CREATE POLICY "Usuários podem ver apenas seu próprio perfil" ON public.profiles
  FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Usuários podem atualizar apenas seu próprio perfil" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Inserir perfil no cadastro" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Políticas de segurança para servidores
CREATE POLICY "Usuários podem ver apenas seus próprios servidores" ON public.servidores
  FOR SELECT USING (auth.uid() = usuario_id);
CREATE POLICY "Usuários podem inserir servidores" ON public.servidores
  FOR INSERT WITH CHECK (auth.uid() = usuario_id);
CREATE POLICY "Usuários podem atualizar seus próprios servidores" ON public.servidores
  FOR UPDATE USING (auth.uid() = usuario_id);
CREATE POLICY "Usuários podem deletar seus próprios servidores" ON public.servidores
  FOR DELETE USING (auth.uid() = usuario_id);

-- Políticas de segurança para métricas
CREATE POLICY "Usuários podem ver métricas de seus servidores" ON public.metricas
  FOR SELECT USING (servidor_id IN (SELECT id FROM public.servidores WHERE usuario_id = auth.uid()));
CREATE POLICY "Edge functions podem inserir métricas" ON public.metricas
  FOR INSERT WITH CHECK (true);

-- Políticas de segurança para alertas
CREATE POLICY "Usuários podem gerenciar seus próprios alertas" ON public.alertas
  FOR ALL USING (auth.uid() = usuario_id);

-- Políticas de segurança para notificações
CREATE POLICY "Usuários podem ver suas próprias notificações" ON public.notificacoes
  FOR SELECT USING (alerta_id IN (SELECT id FROM public.alertas WHERE usuario_id = auth.uid()));

-- Políticas de segurança para assinaturas
CREATE POLICY "Usuários podem ver suas próprias assinaturas" ON public.assinaturas
  FOR SELECT USING (auth.uid() = usuario_id);
CREATE POLICY "Edge functions podem gerenciar assinaturas" ON public.assinaturas
  FOR ALL WITH CHECK (true);

-- Função para atualizar data_atualizacao automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.data_atualizacao = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers para atualizar data_atualizacao
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_servidores_updated_at BEFORE UPDATE ON public.servidores
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
