-- Habilitar extensões essenciais para realtime e cron jobs
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Configurar realtime para tabelas críticas
ALTER TABLE public.metricas REPLICA IDENTITY FULL;
ALTER TABLE public.alertas REPLICA IDENTITY FULL;
ALTER TABLE public.notificacoes REPLICA IDENTITY FULL;
ALTER TABLE public.servidores REPLICA IDENTITY FULL;
ALTER TABLE public.evolution_instances REPLICA IDENTITY FULL;

-- Adicionar tabelas à publicação realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.metricas;
ALTER PUBLICATION supabase_realtime ADD TABLE public.alertas;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notificacoes;
ALTER PUBLICATION supabase_realtime ADD TABLE public.servidores;
ALTER PUBLICATION supabase_realtime ADD TABLE public.evolution_instances;

-- Criar tabela para logs do sistema
CREATE TABLE IF NOT EXISTS public.system_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  level TEXT NOT NULL DEFAULT 'info',
  service TEXT NOT NULL,
  message TEXT NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb
);

-- RLS para system_logs
ALTER TABLE public.system_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage system logs" 
ON public.system_logs 
FOR ALL 
USING (is_admin());

-- Função para limpeza automática de dados antigos
CREATE OR REPLACE FUNCTION public.cleanup_old_data()
RETURNS void AS $$
BEGIN
  -- Manter apenas 30 dias de métricas
  DELETE FROM public.metricas 
  WHERE timestamp < NOW() - INTERVAL '30 days';

  -- Manter apenas 90 dias de notificações
  DELETE FROM public.notificacoes 
  WHERE data_envio < NOW() - INTERVAL '90 days';

  -- Manter apenas 7 dias de logs do sistema
  DELETE FROM public.system_logs 
  WHERE timestamp < NOW() - INTERVAL '7 days';

  -- Log da limpeza
  INSERT INTO public.system_logs (service, message, metadata)
  VALUES ('cleanup', 'Limpeza automática executada', jsonb_build_object('timestamp', NOW()));
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Agendar coleta de métricas a cada 2 minutos
SELECT cron.schedule(
  'collect-metrics-multi-provider',
  '*/2 * * * *',
  $$
  SELECT net.http_post(
    url := 'https://obclzswvwjslxexskvcf.supabase.co/functions/v1/multi-provider-monitor',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9iY2x6c3d2d2pzbHhleHNrdmNmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk1ODA2NTQsImV4cCI6MjA2NTE1NjY1NH0.lSWYN5EZuGm__CfGXQdg9KLUzsO2pg83YfKbkzylyys"}'::jsonb,
    body := '{"source": "cron"}'::jsonb
  );
  $$
);

-- Agendar processamento de alertas a cada 1 minuto
SELECT cron.schedule(
  'process-alerts-realtime',
  '* * * * *',
  $$
  SELECT net.http_post(
    url := 'https://obclzswvwjslxexskvcf.supabase.co/functions/v1/alert-orchestrator',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9iY2x6c3d2d2pzbHhleHNrdmNmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk1ODA2NTQsImV4cCI6MjA2NTE1NjY1NH0.lSWYN5EZuGm__CfGXQdg9KLUzsO2pg83YfKbkzylyys"}'::jsonb,
    body := '{"source": "cron"}'::jsonb
  );
  $$
);

-- Agendar limpeza diária às 02:00
SELECT cron.schedule(
  'daily-cleanup',
  '0 2 * * *',
  'SELECT public.cleanup_old_data();'
);

-- Tabela para controle de cooldown de alertas
CREATE TABLE IF NOT EXISTS public.alert_cooldowns (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  alerta_id UUID NOT NULL REFERENCES public.alertas(id) ON DELETE CASCADE,
  servidor_id UUID REFERENCES public.servidores(id) ON DELETE CASCADE,
  tipo_alerta TEXT NOT NULL,
  last_sent TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  cooldown_minutes INTEGER DEFAULT 15,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS para alert_cooldowns
ALTER TABLE public.alert_cooldowns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own alert cooldowns"
ON public.alert_cooldowns
FOR SELECT
USING (
  alerta_id IN (
    SELECT id FROM public.alertas WHERE usuario_id = auth.uid()
  )
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_alert_cooldowns_alerta_servidor 
ON public.alert_cooldowns(alerta_id, servidor_id);

CREATE INDEX IF NOT EXISTS idx_system_logs_timestamp 
ON public.system_logs(timestamp);

CREATE INDEX IF NOT EXISTS idx_metricas_timestamp_servidor 
ON public.metricas(timestamp, servidor_id);