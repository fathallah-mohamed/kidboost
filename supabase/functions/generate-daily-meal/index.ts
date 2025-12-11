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
    const { childId, profileId, mealType, date, context, busyParentMode = true } = await req.json();
    
    console.log("generate-daily-meal - Request:", { childId, profileId, mealType, date, context, busyParentMode });

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

    // BUSY PARENT MODE: Check for reusable recipes first
    if (busyParentMode) {
      console.log("Busy parent mode enabled - checking for reusable recipes");
      
      // Get recipes from last 3 days that can be reused
      const threeDaysAgo = new Date();
      threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
      
      const { data: reusableRecipes } = await supabase
        .from('recipes')
        .select('*')
        .eq('child_id', childId)
        .eq('meal_type', mealType)
        .gte('created_at', threeDaysAgo.toISOString())
        .order('created_at', { ascending: false });

      // Check meal plans to count how many times each recipe has been used
      const { data: recentMealPlans } = await supabase
        .from('meal_plans')
        .select('recipe_id, date')
        .eq('child_id', childId)
        .eq('meal_time', mealType)
        .gte('date', threeDaysAgo.toISOString().split('T')[0]);

      const recipeUsageCount: Record<string, number> = {};
      recentMealPlans?.forEach(plan => {
        recipeUsageCount[plan.recipe_id] = (recipeUsageCount[plan.recipe_id] || 0) + 1;
      });

      // Find a recipe that can still be reused (default max uses: snack=3, meals=2)
      const maxUses = mealType === 'snack' ? 3 : 2;
      
      for (const recipe of reusableRecipes || []) {
        const currentUses = recipeUsageCount[recipe.id] || 1;
        const recipeMaxUses = recipe.reuse_info?.total_uses || maxUses;
        
        if (currentUses < recipeMaxUses) {
          console.log(`Reusing recipe "${recipe.name}" (${currentUses}/${recipeMaxUses} uses)`);
          
          // Create meal plan entry for reuse
          const { data: existingPlan } = await supabase
            .from('meal_plans')
            .select('id')
            .eq('profile_id', profileId)
            .eq('child_id', childId)
            .eq('date', date)
            .eq('meal_time', mealType)
            .maybeSingle();

          if (existingPlan) {
            await supabase
              .from('meal_plans')
              .update({ recipe_id: recipe.id, is_auto_generated: true })
              .eq('id', existingPlan.id);
          } else {
            await supabase
              .from('meal_plans')
              .insert({
                profile_id: profileId,
                child_id: childId,
                recipe_id: recipe.id,
                date: date,
                meal_time: mealType,
                is_auto_generated: true
              });
          }

          return new Response(
            JSON.stringify({ 
              success: true, 
              recipe: { ...recipe, is_reuse: true, remaining_uses: recipeMaxUses - currentUses - 1 },
              message: `Réutilisation de "${recipe.name}" (${currentUses + 1}/${recipeMaxUses})`,
              isReuse: true
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
      }
      console.log("No reusable recipe found, generating new one with batch cooking focus");
    }

    // Get recent recipes for this child to avoid duplicates (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const { data: recentRecipes } = await supabase
      .from('recipes')
      .select('name, meal_type')
      .eq('child_id', childId)
      .eq('meal_type', mealType)
      .gte('created_at', thirtyDaysAgo.toISOString())
      .order('created_at', { ascending: false })
      .limit(20);

    const recentRecipeNames = recentRecipes?.map(r => r.name) || [];
    console.log(`Found ${recentRecipeNames.length} recent ${mealType} recipes to avoid`);

    // Get all-time most used recipes for variety
    const { data: frequentRecipes } = await supabase
      .from('meal_statistics')
      .select('recipes(name)')
      .eq('child_id', childId)
      .order('frequency', { ascending: false })
      .limit(10);

    const frequentRecipeNames = frequentRecipes
      ?.map(r => (r.recipes as any)?.name)
      .filter(Boolean) || [];

    // Combine all recipes to exclude
    const recipesToExclude = [...new Set([...recentRecipeNames, ...frequentRecipeNames])];

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
    
    const dislikes = (child.dislikes || []).filter(Boolean).join(", ");
    const mealObjectives = (child.meal_objectives || []).filter(Boolean).join(", ");
    
    const availableTime = context?.availableTime || child.available_time || 20;
    const equipment = context?.equipment?.length > 0 ? context.equipment.join(", ") : (child.materiel_disponible || []).filter(Boolean).join(", ");
    const difficulty = child.difficulte_souhaitee || 'facile';
    const parentStyle = context?.parentStyle?.length > 0 ? context.parentStyle.join(", ") : "";
    const familyAllergens = context?.familyAllergens?.length > 0 ? context.familyAllergens.join(", ") : "";

    // Get current month for seasonality
    const currentMonth = new Date().getMonth() + 1;
    const seasonLabels: Record<number, string> = {
      1: 'hiver', 2: 'hiver', 3: 'printemps', 4: 'printemps', 5: 'printemps',
      6: 'été', 7: 'été', 8: 'été', 9: 'automne', 10: 'automne', 11: 'automne', 12: 'hiver'
    };
    const currentSeason = seasonLabels[currentMonth];

    // Meal type labels and specific instructions
    const mealConfigs: Record<string, { label: string; instructions: string; examples: string }> = {
      'breakfast': {
        label: 'petit-déjeuner',
        instructions: 'Recette simple et rapide pour bien commencer la journée. Énergétique et équilibrée.',
        examples: 'Exemples variés: pancakes aux fruits, smoothie bowl, tartines créatives, œufs brouillés, porridge aux fruits, crêpes légères, muffins maison, yaourt granola maison',
      },
      'lunch': {
        label: 'déjeuner',
        instructions: 'Repas complet et équilibré pour le midi. Doit inclure protéines, légumes et féculents.',
        examples: 'Exemples variés: gratin de légumes, pâtes au pesto maison, riz sauté aux légumes, quiche aux légumes, curry doux, risotto, tajine doux, wok de nouilles',
      },
      'snack': {
        label: 'goûter',
        instructions: 'Encas léger et gourmand pour l\'après-midi. Apporter de l\'énergie sans être trop sucré.',
        examples: 'Exemples variés: brochettes de fruits, muffins aux pommes, compote maison, crackers au fromage, smoothie, energy balls, pain perdu, banana bread',
      },
      'dinner': {
        label: 'dîner',
        instructions: 'Repas du soir équilibré mais léger pour bien dormir. Favoriser les légumes et protéines légères.',
        examples: 'Exemples variés: soupe veloutée, omelette aux légumes, poisson en papillote, gratin léger, salade composée, pasta légère, poulet grillé aux légumes',
      },
    };

    const mealConfig = mealConfigs[mealType] || { label: 'repas', instructions: '', examples: '' };
    let specificInstructions = mealConfig.instructions;
    let mealExamples = mealConfig.examples;

    // Lunchbox specific constraints
    if (context?.isLunchbox) {
      if (context.lunchboxType === 'school_trip') {
        specificInstructions = `
CONTRAINTES STRICTES - PIQUE-NIQUE SORTIE SCOLAIRE:
- Repas 100% froid, aucune cuisson nécessaire sur place
- Facilement transportable dans un sac à dos
- Consommable sans couverts de préférence
- Portions adaptées à un enfant qui va marcher et se dépenser`;
        mealExamples = 'Exemples: sandwich au poulet, wrap au thon, salade de pâtes froide, mini quiche froide, cake salé, crudités avec houmous, fruits frais, compote à boire, biscuits maison';
      } else {
        specificInstructions = `
CONTRAINTES STRICTES - LUNCHBOX RÉGIME SPÉCIAL:
- Repas froid ou tiède, parfaitement transportable
- RESPECT ABSOLU des allergies et restrictions
- Consommable facilement à l'école sans réchauffage
- Nutritif et rassasiant`;
        mealExamples = 'Exemples: salade composée protéinée, wrap sans allergène, bento équilibré, sandwich maison adapté, taboulé de quinoa, salade de lentilles';
      }
    }

    // Build exclusion list for prompt
    const exclusionText = recipesToExclude.length > 0 
      ? `\n\n⚠️ RECETTES À NE PAS REPRODUIRE (déjà préparées récemment):\n${recipesToExclude.map(r => `- ${r}`).join('\n')}\nTu DOIS proposer une recette DIFFÉRENTE de celles listées ci-dessus.`
      : '';

    // Busy parent mode instructions
    const busyParentInstructions = busyParentMode ? `
🏃 MODE PARENT PRESSÉ ACTIVÉ:
- Cette recette DOIT pouvoir être réutilisée ${mealType === 'snack' ? '3 fois' : '2 fois'} dans la semaine
- Privilégie le BATCH COOKING: préparer une fois, manger plusieurs fois
- Indique clairement comment conserver et réchauffer
- Temps de préparation minimal, résultat maximal
- Les goûters doivent pouvoir durer 2-3 jours (cake, muffins, biscuits maison)
- Les plats doivent bien se réchauffer ou se manger froids` : '';

    const prompt = `Crée une recette ORIGINALE et UNIQUE de ${mealConfig.label} pour ${child.name}, ${childAge} ans.

🎯 OBJECTIF: Préparer un repas que ${child.name} va ADORER tout en respectant ses contraintes.
${busyParentInstructions}

📋 INSTRUCTIONS SPÉCIFIQUES:
${specificInstructions}

💡 INSPIRATIONS (ne pas reproduire exactement, s'en inspirer pour innover):
${mealExamples}

⏱️ CONTRAINTES DE PRÉPARATION:
- Temps max: ${availableTime} minutes
- Difficulté souhaitée: ${difficulty}
${equipment ? `- Matériel disponible: ${equipment}` : ''}

🚫 ALLERGIES & RESTRICTIONS (ABSOLUMENT À RESPECTER):
${allergies ? `- ALLERGIES CRITIQUES: ${allergies}` : '- Aucune allergie connue'}
${familyAllergens ? `- Allergènes famille: ${familyAllergens}` : ''}
${restrictions ? `- Restrictions: ${restrictions}` : ''}
${dislikes ? `- Aliments que ${child.name} n'aime PAS: ${dislikes}` : ''}

❤️ PRÉFÉRENCES DE ${child.name.toUpperCase()}:
${preferences ? `- Aliments préférés: ${preferences}` : '- Pas de préférences spécifiques'}
${mealObjectives ? `- Objectifs nutritionnels: ${mealObjectives}` : ''}
${parentStyle ? `- Style de cuisine familial: ${parentStyle}` : ''}

🌿 SAISONNALITÉ:
- Nous sommes en ${currentSeason}, privilégie les ingrédients de saison
${exclusionText}

✨ CRITÈRES DE QUALITÉ:
- Nom FUN et ATTRAYANT pour un enfant (évite les noms génériques comme "Salade de...")
- Présentation visuelle adaptée aux enfants (couleurs, formes)
- Équilibre nutritionnel
- Instructions simples et claires
${busyParentMode ? '- OBLIGATOIRE: Indique comment conserver et combien de fois réutiliser' : ''}`;

    console.log("Calling AI with enhanced prompt for unique recipe");
    console.log("Excluding recipes:", recipesToExclude.slice(0, 5).join(", "), recipesToExclude.length > 5 ? `... and ${recipesToExclude.length - 5} more` : "");

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
            content: `Tu es un chef cuisinier créatif spécialisé dans les repas pour enfants.

RÈGLES ABSOLUES:
1. Chaque recette doit être UNIQUE - ne jamais proposer deux fois le même plat
2. Les noms de recettes doivent être FUN et ORIGINAUX pour plaire aux enfants
3. RESPECTER ABSOLUMENT les allergies et restrictions mentionnées
4. Utiliser les ingrédients de SAISON quand mentionnés
5. Adapter la difficulté et le temps de préparation aux contraintes données
6. Privilégier les aliments que l'enfant AIME et éviter ceux qu'il n'aime pas

Tu retournes UNIQUEMENT le résultat via l'outil create_recipe. Sois créatif dans les noms!`
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
            description: "Crée une recette adaptée à l'enfant avec infos de conservation",
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
                tips: { type: "string", description: "Conseil pour les parents" },
                reuse_info: {
                  type: "object",
                  description: "Infos de réutilisation pour parents pressés",
                  properties: {
                    total_uses: { type: "number", description: "Nombre de fois que cette recette peut servir (2-4)" },
                    best_days: { type: "array", items: { type: "string" }, description: "Meilleurs jours pour réutiliser (J+1, J+2, etc)" },
                    reuse_tips: { type: "string", description: "Conseils pour réutiliser (réchauffer, manger froid, etc)" }
                  }
                },
                storage_info: {
                  type: "object",
                  description: "Comment conserver cette préparation",
                  properties: {
                    method: { type: "string", enum: ["fridge", "freezer", "room_temp"], description: "Méthode de conservation" },
                    duration_days: { type: "number", description: "Durée de conservation en jours" },
                    container: { type: "string", description: "Type de contenant recommandé" },
                    tips: { type: "string", description: "Conseils de conservation" }
                  }
                },
                is_batch_cooking: { type: "boolean", description: "Si cette recette est adaptée au batch cooking" }
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

    // Default reuse info based on meal type if not provided
    const defaultReuseInfo = {
      total_uses: mealType === 'snack' ? 3 : 2,
      best_days: mealType === 'snack' ? ['J+1', 'J+2'] : ['J+1'],
      reuse_tips: mealType === 'snack' ? 'Se conserve dans une boîte hermétique' : 'Réchauffer au micro-ondes ou manger froid'
    };

    const defaultStorageInfo = {
      method: 'fridge' as const,
      duration_days: mealType === 'snack' ? 3 : 2,
      container: 'Boîte hermétique',
      tips: 'Conserver au réfrigérateur'
    };

    // Save recipe to database with reuse info
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
        servings: recipeData.reuse_info?.total_uses || defaultReuseInfo.total_uses,
        max_prep_time: availableTime,
        source: 'ia',
        allergens: allergies ? allergies.split(", ") : [],
        dietary_preferences: restrictions ? restrictions.split(", ") : [],
        health_benefits: JSON.stringify([
          ...(recipeData.reuse_info ? [{
            icon: '🔄',
            category: 'reuse',
            description: `Peut servir ${recipeData.reuse_info.total_uses || defaultReuseInfo.total_uses} fois`
          }] : []),
          ...(recipeData.storage_info ? [{
            icon: '❄️',
            category: 'storage',
            description: `Conservation: ${recipeData.storage_info.duration_days || defaultStorageInfo.duration_days} jours`
          }] : []),
          ...(recipeData.is_batch_cooking ? [{
            icon: '👨‍🍳',
            category: 'batch',
            description: 'Parfait pour le batch cooking'
          }] : [])
        ])
      })
      .select()
      .single();

    // Add reuse and storage info to the response
    const recipeWithReuseInfo = savedRecipe ? {
      ...savedRecipe,
      reuse_info: recipeData.reuse_info || defaultReuseInfo,
      storage_info: recipeData.storage_info || defaultStorageInfo,
      is_batch_cooking: recipeData.is_batch_cooking || false
    } : null;

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

    console.log("Successfully created meal:", savedRecipe.name, "with reuse info:", recipeData.reuse_info);

    return new Response(
      JSON.stringify({ 
        success: true, 
        recipe: recipeWithReuseInfo,
        message: `Recette "${savedRecipe.name}" générée - peut servir ${recipeData.reuse_info?.total_uses || defaultReuseInfo.total_uses} fois`,
        reuseInfo: recipeData.reuse_info || defaultReuseInfo,
        storageInfo: recipeData.storage_info || defaultStorageInfo
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
