
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export function useProviderTokens(provider: string) {
  const [tokens, setTokens] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    if (!provider || provider === 'outros') return;
    
    setIsLoading(true);
    supabase
      .from("provider_tokens")
      .select("*")
      .eq("provider", provider)
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        setTokens(data || []);
        setIsLoading(false);
      });
  }, [provider]);

  const refetch = async () => {
    if (!provider || provider === 'outros') return;
    
    setIsLoading(true);
    const { data } = await supabase
      .from("provider_tokens")
      .select("*")
      .eq("provider", provider)
      .order("created_at", { ascending: false });
    setTokens(data || []);
    setIsLoading(false);
  };

  return { tokens, isLoading, refetch };
}
