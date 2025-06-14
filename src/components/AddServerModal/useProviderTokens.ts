
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export function useProviderTokens(provider: string) {
  const [tokens, setTokens] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    if (!provider || provider === 'outros') {
      console.log('Provider é "outros" ou vazio, não buscando tokens');
      setTokens([]);
      setIsLoading(false);
      setError(null);
      return;
    }
    
    const fetchTokens = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        console.log('useProviderTokens: Buscando tokens para provider:', provider, 'user:', user?.id);
        
        if (!user?.id) {
          console.log('useProviderTokens: Usuário não autenticado');
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
          console.error('useProviderTokens: Erro ao buscar tokens:', fetchError);
          setError(fetchError.message);
          setTokens([]);
        } else {
          console.log('useProviderTokens: Tokens encontrados:', data?.length || 0);
          setTokens(data || []);
        }
      } catch (err: any) {
        console.error('useProviderTokens: Erro inesperado ao buscar tokens:', err);
        setError(err.message || 'Erro inesperado');
        setTokens([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTokens();
  }, [provider, user?.id]);

  const refetch = async () => {
    if (!provider || provider === 'outros') {
      console.log('useProviderTokens refetch: Provider é "outros" ou vazio');
      return;
    }
    
    try {
      setIsLoading(true);
      setError(null);
      
      console.log('useProviderTokens refetch: Recarregando tokens para provider:', provider);
      
      if (!user?.id) {
        console.log('useProviderTokens refetch: Usuário não autenticado');
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
        console.error('useProviderTokens refetch: Erro ao refetch tokens:', fetchError);
        setError(fetchError.message);
        setTokens([]);
      } else {
        console.log('useProviderTokens refetch: Tokens recarregados:', data?.length || 0);
        setTokens(data || []);
      }
    } catch (err: any) {
      console.error('useProviderTokens refetch: Erro inesperado no refetch:', err);
      setError(err.message || 'Erro inesperado');
      setTokens([]);
    } finally {
      setIsLoading(false);
    }
  };

  return { tokens, isLoading, error, refetch };
}
