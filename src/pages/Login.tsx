
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import ThemeToggle from '@/components/ThemeToggle';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [isResetting, setIsResetting] = useState(false);
  const [showResetDialog, setShowResetDialog] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      toast({
        title: "Login realizado com sucesso!",
        description: "Você será redirecionado para o dashboard.",
      });

      navigate('/dashboard');
    } catch (error: any) {
      console.error('Erro no login:', error);
      
      let errorMessage = "Credenciais inválidas.";
      if (error.message?.includes('Invalid login credentials')) {
        errorMessage = "Email ou senha incorretos.";
      } else if (error.message?.includes('Email not confirmed')) {
        errorMessage = "Por favor, confirme seu email antes de fazer login.";
      } else if (error.message?.includes('Too many requests')) {
        errorMessage = "Muitas tentativas. Tente novamente em alguns minutos.";
      } else if (error.message) {
        errorMessage = error.message;
      }

      toast({
        title: "Erro no login",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsResetting(true);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) throw error;

      toast({
        title: "Email de recuperação enviado!",
        description: "Verifique sua caixa de entrada para redefinir sua senha.",
      });

      setShowResetDialog(false);
      setResetEmail('');
    } catch (error: any) {
      console.error('Erro ao enviar email de recuperação:', error);
      toast({
        title: "Erro na recuperação",
        description: error.message || "Não foi possível enviar o email de recuperação.",
        variant: "destructive"
      });
    } finally {
      setIsResetting(false);
    }
  };

  const retryConnection = async () => {
    toast({
      title: "Reconectando...",
      description: "Tentando restabelecer conexão com o servidor.",
    });
    
    try {
      const { data } = await supabase.auth.getSession();
      if (data.session) {
        navigate('/dashboard');
      }
    } catch (error) {
      console.error('Erro na reconexão:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center px-4">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>
      
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/" className="inline-block hover:opacity-80 transition-opacity">
            <h1 className="text-3xl font-bold text-blue-600 dark:text-blue-400 mb-2">
              DeskTools
            </h1>
          </Link>
          <p className="text-gray-600 dark:text-gray-400">
            Monitoramento de servidores em nuvem
          </p>
        </div>

        <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
          <CardHeader>
            <CardTitle className="text-gray-900 dark:text-white">Entrar</CardTitle>
            <CardDescription className="text-gray-600 dark:text-gray-400">
              Acesse sua conta para monitorar seus servidores
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-gray-700 dark:text-gray-300">
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password" className="text-gray-700 dark:text-gray-300">
                  Senha
                </Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white"
                  required
                />
              </div>
              
              <Button 
                type="submit" 
                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                disabled={isLoading}
              >
                {isLoading ? 'Entrando...' : 'Entrar'}
              </Button>
            </form>
            
            <div className="mt-6 space-y-4 text-center">
              <Dialog open={showResetDialog} onOpenChange={setShowResetDialog}>
                <DialogTrigger asChild>
                  <button className="text-sm text-blue-600 dark:text-blue-400 hover:underline">
                    Esqueci minha senha
                  </button>
                </DialogTrigger>
                <DialogContent className="bg-white dark:bg-gray-800">
                  <DialogHeader>
                    <DialogTitle className="text-gray-900 dark:text-white">
                      Recuperar Senha
                    </DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleResetPassword} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="reset-email" className="text-gray-700 dark:text-gray-300">
                        Email para recuperação
                      </Label>
                      <Input
                        id="reset-email"
                        type="email"
                        value={resetEmail}
                        onChange={(e) => setResetEmail(e.target.value)}
                        placeholder="Digite seu email"
                        className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600"
                        required
                      />
                    </div>
                    <Button 
                      type="submit" 
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                      disabled={isResetting}
                    >
                      {isResetting ? 'Enviando...' : 'Enviar Email de Recuperação'}
                    </Button>
                  </form>
                </DialogContent>
              </Dialog>

              <div className="text-center">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Não tem uma conta?{' '}
                  <Link 
                    to="/register" 
                    className="text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    Cadastre-se
                  </Link>
                </p>
              </div>

              <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                <Button
                  onClick={retryConnection}
                  variant="outline"
                  size="sm"
                  className="text-xs"
                >
                  Problemas de conexão? Tentar novamente
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Login;
