import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { 
  Sparkles, 
  Search, 
  PenLine, 
  Clock, 
  ChefHat, 
  Loader2,
  Check
} from "lucide-react";
import { MealOptionType, MEAL_OPTIONS } from "./MealOptionCard";
import { toast } from "sonner";

interface Recipe {
  id: string;
  name: string;
  preparation_time: number;
  meal_type: string;
  difficulty: string;
}

interface GenerateMealDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mealType: MealOptionType | null;
  date: string;
  userId: string;
  childId: string;
  childName: string;
  childProfile: {
    allergies: string[];
    restrictions: string[];
    preferences: string[];
    availableTime: number;
    equipment: string[];
  };
  parentPreferences: {
    style: string[];
    difficulty: string;
    allergens: string[];
    equipment: string[];
  } | null;
  onSuccess: () => void;
}

export function GenerateMealDialog({
  open,
  onOpenChange,
  mealType,
  date,
  userId,
  childId,
  childName,
  childProfile,
  parentPreferences,
  onSuccess,
}: GenerateMealDialogProps) {
  const [activeTab, setActiveTab] = useState("generate");
  const [generating, setGenerating] = useState(false);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loadingRecipes, setLoadingRecipes] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [saving, setSaving] = useState(false);
  
  // Manual recipe form
  const [manualRecipe, setManualRecipe] = useState({
    name: "",
    description: "",
    prepTime: "15",
    ingredients: "",
  });

  const mealOption = mealType ? MEAL_OPTIONS[mealType] : null;
  
  // Map meal type to actual database meal_type
  const getDbMealType = (type: MealOptionType): string => {
    if (type === 'lunchbox_special' || type === 'lunchbox_trip') {
      return 'lunch';
    }
    return type;
  };

  const isLunchbox = mealType === 'lunchbox_special' || mealType === 'lunchbox_trip';

  useEffect(() => {
    if (open && mealType) {
      fetchRecipes();
    }
  }, [open, mealType]);

  const fetchRecipes = async () => {
    setLoadingRecipes(true);
    const dbMealType = mealType ? getDbMealType(mealType) : null;
    
    let query = supabase
      .from("recipes")
      .select("id, name, preparation_time, meal_type, difficulty")
      .eq("profile_id", userId)
      .order("name");

    if (dbMealType) {
      query = query.eq("meal_type", dbMealType);
    }

    const { data, error } = await query.limit(50);

    if (!error && data) {
      setRecipes(data);
    }
    setLoadingRecipes(false);
  };

  const handleGenerate = async () => {
    if (!mealType) return;
    
    setGenerating(true);
    try {
      const lunchboxContext = isLunchbox ? {
        isLunchbox: true,
        lunchboxType: mealType === 'lunchbox_trip' ? 'school_trip' : 'special_diet',
        constraints: mealType === 'lunchbox_trip' 
          ? "Pique-nique pour sortie scolaire: sandwich, wrap, salade froide, fruit, aucune cuisson nécessaire, facilement transportable"
          : "Lunchbox adaptée au régime spécial: repas froid ou tiède, transportable, respecte strictement les restrictions alimentaires"
      } : null;

      const { data, error } = await supabase.functions.invoke("generate-daily-meal", {
        body: {
          childId,
          profileId: userId,
          mealType: getDbMealType(mealType),
          date,
          context: {
            allergies: childProfile.allergies,
            restrictions: childProfile.restrictions,
            preferences: childProfile.preferences,
            availableTime: childProfile.availableTime,
            equipment: [...(childProfile.equipment || []), ...(parentPreferences?.equipment || [])],
            parentStyle: parentPreferences?.style,
            parentDifficulty: parentPreferences?.difficulty,
            familyAllergens: parentPreferences?.allergens,
            ...lunchboxContext,
          }
        },
      });

      if (error) throw error;
      
      toast.success("Recette générée et ajoutée au planning !");
      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      console.error("Error generating meal:", error);
      toast.error(error.message || "Erreur lors de la génération");
    } finally {
      setGenerating(false);
    }
  };

  const handleSelectRecipe = async (recipe: Recipe) => {
    setSaving(true);
    try {
      // Check if there's already a meal for this slot
      const { data: existing } = await supabase
        .from("meal_plans")
        .select("id")
        .eq("profile_id", userId)
        .eq("child_id", childId)
        .eq("date", date)
        .eq("meal_time", getDbMealType(mealType!))
        .maybeSingle();

      if (existing) {
        // Update existing
        const { error } = await supabase
          .from("meal_plans")
          .update({ recipe_id: recipe.id })
          .eq("id", existing.id);
        if (error) throw error;
      } else {
        // Insert new
        const { error } = await supabase
          .from("meal_plans")
          .insert({
            profile_id: userId,
            child_id: childId,
            date,
            meal_time: getDbMealType(mealType!),
            recipe_id: recipe.id,
          });
        if (error) throw error;
      }

      toast.success("Recette ajoutée au planning !");
      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error("Error selecting recipe:", error);
      toast.error("Erreur lors de l'ajout");
    } finally {
      setSaving(false);
    }
  };

  const handleSaveManual = async () => {
    if (!manualRecipe.name.trim()) {
      toast.error("Le nom de la recette est requis");
      return;
    }

    setSaving(true);
    try {
      // Create the recipe
      const { data: newRecipe, error: recipeError } = await supabase
        .from("recipes")
        .insert({
          name: manualRecipe.name,
          instructions: manualRecipe.description,
          preparation_time: parseInt(manualRecipe.prepTime) || 15,
          ingredients: manualRecipe.ingredients.split('\n').filter(Boolean).map(i => ({
            item: i.trim(),
            quantity: "1",
            unit: "unité"
          })),
          nutritional_info: { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 },
          meal_type: getDbMealType(mealType!),
          profile_id: userId,
          child_id: childId,
          difficulty: "easy",
          servings: 1,
          source: "manual",
        })
        .select()
        .single();

      if (recipeError) throw recipeError;

      // Add to meal plan
      const { error: planError } = await supabase
        .from("meal_plans")
        .insert({
          profile_id: userId,
          child_id: childId,
          date,
          meal_time: getDbMealType(mealType!),
          recipe_id: newRecipe.id,
        });

      if (planError) throw planError;

      toast.success("Recette créée et ajoutée au planning !");
      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error("Error saving manual recipe:", error);
      toast.error("Erreur lors de la création");
    } finally {
      setSaving(false);
    }
  };

  const filteredRecipes = recipes.filter((recipe) =>
    recipe.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {mealOption && <mealOption.icon className="w-5 h-5" />}
            {mealOption?.title}
          </DialogTitle>
          <p className="text-sm text-muted-foreground">
            Pour {childName} • {new Date(date).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
          </p>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="generate" className="text-xs">
              <Sparkles className="w-3 h-3 mr-1" />
              Générer
            </TabsTrigger>
            <TabsTrigger value="choose" className="text-xs">
              <Search className="w-3 h-3 mr-1" />
              Choisir
            </TabsTrigger>
            <TabsTrigger value="manual" className="text-xs">
              <PenLine className="w-3 h-3 mr-1" />
              Manuel
            </TabsTrigger>
          </TabsList>

          <TabsContent value="generate" className="flex-1 space-y-4">
            <Card className="p-4 bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <Sparkles className="w-5 h-5 text-primary mt-0.5" />
                  <div>
                    <h4 className="font-medium">Génération intelligente</h4>
                    <p className="text-sm text-muted-foreground">
                      La recette sera adaptée automatiquement aux allergies, restrictions et préférences de {childName}.
                    </p>
                  </div>
                </div>

                {isLunchbox && (
                  <div className="bg-background/80 rounded-lg p-3 text-sm">
                    <p className="font-medium text-amber-600 dark:text-amber-400">
                      🧺 Contraintes lunchbox actives
                    </p>
                    <p className="text-muted-foreground mt-1">
                      {mealType === 'lunchbox_trip' 
                        ? "Repas froid, transportable, type pique-nique (sandwich, wrap, salade...)"
                        : "Repas adapté au régime spécial, froid ou tiède, facilement transportable"
                      }
                    </p>
                  </div>
                )}

                <Button 
                  onClick={handleGenerate} 
                  disabled={generating}
                  className="w-full"
                  size="lg"
                >
                  {generating ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Génération en cours...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 mr-2" />
                      Générer une recette
                    </>
                  )}
                </Button>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="choose" className="flex-1 flex flex-col overflow-hidden">
            <div className="relative mb-3">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher une recette..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>

            <ScrollArea className="flex-1">
              {loadingRecipes ? (
                <div className="text-center py-8 text-muted-foreground">Chargement...</div>
              ) : filteredRecipes.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  {searchQuery ? "Aucune recette trouvée" : "Aucune recette disponible pour ce type de repas"}
                </div>
              ) : (
                <div className="space-y-2 pr-4">
                  {filteredRecipes.map((recipe) => (
                    <button
                      key={recipe.id}
                      onClick={() => handleSelectRecipe(recipe)}
                      disabled={saving}
                      className="w-full p-3 rounded-lg border bg-card hover:bg-accent text-left transition-colors disabled:opacity-50"
                    >
                      <p className="font-medium text-sm">{recipe.name}</p>
                      <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {recipe.preparation_time} min
                        </span>
                        <span className="flex items-center gap-1">
                          <ChefHat className="w-3 h-3" />
                          {recipe.difficulty}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </ScrollArea>
          </TabsContent>

          <TabsContent value="manual" className="flex-1 overflow-auto">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nom de la recette *</Label>
                <Input
                  id="name"
                  placeholder="Ex: Sandwich jambon-fromage"
                  value={manualRecipe.name}
                  onChange={(e) => setManualRecipe({ ...manualRecipe, name: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description / Instructions</Label>
                <Textarea
                  id="description"
                  placeholder="Décrivez brièvement la recette..."
                  value={manualRecipe.description}
                  onChange={(e) => setManualRecipe({ ...manualRecipe, description: e.target.value })}
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="prepTime">Temps de préparation (minutes)</Label>
                <Input
                  id="prepTime"
                  type="number"
                  min="1"
                  max="180"
                  value={manualRecipe.prepTime}
                  onChange={(e) => setManualRecipe({ ...manualRecipe, prepTime: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="ingredients">Ingrédients (un par ligne)</Label>
                <Textarea
                  id="ingredients"
                  placeholder="Pain de mie&#10;Jambon&#10;Fromage&#10;Beurre"
                  value={manualRecipe.ingredients}
                  onChange={(e) => setManualRecipe({ ...manualRecipe, ingredients: e.target.value })}
                  rows={4}
                />
              </div>

              <Button 
                onClick={handleSaveManual} 
                disabled={saving || !manualRecipe.name.trim()}
                className="w-full"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Enregistrement...
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4 mr-2" />
                    Créer et ajouter au planning
                  </>
                )}
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
