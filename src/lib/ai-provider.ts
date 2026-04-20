import { supabase } from "@/integrations/supabase/client";

export type AIProvider = "lovable" | "perplexity";

/**
 * Fetch the user's preferred AI provider from their profile.
 * Defaults to "lovable" if not set or on error.
 */
export const getAIProvider = async (): Promise<AIProvider> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return "lovable";
    const { data } = await supabase
      .from("profiles")
      .select("ai_provider")
      .eq("id", user.id)
      .maybeSingle();
    const value = (data as any)?.ai_provider;
    return value === "perplexity" ? "perplexity" : "lovable";
  } catch {
    return "lovable";
  }
};
