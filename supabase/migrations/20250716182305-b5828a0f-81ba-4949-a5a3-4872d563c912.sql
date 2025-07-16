-- Criar política para permitir que todos os usuários autenticados vejam os tipos de aplicação
CREATE POLICY "Anyone can view application types" 
  ON public.tipos_aplicacao 
  FOR SELECT 
  USING (true);