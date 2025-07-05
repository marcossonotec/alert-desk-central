-- Inserir tipos de aplicação se não existirem
INSERT INTO tipos_aplicacao (nome, descricao, preco_mensal, recursos, ativo) 
VALUES 
  ('WordPress', 'Monitoramento de sites WordPress', 19.90, '{"ssl_monitoring": true, "uptime_monitoring": true, "performance_monitoring": true}', true),
  ('API REST', 'Monitoramento de APIs RESTful', 29.90, '{"response_time_monitoring": true, "endpoint_monitoring": true, "status_code_monitoring": true}', true),
  ('E-commerce', 'Monitoramento de lojas virtuais', 39.90, '{"transaction_monitoring": true, "inventory_monitoring": true, "performance_monitoring": true}', true),
  ('Banco de Dados', 'Monitoramento de bancos de dados', 49.90, '{"query_monitoring": true, "performance_monitoring": true, "backup_monitoring": true}', true),
  ('Docker Container', 'Monitoramento de containers Docker', 34.90, '{"container_monitoring": true, "resource_monitoring": true, "log_monitoring": true}', true)
ON CONFLICT (nome) DO NOTHING;