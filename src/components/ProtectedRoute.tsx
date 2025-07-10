
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    console.log('ProtectedRoute - Auth state:', { user: user?.email, loading });
    
    if (!loading && !user) {
      console.log('Redirecionando para login - usuário não autenticado');
      navigate('/login');
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <h1 className="text-xl font-semibold mb-2">Carregando...</h1>
          <p className="text-muted-foreground">Verificando autenticação...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    console.log('ProtectedRoute - Usuário não encontrado, retornando null');
    return null;
  }

  console.log('ProtectedRoute - Usuário autenticado, renderizando children');
  return <>{children}</>;
};

export default ProtectedRoute;
