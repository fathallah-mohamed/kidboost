import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { photoUrls = [], ingredients = [] } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY non configurée');
    }

    const userContent: any[] = [
      {
        type: 'text',
        text: `Je vois ces ingrédients dans mes restes. Peux-tu me suggérer une recette créative pour des enfants ? Voici la liste des ingrédients connus : ${ingredients.join(', ') || 'aucun'}`
      },
      ...photoUrls.map((url: string) => ({
        type: 'image_url',
        image_url: { url }
      }))
    ];

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-pro',
        messages: [
          { role: 'system', content: 'Tu es un chef cuisinier expert qui propose des recettes adaptées aux enfants à partir de restes.' },
          { role: 'user', content: userContent }
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      if (response.status === 429) throw new Error("Trop de requêtes vers Lovable AI, réessayez dans un instant");
      if (response.status === 402) throw new Error("Crédits Lovable AI insuffisants");
      throw new Error(`Erreur Lovable AI (${response.status}): ${errorText}`);
    }

    const data = await response.json();
    const suggestion = data.choices?.[0]?.message?.content || '';

    return new Response(
      JSON.stringify({ suggestion }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('analyze-leftovers error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
