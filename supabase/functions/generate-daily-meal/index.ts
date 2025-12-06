import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.47.12';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { childId, profileId, mealType, date } = await req.json();
    
    console.log("generate-daily-meal - Request:", { childId, profileId, mealType, date });

    if (!childId || !profileId || !mealType || !date) {
      throw new Error("childId, profileId, mealType et date sont requis");
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get child profile
    const { data: child, error: childError } = await supabase
      .from('children_profiles')
      .select('*')
      .eq('id', childId)
      .single();

    if (childError || !child) {
      throw new Error("Enfant non trouvé");
    }

    const childAge = new Date().getFullYear() - new Date(child.birth_date).getFullYear();
    const allergies = (child.allergies || []).filter(Boolean).join(", ");
    const preferences = (child.preferences || []).filter(Boolean).join(", ");
    const dislikes = (child.dislikes || []).filter(Boolean).join(", ");
    const availableTime = child.available_time || 20;

    const mealLabels: Record<string, string> = {
      'snack': 'goûter',
      'dinner': 'dîner',
      'lunchbox': 'lunchbox/déjeuner à emporter'
    };
    const mealLabel = mealLabels[mealType] || 'repas';

    const prompt = `Génère une recette de ${mealLabel} pour un enfant de ${childAge} ans.

Contraintes:
- Temps de préparation max: ${availableTime} minutes
${allergies ? `- Allergies à éviter: ${allergies}` : '- Pas d\'allergies connues'}
${preferences ? `- Préférences: ${preferences}` : ''}
${dislikes ? `- N'aime pas: ${dislikes}` : ''}

La recette doit être équilibrée et adaptée à l'âge de l'enfant.`;

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'system',
            content: `Tu es un chef cuisinier spécialisé dans les repas pour enfants. 
Tu dois retourner UNIQUEMENT un JSON valide, sans texte avant ou après.`
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        tools: [{
          type: "function",
          function: {
            name: "create_recipe",
            description: "Crée une recette adaptée à l'enfant",
            parameters: {
              type: "object",
              properties: {
                name: { type: "string", description: "Nom de la recette" },
                ingredients: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      item: { type: "string" },
                      quantity: { type: "string" },
                      unit: { type: "string" }
                    },
                    required: ["item", "quantity", "unit"]
                  }
                },
                instructions: {
                  type: "array",
                  items: { type: "string" }
                },
                preparation_time: { type: "number" },
                nutritional_info: {
                  type: "object",
                  properties: {
                    calories: { type: "number" },
                    protein: { type: "number" },
                    carbs: { type: "number" },
                    fat: { type: "number" },
                    fiber: { type: "number" }
                  }
                }
              },
              required: ["name", "ingredients", "instructions", "preparation_time", "nutritional_info"]
            }
          }
        }],
        tool_choice: { type: "function", function: { name: "create_recipe" } }
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error("AI Gateway error:", aiResponse.status, errorText);
      if (aiResponse.status === 429) {
        throw new Error("Trop de requêtes, réessayez plus tard");
      }
      if (aiResponse.status === 402) {
        throw new Error("Crédits IA insuffisants");
      }
      throw new Error(`Erreur IA: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    console.log("AI Response:", JSON.stringify(aiData, null, 2));

    let recipeData;
    if (aiData.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments) {
      recipeData = JSON.parse(aiData.choices[0].message.tool_calls[0].function.arguments);
    } else {
      throw new Error("Réponse IA invalide");
    }

    // Save recipe to database
    const { data: savedRecipe, error: saveError } = await supabase
      .from('recipes')
      .insert({
        name: recipeData.name,
        ingredients: recipeData.ingredients,
        instructions: recipeData.instructions.join('\n'),
        preparation_time: recipeData.preparation_time || availableTime,
        nutritional_info: recipeData.nutritional_info,
        meal_type: mealType,
        profile_id: profileId,
        child_id: childId,
        is_generated: true,
        auto_generated: true,
        difficulty: 'easy',
        servings: 1,
        max_prep_time: availableTime,
        source: 'ia'
      })
      .select()
      .single();

    if (saveError) {
      console.error("Error saving recipe:", saveError);
      throw new Error("Erreur lors de la sauvegarde de la recette");
    }

    // Create meal plan entry
    const { error: planError } = await supabase
      .from('meal_plans')
      .insert({
        profile_id: profileId,
        child_id: childId,
        recipe_id: savedRecipe.id,
        date: date,
        meal_time: mealType,
        is_auto_generated: true
      });

    if (planError) {
      console.error("Error creating meal plan:", planError);
    }

    console.log("Successfully created meal:", savedRecipe.name);

    return new Response(
      JSON.stringify({ 
        success: true, 
        recipe: savedRecipe,
        message: `Recette "${savedRecipe.name}" générée avec succès`
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error("generate-daily-meal error:", error);
    return new Response(
      JSON.stringify({ 
        error: error.message || "Erreur inconnue",
        success: false
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
