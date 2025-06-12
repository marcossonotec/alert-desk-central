
import { useState, useEffect, createContext, useContext } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Configurar listener de estado de autenticação
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state change:', event, session);
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);

        // Diagnóstico em caso de erro
        if (event === 'SIGNED_OUT' && session === null) {
          console.log('Usuário deslogado ou sessão expirou');
        }
        if (event === 'TOKEN_REFRESHED') {
          console.log('Token renovado com sucesso');
        }
      }
    );

    // Verificar sessão inicial com retry em caso de falha
    const checkSession = async (retries = 3) => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) {
          console.error('Erro ao verificar sessão:', error);
          if (retries > 0) {
            setTimeout(() => checkSession(retries - 1), 1000);
            return;
          }
        }
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      } catch (error) {
        console.error('Erro crítico ao verificar sessão:', error);
        if (retries > 0) {
          setTimeout(() => checkSession(retries - 1), 2000);
        } else {
          setLoading(false);
        }
      }
    };

    checkSession();

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('Erro ao fazer logout:', error);
        throw error;
      }
    } catch (error) {
      console.error('Erro crítico no logout:', error);
      // Forçar limpeza local em caso de erro
      setSession(null);
      setUser(null);
      localStorage.removeItem('supabase.auth.token');
    }
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
};
