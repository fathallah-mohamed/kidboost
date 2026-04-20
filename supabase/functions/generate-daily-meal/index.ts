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
    const { 
      childId, 
      profileId, 
      mealType, 
      date, 
      context, 
      busyParentMode = true,
      planningPreferences,
      aiProvider
    } = await req.json();
    const provider: 'lovable' | 'perplexity' = aiProvider === 'perplexity' ? 'perplexity' : 'lovable';
    
    console.log("generate-daily-meal - Request:", { childId, profileId, mealType, date, context, busyParentMode, planningPreferences });

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

    // Get parent preferences for planning
    const { data: profileData } = await supabase
      .from('profiles')
      .select('preferences_parent')
      .eq('id', profileId)
      .single();

    const parentPrefs = profileData?.preferences_parent as any || {};
    const cookingFrequency = planningPreferences?.cooking_frequency || parentPrefs.cooking_frequency || 'every_2_days';
    const reuseLevel = planningPreferences?.reuse_level ?? parentPrefs.reuse_level ?? 'auto';
    const includeWeekend = planningPreferences?.include_weekend ?? parentPrefs.include_weekend ?? true;

    console.log("Planning preferences:", { cookingFrequency, reuseLevel, includeWeekend });

    // Calculer le nombre max de réutilisations selon le type de repas
    const getDefaultMaxUses = (type: string): number => {
      switch (type) {
        case 'snack': return 4; // Gâteaux, muffins peuvent durer plus
        case 'breakfast': return 3; // Pancakes, muffins petit-déj
        case 'lunch': 
        case 'dinner': return 2; // Plats chauds
        default: return 2;
      }
    };

    // Calculer le repeat_count réel
    const calculateRepeatCount = (portionEstimate: number): number => {
      if (reuseLevel === 'auto') {
        return portionEstimate;
      }
      return Math.min(Number(reuseLevel), portionEstimate);
    };

    // BUSY PARENT MODE: Check for reusable recipes first
    if (busyParentMode && reuseLevel !== 0) {
      console.log("Busy parent mode enabled - checking for reusable recipes");
      
      // Get recipes from last 5 days that can be reused
      const daysToCheck = reuseLevel === 'auto' ? 5 : Math.min(Number(reuseLevel) + 2, 5);
      const checkDate = new Date();
      checkDate.setDate(checkDate.getDate() - daysToCheck);
      
      const { data: reusableRecipes } = await supabase
        .from('recipes')
        .select('*')
        .eq('child_id', childId)
        .eq('meal_type', mealType)
        .gte('created_at', checkDate.toISOString())
        .order('created_at', { ascending: false });

      // Check meal plans to count how many times each recipe has been used
      const { data: recentMealPlans } = await supabase
        .from('meal_plans')
        .select('recipe_id, date')
        .eq('child_id', childId)
        .eq('meal_time', mealType)
        .gte('date', checkDate.toISOString().split('T')[0]);

      const recipeUsageCount: Record<string, number> = {};
      recentMealPlans?.forEach(plan => {
        recipeUsageCount[plan.recipe_id] = (recipeUsageCount[plan.recipe_id] || 0) + 1;
      });

      // Calculer max uses selon les préférences
      const defaultMaxUses = getDefaultMaxUses(mealType);
      
      for (const recipe of reusableRecipes || []) {
        const currentUses = recipeUsageCount[recipe.id] || 1;
        const recipePortionEstimate = recipe.servings || defaultMaxUses;
        const maxUses = calculateRepeatCount(recipePortionEstimate);
        
        if (currentUses < maxUses) {
          console.log(`Reusing recipe "${recipe.name}" (${currentUses}/${maxUses} uses)`);
          
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
              recipe: { 
                ...recipe, 
                is_reuse: true, 
                remaining_uses: maxUses - currentUses - 1,
                portion_usage_estimate: recipePortionEstimate,
                repeat_count: maxUses
              },
              message: `Réutilisation de "${recipe.name}" (${currentUses + 1}/${maxUses})`,
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

    // Busy parent mode instructions - enrichi avec les préférences
    const busyParentInstructions = busyParentMode ? `
🏃 MODE PARENT PRESSÉ ACTIVÉ:
- Fréquence de cuisine du parent: ${cookingFrequency === 'once_a_week' ? 'Batch cooking (1x/semaine)' : cookingFrequency === 'twice_a_week' ? '2 fois par semaine' : cookingFrequency === 'every_2_days' ? 'Tous les 2 jours' : 'Quotidien'}
- Niveau de réutilisation: ${reuseLevel === 'auto' ? 'Automatique selon le plat' : `${Number(reuseLevel) + 1} repas par préparation`}
${!includeWeekend ? '- ATTENTION: Ne pas planifier le week-end (Lundi-Vendredi uniquement)' : ''}

RÈGLES DE RÉUTILISATION:
- Cette recette DOIT pouvoir servir ${mealType === 'snack' ? '3-4 fois' : '2-3 fois'} dans la semaine
- Privilégie le BATCH COOKING: préparer une fois, manger plusieurs fois
- Indique clairement combien de fois le plat peut être réutilisé (portion_usage_estimate)
- Indique comment conserver et réchauffer
- Les goûters doivent pouvoir durer 2-3 jours (cake, muffins, biscuits maison)
- Les plats doivent bien se réchauffer ou se manger froids

IMPORTANT: Retourne toujours "portion_usage_estimate" avec le nombre de fois que cette recette peut servir.` : '';

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
    const PERPLEXITY_API_KEY = Deno.env.get('PERPLEXITY_API_KEY');

    if (provider === 'lovable' && !LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }
    if (provider === 'perplexity' && !PERPLEXITY_API_KEY) {
      throw new Error("Perplexity n'est pas configuré. Connectez Perplexity dans les paramètres ou choisissez Lovable AI.");
    }

    console.log(`Calling AI provider: ${provider}`);

    const systemPrompt = `Tu es un chef cuisinier créatif spécialisé dans les repas pour enfants.

RÈGLES ABSOLUES:
1. Chaque recette doit être UNIQUE
2. Les noms de recettes doivent être FUN et ORIGINAUX
3. RESPECTER ABSOLUMENT les allergies et restrictions
4. Utiliser les ingrédients de SAISON
5. Adapter difficulté et temps de préparation aux contraintes
6. Privilégier les aliments aimés et éviter ceux non aimés`;

    let recipeData: any;

    if (provider === 'perplexity') {
      const jsonPrompt = `${prompt}

IMPORTANT: Réponds UNIQUEMENT avec un objet JSON valide, sans markdown, sans texte autour. Format:
{
  "name": "...",
  "ingredients": [{"item":"...","quantity":"...","unit":"..."}],
  "instructions": ["..."],
  "preparation_time": 20,
  "nutritional_info": {"calories":0,"protein":0,"carbs":0,"fat":0,"fiber":0},
  "tips": "...",
  "reuse_info": {"total_uses": 2, "best_days": ["J+1"], "reuse_tips": "..."},
  "storage_info": {"method": "fridge", "duration_days": 2, "container": "...", "tips": "..."},
  "is_batch_cooking": false,
  "portion_usage_estimate": 2
}`;

      const ppxResponse = await fetch('https://api.perplexity.ai/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${PERPLEXITY_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'sonar',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: jsonPrompt }
          ],
          temperature: 0.7,
        }),
      });

      if (!ppxResponse.ok) {
        const errorText = await ppxResponse.text();
        throw new Error(`Erreur Perplexity (${ppxResponse.status}): ${errorText}`);
      }
      const ppxData = await ppxResponse.json();
      const content = ppxData.choices?.[0]?.message?.content || '';
      const fenced = content.match(/```(?:json)?\s*([\s\S]*?)```/);
      const jsonText = (fenced ? fenced[1] : content).match(/\{[\s\S]*\}/)?.[0] || content;
      try {
        recipeData = JSON.parse(jsonText);
      } catch {
        console.error("Perplexity raw content:", content);
        throw new Error("Réponse Perplexity non parsable");
      }
    } else {
      const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${LOVABLE_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'google/gemini-2.5-flash',
          messages: [
            { role: 'system', content: systemPrompt + "\n\nTu retournes UNIQUEMENT le résultat via l'outil create_recipe." },
            { role: 'user', content: prompt }
          ],
          tools: [{
            type: "function",
            function: {
              name: "create_recipe",
              description: "Crée une recette adaptée à l'enfant avec infos de conservation",
              parameters: {
                type: "object",
                properties: {
                  name: { type: "string" },
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
                  instructions: { type: "array", items: { type: "string" } },
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
                  },
                  tips: { type: "string" },
                  reuse_info: {
                    type: "object",
                    properties: {
                      total_uses: { type: "number" },
                      best_days: { type: "array", items: { type: "string" } },
                      reuse_tips: { type: "string" }
                    }
                  },
                  storage_info: {
                    type: "object",
                    properties: {
                      method: { type: "string", enum: ["fridge", "freezer", "room_temp"] },
                      duration_days: { type: "number" },
                      container: { type: "string" },
                      tips: { type: "string" }
                    }
                  },
                  is_batch_cooking: { type: "boolean" },
                  portion_usage_estimate: { type: "number" }
                },
                required: ["name", "ingredients", "instructions", "preparation_time", "nutritional_info", "portion_usage_estimate"]
              }
            }
          }],
          tool_choice: { type: "function", function: { name: "create_recipe" } }
        }),
      });

      if (!aiResponse.ok) {
        const errorText = await aiResponse.text();
        console.error("AI Gateway error:", aiResponse.status, errorText);
        if (aiResponse.status === 429) throw new Error("Trop de requêtes, réessayez dans quelques instants");
        if (aiResponse.status === 402) throw new Error("Crédits IA insuffisants, veuillez recharger");
        throw new Error(`Erreur IA: ${aiResponse.status}`);
      }

      const aiData = await aiResponse.json();
      if (aiData.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments) {
        recipeData = JSON.parse(aiData.choices[0].message.tool_calls[0].function.arguments);
      } else {
        console.error("Invalid AI response structure:", JSON.stringify(aiData, null, 2));
        throw new Error("Réponse IA invalide, veuillez réessayer");
      }
    }

    // Calculer portion_usage_estimate et repeat_count
    const portionUsageEstimate = recipeData.portion_usage_estimate || getDefaultMaxUses(mealType);
    const repeatCount = calculateRepeatCount(portionUsageEstimate);

    // Default reuse info based on meal type and preferences
    const defaultReuseInfo = {
      total_uses: repeatCount,
      best_days: Array.from({ length: repeatCount - 1 }, (_, i) => `J+${i + 1}`),
      reuse_tips: mealType === 'snack' ? 'Se conserve dans une boîte hermétique' : 'Réchauffer au micro-ondes ou manger froid'
    };

    const defaultStorageInfo = {
      method: 'fridge' as const,
      duration_days: Math.max(repeatCount, mealType === 'snack' ? 3 : 2),
      container: 'Boîte hermétique',
      tips: 'Conserver au réfrigérateur'
    };

    // Build health benefits array - use valid categories from DB constraint:
    // 'cognitive', 'energy', 'satiety', 'digestive', 'immunity', 'growth', 'mental', 'organs', 'beauty', 'physical', 'prevention', 'global'
    // Note: reuse/storage/batch info is stored separately in the response, not in health_benefits
    const healthBenefitsArray: Array<{icon: string, category: string, description: string}> = [];

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
        servings: repeatCount,
        max_prep_time: availableTime,
        source: 'ia',
        allergens: allergies ? allergies.split(", ") : [],
        dietary_preferences: restrictions ? restrictions.split(", ") : [],
        health_benefits: healthBenefitsArray
      })
      .select()
      .single();

    // Add reuse and storage info to the response
    const recipeWithReuseInfo = savedRecipe ? {
      ...savedRecipe,
      reuse_info: recipeData.reuse_info || defaultReuseInfo,
      storage_info: recipeData.storage_info || defaultStorageInfo,
      is_batch_cooking: recipeData.is_batch_cooking || false,
      portion_usage_estimate: portionUsageEstimate,
      repeat_count: repeatCount
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

    console.log("Successfully created meal:", savedRecipe.name, 
      "portion_usage_estimate:", portionUsageEstimate, 
      "repeat_count:", repeatCount,
      "reuse_info:", recipeData.reuse_info);

    return new Response(
      JSON.stringify({ 
        success: true, 
        recipe: recipeWithReuseInfo,
        message: `Recette "${savedRecipe.name}" générée - peut servir ${repeatCount} fois`,
        reuseInfo: recipeData.reuse_info || defaultReuseInfo,
        storageInfo: recipeData.storage_info || defaultStorageInfo,
        portionUsageEstimate,
        repeatCount,
        planningPreferences: { cookingFrequency, reuseLevel, includeWeekend }
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
