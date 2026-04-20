import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const normalizeMealType = (mealType: string): string => {
  const mealTypes: Record<string, string> = {
    'breakfast': 'petit-déjeuner',
    'lunch': 'déjeuner',
    'dinner': 'dîner',
    'snack': 'goûter',
    'all': 'tous'
  };
  return mealTypes[mealType] || 'petit-déjeuner';
};

const normalizeDifficulty = (difficulty: string): string => {
  const difficulties: Record<string, string> = {
    'easy': 'facile',
    'medium': 'moyen',
    'hard': 'difficile',
    'all': 'tous'
  };
  return difficulties[difficulty] || 'facile';
};

// Try to extract a JSON array from the model response (handles markdown fences, prose around it).
const extractJsonArray = (str: string): string => {
  const fenced = str.match(/```(?:json)?\s*([\s\S]*?)```/);
  const candidate = fenced ? fenced[1] : str;
  const match = candidate.match(/\[\s*\{[\s\S]*\}\s*\]/);
  return (match ? match[0] : candidate).trim();
};

const validateRecipeStructure = (recipe: any): boolean => {
  if (!recipe || typeof recipe !== 'object') return false;
  if (!recipe.name || typeof recipe.name !== 'string') return false;
  if (!Array.isArray(recipe.ingredients)) return false;
  if (!Array.isArray(recipe.instructions)) return false;
  if (!recipe.nutritional_info || typeof recipe.nutritional_info !== 'object') return false;
  return true;
};

type AIProvider = 'lovable' | 'perplexity';

