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
    const { childId, profileId, mealType, date, context } = await req.json();
    
    console.log("generate-daily-meal - Request:", { childId, profileId, mealType, date, context });

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
    
    // Use context if provided, otherwise fall back to child profile
    const allergies = context?.allergies?.length > 0 
      ? context.allergies.join(", ")
      : (child.allergies || []).filter(Boolean).join(", ");
    
    const restrictions = context?.restrictions?.length > 0
      ? context.restrictions.join(", ")
      : [...(child.restrictions_alimentaires || []), ...(child.aliments_interdits || [])].filter(Boolean).join(", ");
    
    const preferences = context?.preferences?.length > 0
      ? context.preferences.join(", ")
      : [...(child.aliments_preferes || []), ...(child.preferences_gout || [])].filter(Boolean).join(", ");
    
    const availableTime = context?.availableTime || child.available_time || 20;
    const equipment = context?.equipment?.length > 0 ? context.equipment.join(", ") : "";
    const parentStyle = context?.parentStyle?.length > 0 ? context.parentStyle.join(", ") : "";
    const familyAllergens = context?.familyAllergens?.length > 0 ? context.familyAllergens.join(", ") : "";

    // Meal type labels and specific instructions
    const mealConfigs: Record<string, { label: string; instructions: string }> = {
      'breakfast': {
        label: 'petit-déjeuner',
        instructions: 'Recette simple et rapide pour le matin, équilibrée et adaptée aux enfants. Peut inclure céréales, fruits, laitages, tartines.',
      },
      'lunch': {
        label: 'déjeuner',
        instructions: 'Repas complet et équilibré pour le midi. Inclure protéines, légumes et féculents.',
      },
      'snack': {
        label: 'goûter',
        instructions: 'Encas léger et gourmand pour l\'après-midi. Privilégier les fruits, laitages, gâteaux maison simples.',
      },
      'dinner': {
        label: 'dîner',
        instructions: 'Repas du soir équilibré mais pas trop lourd. Favoriser les légumes et protéines légères.',
      },
    };

    const mealConfig = mealConfigs[mealType] || { label: 'repas', instructions: '' };
    let specificInstructions = mealConfig.instructions;

    // Lunchbox specific constraints
    if (context?.isLunchbox) {
      if (context.lunchboxType === 'school_trip') {
        specificInstructions = `
CONTRAINTES STRICTES - PIQUE-NIQUE SORTIE SCOLAIRE:
- Repas 100% froid, aucune cuisson nécessaire sur place
- Facilement transportable dans un sac
- Consommable sans couverts si possible
- Types de recettes autorisés: sandwich, wrap, salade froide, quiche froide, cake salé, fruits, compote, biscuits
- INTERDIT: soupe, plat chaud, repas nécessitant réchauffage
- Portions adaptées à un enfant qui va se dépenser`;
      } else {
        specificInstructions = `
CONTRAINTES STRICTES - LUNCHBOX RÉGIME SPÉCIAL:
- Repas froid ou tiède, transportable
- Doit respecter STRICTEMENT les allergies et restrictions
- Consommable facilement à l'école
- Types de recettes: salade composée, sandwich sans allergène, wrap, légumes crus, fruit
- INTERDIT: plats chauds complexes, recettes avec allergènes
- Quantité adaptée à un enfant`;
      }
    }

    const prompt = `Génère une recette de ${mealConfig.label} pour un enfant de ${childAge} ans.

${specificInstructions}

Contraintes obligatoires:
- Temps de préparation max: ${availableTime} minutes
${allergies ? `- ALLERGIES À ÉVITER ABSOLUMENT: ${allergies}` : '- Pas d\'allergies connues'}
${familyAllergens ? `- ALLERGÈNES FAMILLE À ÉVITER: ${familyAllergens}` : ''}
${restrictions ? `- RESTRICTIONS ALIMENTAIRES: ${restrictions}` : ''}
${preferences ? `- Préférences de l'enfant: ${preferences}` : ''}
${equipment ? `- Matériel disponible: ${equipment}` : ''}
${parentStyle ? `- Style de cuisine préféré: ${parentStyle}` : ''}

La recette doit être:
- Équilibrée et nutritive
- Adaptée à l'âge de l'enfant
- Facile à préparer
- Appétissante pour un enfant`;

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    console.log("Calling AI with prompt:", prompt.substring(0, 500) + "...");

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
Tu dois créer des recettes adaptées, équilibrées et appétissantes.
Tu dois ABSOLUMENT respecter les allergies et restrictions mentionnées.
Tu retournes UNIQUEMENT le résultat via l'outil create_recipe.`
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
                name: { type: "string", description: "Nom de la recette (appétissant pour un enfant)" },
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
                  items: { type: "string" },
                  description: "Étapes de préparation claires et simples"
                },
                preparation_time: { type: "number", description: "Temps en minutes" },
                nutritional_info: {
                  type: "object",
                  properties: {
                    calories: { type: "number" },
                    protein: { type: "number" },
                    carbs: { type: "number" },
                    fat: { type: "number" },
                    fiber: { type: "number" }
                  }
                },
                tips: { type: "string", description: "Conseil pour les parents" }
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
        throw new Error("Trop de requêtes, réessayez dans quelques instants");
      }
      if (aiResponse.status === 402) {
        throw new Error("Crédits IA insuffisants, veuillez recharger");
      }
      throw new Error(`Erreur IA: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    console.log("AI Response received");

    let recipeData;
    if (aiData.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments) {
      recipeData = JSON.parse(aiData.choices[0].message.tool_calls[0].function.arguments);
    } else {
      console.error("Invalid AI response structure:", JSON.stringify(aiData, null, 2));
      throw new Error("Réponse IA invalide, veuillez réessayer");
    }

    // Save recipe to database
    const { data: savedRecipe, error: saveError } = await supabase
      .from('recipes')
      .insert({
        name: recipeData.name,
        ingredients: recipeData.ingredients,
        instructions: recipeData.instructions.join('\n'),
        preparation_time: Math.min(recipeData.preparation_time || availableTime, availableTime),
        nutritional_info: recipeData.nutritional_info,
        meal_type: mealType,
        profile_id: profileId,
        child_id: childId,
        is_generated: true,
        auto_generated: true,
        difficulty: 'easy',
        servings: 1,
        max_prep_time: availableTime,
        source: 'ia',
        allergens: allergies ? allergies.split(", ") : [],
        dietary_preferences: restrictions ? restrictions.split(", ") : [],
      })
      .select()
      .single();

    if (saveError) {
      console.error("Error saving recipe:", saveError);
      throw new Error("Erreur lors de la sauvegarde de la recette");
    }

    // Create or update meal plan entry
    const { data: existingPlan } = await supabase
      .from('meal_plans')
      .select('id')
      .eq('profile_id', profileId)
      .eq('child_id', childId)
      .eq('date', date)
      .eq('meal_time', mealType)
      .maybeSingle();

    if (existingPlan) {
      const { error: updateError } = await supabase
        .from('meal_plans')
        .update({
          recipe_id: savedRecipe.id,
          is_auto_generated: true
        })
        .eq('id', existingPlan.id);
      
      if (updateError) {
        console.error("Error updating meal_plan:", updateError);
      }
    } else {
      const { error: insertError } = await supabase
        .from('meal_plans')
        .insert({
          profile_id: profileId,
          child_id: childId,
          recipe_id: savedRecipe.id,
          date: date,
          meal_time: mealType,
          is_auto_generated: true
        });
      
      if (insertError) {
        console.error("Error inserting meal_plan:", insertError);
      }
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
