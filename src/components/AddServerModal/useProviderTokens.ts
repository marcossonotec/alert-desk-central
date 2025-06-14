
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export function useProviderTokens(provider: string, shouldFetch: boolean) {
  const [providerTokens, setProviderTokens] = useState<any[]>([]);
  const [fetchingTokens, setFetchingTokens] = useState(false);

  useEffect(() => {
    if (!shouldFetch) return;
    setFetchingTokens(true);
    supabase
      .from("provider_tokens")
      .select("*")
      .eq("provider", provider)
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        setProviderTokens(data || []);
        setFetchingTokens(false);
      });
  }, [provider, shouldFetch]);

  const refetch = async () => {
    setFetchingTokens(true);
    const { data } = await supabase
      .from("provider_tokens")
      .select("*")
      .eq("provider", provider)
      .order("created_at", { ascending: false });
    setProviderTokens(data || []);
    setFetchingTokens(false);
  };

  return { providerTokens, fetchingTokens, refetch };
}