const callLovableAI = async (systemPrompt: string, userPrompt: string) => {
  const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
  if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY non configurée");

  const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${LOVABLE_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'google/gemini-2.5-flash',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    if (response.status === 429) throw new Error("Trop de requêtes vers Lovable AI, réessayez dans un instant");
    if (response.status === 402) throw new Error("Crédits Lovable AI insuffisants. Rechargez votre espace de travail.");
    throw new Error(`Erreur Lovable AI (${response.status}): ${errorText}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content || '';
};

const callPerplexity = async (systemPrompt: string, userPrompt: string) => {
  const PERPLEXITY_API_KEY = Deno.env.get('PERPLEXITY_API_KEY');
  if (!PERPLEXITY_API_KEY) {
    throw new Error("Perplexity n'est pas configuré. Connectez Perplexity dans les paramètres ou choisissez Lovable AI.");
  }

  const response = await fetch('https://api.perplexity.ai/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${PERPLEXITY_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'sonar',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.7,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Erreur Perplexity (${response.status}): ${errorText}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content || '';
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { child, filters, aiProvider } = await req.json();
    const provider: AIProvider = aiProvider === 'perplexity' ? 'perplexity' : 'lovable';

    if (!child || !child.birth_date) {
      throw new Error("Les informations de l'enfant sont requises");
    }

    const childAge = new Date().getFullYear() - new Date(child.birth_date).getFullYear();
    const normalizedMealType = normalizeMealType(filters?.mealType || 'breakfast');
    const normalizedDifficulty = normalizeDifficulty(filters?.difficulty || 'easy');

    const dietaryRestrictions = child.allergies?.filter(Boolean).join(", ") || "";
    const dietaryPreferences = child.preferences?.filter(Boolean).join(", ") || "";
    const maxPrepTime = filters?.maxPrepTime || 30;
    const randomSeed = Math.floor(Math.random() * 10000);

    const systemPrompt = "Tu es un chef cuisinier français spécialisé dans les recettes pour enfants. Tu réponds UNIQUEMENT avec un tableau JSON valide, sans markdown, sans texte autour.";

    const userPrompt = `Génère 5 recettes de ${normalizedMealType} pour un enfant de ${childAge} ans (seed ${randomSeed}).

Format JSON requis (réponds UNIQUEMENT avec le tableau JSON):
[
  {
    "name": "Nom de la recette",
    "ingredients": [{ "item": "Ingrédient", "quantity": "quantité", "unit": "unité" }],
    "instructions": ["étape 1", "étape 2"],
    "nutritional_info": { "calories": 0, "protein": 0, "carbs": 0, "fat": 0 },
    "meal_type": "${filters?.mealType || 'breakfast'}",
    "preparation_time": ${maxPrepTime},
    "difficulty": "${filters?.difficulty || 'easy'}",
    "servings": 1,
    "health_benefits": [{ "icon": "🥛", "category": "energy", "description": "description" }]
  }
]

Règles:
- Temps max: ${maxPrepTime} minutes
- Difficulté: ${normalizedDifficulty}
- Adapté aux enfants de ${childAge} ans
${dietaryRestrictions ? `- Allergies/restrictions: ${dietaryRestrictions}` : "- Pas d'allergies connues"}
${dietaryPreferences ? `- Préférences: ${dietaryPreferences}` : ""}
${filters?.includedIngredients?.length ? `- Doit inclure: ${filters.includedIngredients.join(', ')}` : ""}
${filters?.excludedIngredients?.length ? `- Ne doit pas inclure: ${filters.excludedIngredients.join(', ')}` : ""}
${filters?.healthBenefits?.length ? `- Bienfaits santé: ${filters.healthBenefits.join(', ')}` : ""}

Retourne UNIQUEMENT le JSON.`;

    console.log(`Calling AI provider: ${provider}`);
    const rawContent = provider === 'perplexity'
      ? await callPerplexity(systemPrompt, userPrompt)
      : await callLovableAI(systemPrompt, userPrompt);

    const cleaned = extractJsonArray(rawContent);
    let recipes;
    try {
      recipes = JSON.parse(cleaned);
    } catch (e) {
      console.error("Parse error. Raw content:", rawContent);
      throw new Error("Réponse IA non parsable en JSON");
    }

    if (!Array.isArray(recipes) || recipes.length === 0) {
      throw new Error("Aucune recette générée");
    }

    recipes.forEach((recipe, index) => {
      if (!validateRecipeStructure(recipe)) {
        throw new Error(`Structure de recette invalide à l'index ${index}`);
      }
    });

    const processedRecipes = recipes.map((recipe, index) => ({
      id: crypto.randomUUID(),
      name: String(recipe.name || `Recette ${index + 1}`),
      ingredients: (Array.isArray(recipe.ingredients) ? recipe.ingredients : []).map((ing: any) => ({
        item: String(ing.item || ''),
        quantity: String(ing.quantity || ''),
        unit: String(ing.unit || '')
      })),
      instructions: Array.isArray(recipe.instructions) ? recipe.instructions.map(String) : [],
      nutritional_info: {
        calories: Number(recipe.nutritional_info?.calories) || 0,
        protein: Number(recipe.nutritional_info?.protein) || 0,
        carbs: Number(recipe.nutritional_info?.carbs) || 0,
        fat: Number(recipe.nutritional_info?.fat) || 0
      },
      meal_type: filters?.mealType || 'breakfast',
      preparation_time: Number(recipe.preparation_time) || maxPrepTime,
      difficulty: recipe.difficulty || 'easy',
      servings: Number(recipe.servings) || 2,
      is_generated: true,
      profile_id: child.profile_id,
      child_id: child.id,
      health_benefits: (Array.isArray(recipe.health_benefits) ? recipe.health_benefits : []).map((b: any) => ({
        icon: String(b.icon || '🍳'),
        category: String(b.category || 'energy'),
        description: String(b.description || '')
      })),
      image_url: 'https://images.unsplash.com/photo-1618160702438-9b02ab6515c9',
      min_age: childAge - 2,
      max_age: childAge + 2,
      dietary_preferences: child.preferences || [],
      allergens: child.allergies || [],
      cost_estimate: 0,
      seasonal_months: [1,2,3,4,5,6,7,8,9,10,11,12],
      source: provider === 'perplexity' ? 'perplexity' : 'lovable_ai',
      auto_generated: true
    }));

    return new Response(
      JSON.stringify({ recipes: processedRecipes, provider }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error("Error in generate-recipe:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
