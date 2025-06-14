
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export function useProviderTokens(provider: string) {
  const [tokens, setTokens] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    if (!provider || provider === 'outros') return;
    
    const fetchTokens = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        console.log('Buscando tokens para provider:', provider, 'user:', user?.id);
        
        if (!user?.id) {
          console.log('Usuário não autenticado');
          setTokens([]);
          return;
        }

        const { data, error: fetchError } = await supabase
          .from("provider_tokens")
          .select("*")
          .eq("provider", provider)
          .eq("usuario_id", user.id)
          .order("created_at", { ascending: false });

        if (fetchError) {
          console.error('Erro ao buscar tokens:', fetchError);
          setError(fetchError.message);
          setTokens([]);
        } else {
          console.log('Tokens encontrados:', data);
          setTokens(data || []);
        }
      } catch (err: any) {
        console.error('Erro inesperado ao buscar tokens:', err);
        setError(err.message || 'Erro inesperado');
        setTokens([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTokens();
  }, [provider, user?.id]);

  const refetch = async () => {
    if (!provider || provider === 'outros') return;
    
    try {
      setIsLoading(true);
      setError(null);
      
      if (!user?.id) {
        setTokens([]);
        return;
      }

      const { data, error: fetchError } = await supabase
        .from("provider_tokens")
        .select("*")
        .eq("provider", provider)
        .eq("usuario_id", user.id)
        .order("created_at", { ascending: false });

      if (fetchError) {
        console.error('Erro ao refetch tokens:', fetchError);
        setError(fetchError.message);
        setTokens([]);
      } else {
        setTokens(data || []);
      }
    } catch (err: any) {
      console.error('Erro inesperado no refetch:', err);
      setError(err.message || 'Erro inesperado');
      setTokens([]);
    } finally {
      setIsLoading(false);
    }
  };

  return { tokens, isLoading, error, refetch };
}
