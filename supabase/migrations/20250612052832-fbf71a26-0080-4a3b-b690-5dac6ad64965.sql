
-- Criar tabela para instâncias Evolution API
CREATE TABLE public.evolution_instances (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  usuario_id UUID NOT NULL,
  instance_name TEXT NOT NULL UNIQUE,
  api_key TEXT NOT NULL,
  api_url TEXT NOT NULL,
  status TEXT DEFAULT 'disconnected' CHECK (status IN ('connected', 'disconnected', 'connecting', 'error')),
  qr_code TEXT,
  webhook_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Adicionar RLS para evolution_instances
ALTER TABLE public.evolution_instances ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own evolution instances" 
  ON public.evolution_instances 
  FOR SELECT 
  USING (auth.uid() = usuario_id);

CREATE POLICY "Users can create their own evolution instances" 
  ON public.evolution_instances 
  FOR INSERT 
  WITH CHECK (auth.uid() = usuario_id);

CREATE POLICY "Users can update their own evolution instances" 
  ON public.evolution_instances 
  FOR UPDATE 
  USING (auth.uid() = usuario_id);

CREATE POLICY "Users can delete their own evolution instances" 
  ON public.evolution_instances 
  FOR DELETE 
  USING (auth.uid() = usuario_id);

-- Adicionar RLS para alertas (já existe a tabela)
ALTER TABLE public.alertas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own alerts" 
  ON public.alertas 
  FOR SELECT 
  USING (auth.uid() = usuario_id);

CREATE POLICY "Users can create their own alerts" 
  ON public.alertas 
  FOR INSERT 
  WITH CHECK (auth.uid() = usuario_id);

CREATE POLICY "Users can update their own alerts" 
  ON public.alertas 
  FOR UPDATE 
  USING (auth.uid() = usuario_id);

CREATE POLICY "Users can delete their own alerts" 
  ON public.alertas 
  FOR DELETE 
  USING (auth.uid() = usuario_id);

-- Adicionar coluna evolution_instance_id na tabela alertas para vincular com instância WhatsApp
ALTER TABLE public.alertas ADD COLUMN evolution_instance_id UUID REFERENCES public.evolution_instances(id);

-- Trigger para atualizar updated_at na tabela evolution_instances
CREATE OR REPLACE FUNCTION update_updated_at_evolution()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_evolution_instances_updated_at
    BEFORE UPDATE ON public.evolution_instances
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_evolution();
