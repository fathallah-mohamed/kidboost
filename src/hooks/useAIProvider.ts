import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export type AIProvider = "lovable" | "perplexity";

export const useAIProvider = () => {
  const [aiProvider, setAIProviderState] = useState<AIProvider>("lovable");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const fetchProvider = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        if (!cancelled) setLoading(false);
        return;
      }
      const { data } = await supabase
        .from("profiles")
        .select("ai_provider")
        .eq("id", user.id)
        .maybeSingle();
      if (!cancelled) {
        if (data?.ai_provider === "perplexity" || data?.ai_provider === "lovable") {
          setAIProviderState(data.ai_provider as AIProvider);
        }
        setLoading(false);
      }
    };
    fetchProvider();
    return () => { cancelled = true; };
  }, []);

  const setAIProvider = async (provider: AIProvider) => {
    setAIProviderState(provider);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase
      .from("profiles")
      .update({ ai_provider: provider } as any)
      .eq("id", user.id);
  };

  return { aiProvider, setAIProvider, loading };
};
