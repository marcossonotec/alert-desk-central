
-- Criar tabela para tipos de aplicações e seus preços
CREATE TABLE public.tipos_aplicacao (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome text NOT NULL,
  descricao text,
  preco_mensal numeric NOT NULL,
  recursos jsonb NOT NULL DEFAULT '{}',
  ativo boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Inserir tipos de aplicações padrão
INSERT INTO public.tipos_aplicacao (nome, descricao, preco_mensal, recursos) VALUES
('nodejs', 'Node.js/Express', 29.00, '{"logs": true, "errors": true, "performance": true, "uptime": true, "memory_usage": true}'),
('wordpress', 'WordPress', 19.00, '{"site_status": true, "plugins": true, "updates": true, "security": true, "backup_status": true}'),
('php', 'PHP/Laravel', 39.00, '{"error_logs": true, "performance": true, "sessions": true, "database_queries": true}'),
('docker', 'Docker Containers', 49.00, '{"container_status": true, "resource_usage": true, "logs": true, "networks": true}'),
('database', 'Banco de Dados', 59.00, '{"connections": true, "slow_queries": true, "storage_usage": true, "performance": true}');

-- Criar tabela para aplicações dos usuários
CREATE TABLE public.aplicacoes (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  servidor_id uuid NOT NULL REFERENCES public.servidores(id) ON DELETE CASCADE,
  usuario_id uuid NOT NULL,
  tipo_aplicacao_id uuid NOT NULL REFERENCES public.tipos_aplicacao(id),
  nome text NOT NULL,
  descricao text,
  configuracao jsonb NOT NULL DEFAULT '{}',
  status text NOT NULL DEFAULT 'ativo',
  porta integer,
  caminho text,
  url_monitoramento text,
  data_criacao timestamp with time zone NOT NULL DEFAULT now(),
  data_atualizacao timestamp with time zone NOT NULL DEFAULT now()
);

-- Criar tabela para métricas das aplicações
CREATE TABLE public.aplicacao_metricas (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  aplicacao_id uuid NOT NULL REFERENCES public.aplicacoes(id) ON DELETE CASCADE,
  tipo_metrica text NOT NULL,
  valor jsonb NOT NULL,
  timestamp timestamp with time zone NOT NULL DEFAULT now()
);

-- Criar tabela para assinaturas de aplicações
CREATE TABLE public.assinatura_aplicacoes (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  usuario_id uuid NOT NULL,
  aplicacao_id uuid NOT NULL REFERENCES public.aplicacoes(id) ON DELETE CASCADE,
  tipo_aplicacao_id uuid NOT NULL REFERENCES public.tipos_aplicacao(id),
  preco_mensal numeric NOT NULL,
  status text NOT NULL DEFAULT 'ativa',
  data_inicio timestamp with time zone NOT NULL DEFAULT now(),
  data_fim timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Adicionar índices para performance
CREATE INDEX idx_aplicacoes_servidor_id ON public.aplicacoes(servidor_id);
CREATE INDEX idx_aplicacoes_usuario_id ON public.aplicacoes(usuario_id);
CREATE INDEX idx_aplicacao_metricas_aplicacao_id ON public.aplicacao_metricas(aplicacao_id);
CREATE INDEX idx_aplicacao_metricas_timestamp ON public.aplicacao_metricas(timestamp);
CREATE INDEX idx_assinatura_aplicacoes_usuario_id ON public.assinatura_aplicacoes(usuario_id);

-- Criar trigger para atualizar data_atualizacao
CREATE OR REPLACE FUNCTION update_aplicacao_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.data_atualizacao = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_aplicacao_updated_at
    BEFORE UPDATE ON public.aplicacoes
    FOR EACH ROW
    EXECUTE PROCEDURE update_aplicacao_updated_at();

-- Habilitar RLS nas novas tabelas
ALTER TABLE public.aplicacoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.aplicacao_metricas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assinatura_aplicacoes ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para aplicacoes
CREATE POLICY "Users can view their own applications" 
  ON public.aplicacoes 
  FOR SELECT 
  USING (usuario_id = auth.uid());

CREATE POLICY "Users can create their own applications" 
  ON public.aplicacoes 
  FOR INSERT 
  WITH CHECK (usuario_id = auth.uid());

CREATE POLICY "Users can update their own applications" 
  ON public.aplicacoes 
  FOR UPDATE 
  USING (usuario_id = auth.uid());

CREATE POLICY "Users can delete their own applications" 
  ON public.aplicacoes 
  FOR DELETE 
  USING (usuario_id = auth.uid());

-- Políticas RLS para aplicacao_metricas
CREATE POLICY "Users can view metrics of their applications" 
  ON public.aplicacao_metricas 
  FOR SELECT 
  USING (EXISTS (
    SELECT 1 FROM public.aplicacoes 
    WHERE aplicacoes.id = aplicacao_metricas.aplicacao_id 
    AND aplicacoes.usuario_id = auth.uid()
  ));

CREATE POLICY "System can insert application metrics" 
  ON public.aplicacao_metricas 
  FOR INSERT 
  WITH CHECK (true);

-- Políticas RLS para assinatura_aplicacoes
CREATE POLICY "Users can view their own application subscriptions" 
  ON public.assinatura_aplicacoes 
  FOR SELECT 
  USING (usuario_id = auth.uid());

CREATE POLICY "Users can create their own application subscriptions" 
  ON public.assinatura_aplicacoes 
  FOR INSERT 
  WITH CHECK (usuario_id = auth.uid());

CREATE POLICY "Users can update their own application subscriptions" 
  ON public.assinatura_aplicacoes 
  FOR UPDATE 
  USING (usuario_id = auth.uid());
