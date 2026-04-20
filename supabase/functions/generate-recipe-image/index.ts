import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { recipeId, recipeName, ingredients } = await req.json();
    if (!recipeName || !ingredients) {
      throw new Error("recipeName et ingredients sont requis");
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) throw new Error('LOVABLE_API_KEY non configurée');

    const ingredientsText = Array.isArray(ingredients)
      ? ingredients.map((i: any) => typeof i === 'string' ? i : i.item || i.name || '').filter(Boolean).slice(0, 8).join(', ')
      : String(ingredients);

    const prompt = `Photographie culinaire réaliste et appétissante de "${recipeName}".
Plat préparé avec : ${ingredientsText}.
Vue de dessus 3/4, assiette colorée adaptée aux enfants, dressage soigné et appétissant.
Lumière naturelle douce, fond bois clair ou nappe en lin, style food photography professionnel.
Couleurs vives et naturelles, texture détaillée des aliments. Pas de texte, pas de watermark.`;

    console.log('Generating image for:', recipeName);

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash-image-preview',
        messages: [{ role: 'user', content: prompt }],
        modalities: ['image', 'text'],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      if (response.status === 429) throw new Error("Trop de requêtes, réessayez dans un instant");
      if (response.status === 402) throw new Error("Crédits Lovable AI insuffisants");
      throw new Error(`Erreur Lovable AI (${response.status}): ${errorText}`);
    }

    const data = await response.json();
    const imageDataUrl = data.choices?.[0]?.message?.images?.[0]?.image_url?.url;

    if (!imageDataUrl || !imageDataUrl.startsWith('data:image/')) {
      console.error('No image in response:', JSON.stringify(data).slice(0, 500));
      throw new Error("Aucune image générée");
    }

    // Decode base64 → upload to Storage
    const base64 = imageDataUrl.split(',')[1];
    const bytes = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const fileName = `${recipeId || crypto.randomUUID()}.png`;

    const { error: uploadError } = await supabaseAdmin.storage
      .from('recipe-images')
      .upload(fileName, bytes, {
        contentType: 'image/png',
        upsert: true,
      });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      throw new Error(`Erreur upload: ${uploadError.message}`);
    }

    const { data: publicUrlData } = supabaseAdmin.storage
      .from('recipe-images')
      .getPublicUrl(fileName);

    const imageUrl = publicUrlData.publicUrl;
    console.log('Image stored at:', imageUrl);

    return new Response(
      JSON.stringify({ imageUrl }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('generate-recipe-image error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
