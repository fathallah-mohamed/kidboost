import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { Search, Clock, ChefHat, Sparkles, Utensils, Loader2 } from "lucide-react";
import { MealSlot, MEAL_LABELS } from "@/lib/meals";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { toast } from "sonner";

interface Recipe {
  id: string;
  name: string;
  preparation_time: number;
  meal_type: string;
  difficulty: string;
}

interface AddRecipeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  date: string | null;
  slot: MealSlot | null;
  userId: string;
  childId: string | null;
  childName?: string;
  isCanteenOverride?: boolean;
  onSelectRecipe: (recipe: Recipe) => void;
  onRecipeGenerated?: () => void;
}

export function AddRecipeDialog({
  open,
  onOpenChange,
  date,
  slot,
  userId,
  childId,
  childName,
  isCanteenOverride = false,
  onSelectRecipe,
  onRecipeGenerated,
}: AddRecipeDialogProps) {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"generate" | "choose">("generate");
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    if (open && userId) {
      fetchRecipes();
      setActiveTab("generate");
      setSearchQuery("");
    }
  }, [open, userId, slot]);

  const fetchRecipes = async () => {
    setLoading(true);
    
    let query = supabase
      .from("recipes")
      .select("id, name, preparation_time, meal_type, difficulty")
      .eq("profile_id", userId)
      .order("created_at", { ascending: false });

    // Filter by meal type if possible
    if (slot && slot !== 'lunch') {
      query = query.eq("meal_type", slot);
    }

    const { data, error } = await query.limit(50);

    if (!error && data) {
      setRecipes(data);
    }
    setLoading(false);
  };

  const handleGenerateRecipe = async () => {
    if (!childId || !date || !slot) {
      toast.error("Informations manquantes pour générer");
      return;
    }

    setGenerating(true);
    
    try {
      // Fetch child data for context
      const { data: childData } = await supabase
        .from("children_profiles")
        .select("*")
        .eq("id", childId)
        .single();

      // Fetch parent preferences
      const { data: profileData } = await supabase
        .from("profiles")
        .select("preferences_parent")
        .eq("id", userId)
        .single();

      const parentPrefs = profileData?.preferences_parent as any || {};

      // Prepare context for generation
      const context = {
        allergies: childData?.allergies || [],
        restrictions: childData?.restrictions_alimentaires || [],
        preferences: childData?.aliments_preferes || [],
        dislikes: childData?.dislikes || [],
        mealObjectives: childData?.meal_objectives || [],
        availableTime: childData?.available_time || 20,
        equipment: childData?.materiel_disponible || [],
        parentStyle: parentPrefs.style_cuisine || [],
        parentDifficulty: parentPrefs.difficulte_preferee || 'facile',
        familyAllergens: parentPrefs.allergenes_famille || []
      };

      // Call the generate-daily-meal function
      const { data, error } = await supabase.functions.invoke('generate-daily-meal', {
        body: {
          childId,
          profileId: userId,
          mealType: slot,
          date,
          context
        }
      });

      if (error) {
        console.error('Generation error:', error);
        throw new Error(error.message || 'Erreur lors de la génération');
      }

      if (data?.recipe) {
        toast.success(`Recette "${data.recipe.name}" générée et ajoutée !`);
        onRecipeGenerated?.();
        onOpenChange(false);
      } else {
        throw new Error('Aucune recette générée');
      }
    } catch (error: any) {
      console.error('Error generating recipe:', error);
      toast.error(error.message || "Erreur lors de la génération");
    } finally {
      setGenerating(false);
    }
  };

  const filteredRecipes = recipes.filter((recipe) =>
    recipe.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formattedDate = date ? format(new Date(date), "EEEE d MMMM", { locale: fr }) : "";
  const slotLabel = slot ? MEAL_LABELS[slot] : "";
  
  const title = isCanteenOverride 
    ? "Déjeuner maison" 
    : `Ajouter une recette`;
  
  const subtitle = isCanteenOverride
    ? `Pour ${childName || 'l\'enfant'} • ${formattedDate}`
    : `${slotLabel} • ${formattedDate}`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {isCanteenOverride && <Utensils className="w-5 h-5" />}
            {title}
          </DialogTitle>
          <p className="text-sm text-muted-foreground">{subtitle}</p>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "generate" | "choose")}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="generate" className="flex items-center gap-2">
              <Sparkles className="w-4 h-4" />
              Générer
            </TabsTrigger>
            <TabsTrigger value="choose" className="flex items-center gap-2">
              <Search className="w-4 h-4" />
              Choisir
            </TabsTrigger>
          </TabsList>

          <TabsContent value="generate" className="space-y-4 mt-4">
            <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Sparkles className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h4 className="font-medium">Génération intelligente</h4>
                  <p className="text-sm text-muted-foreground">
                    La recette sera adaptée automatiquement aux allergies, restrictions et préférences
                    {childName ? ` de ${childName}` : ''}.
                  </p>
                </div>
              </div>
              
              <Button
                onClick={handleGenerateRecipe}
                disabled={generating}
                className="w-full bg-primary hover:bg-primary/90"
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

            {isCanteenOverride && (
              <p className="text-xs text-muted-foreground text-center">
                Cette recette remplacera exceptionnellement le repas à la cantine pour ce jour.
              </p>
            )}
          </TabsContent>

          <TabsContent value="choose" className="space-y-4 mt-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher une recette..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>

            {/* Recipe list */}
            <ScrollArea className="h-[300px]">
              {loading ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
                  Chargement...
                </div>
              ) : filteredRecipes.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  {searchQuery ? "Aucune recette trouvée" : "Aucune recette disponible"}
                  <p className="text-xs mt-2">
                    Utilisez l'onglet "Générer" pour créer une nouvelle recette
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredRecipes.map((recipe) => (
                    <button
                      key={recipe.id}
                      onClick={() => {
                        onSelectRecipe(recipe);
                        onOpenChange(false);
                      }}
                      className="w-full p-3 rounded-lg border bg-card hover:bg-accent text-left transition-colors"
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
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
