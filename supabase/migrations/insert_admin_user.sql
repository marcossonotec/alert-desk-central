
-- Inserir o usuário administrador padrão no sistema
-- Este script deve ser executado após o usuário se cadastrar através da interface
-- para garantir que o usuário existe na tabela auth.users primeiro

-- Atualizar ou inserir o perfil do administrador
INSERT INTO public.profiles (id, email, nome_completo, plano_ativo, data_criacao, data_atualizacao)
VALUES (
  -- Você precisa pegar o UUID do usuário admin@flowserv.com.br após o cadastro
  -- Este é um placeholder que deve ser substituído pelo UUID real
  '00000000-0000-0000-0000-000000000000',
  'admin@flowserv.com.br',
  'Administrador do Sistema',
  'admin',
  NOW(),
  NOW()
) 
ON CONFLICT (id) DO UPDATE SET
  plano_ativo = 'admin',
  nome_completo = 'Administrador do Sistema',
  data_atualizacao = NOW();

-- Comentário: 
-- 1. Primeiro, cadastre o usuário admin@flowserv.com.br através da interface de registro
-- 2. Depois, execute este script substituindo o UUID placeholder pelo UUID real do usuário
-- 3. O UUID pode ser encontrado na tabela auth.users após o cadastro
