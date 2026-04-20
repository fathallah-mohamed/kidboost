import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Recipe } from "../types";
import { 
  Utensils, Clock, Heart, Beef, Wheat, 
  Flame, Cookie, Star, ChevronDown
} from "lucide-react";
import { RecipeRating } from "./RecipeRating";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { RecipeHealthBenefits } from "./recipe-card/RecipeHealthBenefits";

interface RecipeCardProps {
  recipe: Recipe;
  isPlanned?: boolean;
  onAdd?: (recipe: Recipe) => void;
}

export const RecipeCard = ({ recipe, isPlanned, onAdd }: RecipeCardProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [showRating, setShowRating] = useState(false);
  const { toast } = useToast();

  const toggleFavorite = async () => {
    try {
      if (isFavorite) {
        const { error } = await supabase
          .from('recipe_favorites')
          .delete()
          .eq('recipe_id', recipe.id);
        
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('recipe_favorites')
          .insert({ recipe_id: recipe.id });
        
        if (error) throw error;
      }

      setIsFavorite(!isFavorite);
      toast({
        title: isFavorite ? "Retiré des favoris" : "Ajouté aux favoris",
        description: isFavorite 
          ? "La recette a été retirée de vos favoris"
          : "La recette a été ajoutée à vos favoris",
      });
    } catch (error) {
      console.error('Erreur lors de la modification des favoris:', error);
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Une erreur est survenue.",
      });
    }
  };

  const hasImage = !!recipe.image_url;

  return (
    <Card className="overflow-hidden">
      <div className="relative bg-muted">
        {hasImage ? (
          <img 
            src={recipe.image_url} 
            alt={recipe.name}
            className="w-full h-48 object-cover transition-opacity duration-500 opacity-100"
            onError={(e) => {
              (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1618160702438-9b02ab6515c9';
            }}
          />
        ) : (
          <div className="w-full h-48 animate-pulse bg-gradient-to-br from-muted via-muted/70 to-muted flex items-center justify-center">
            <span className="text-xs text-muted-foreground">Génération de l'image…</span>
          </div>
        )}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-4">
          <div className="flex items-center gap-2 text-white">
            <Clock className="w-4 h-4" />
            <span>{recipe.preparation_time} min</span>
          </div>
        </div>
      </div>

      <div className="p-6">
        <div className="space-y-4">
          <div className="flex justify-between items-start">
            <h3 className="text-2xl font-bold text-primary">{recipe.name}</h3>
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" onClick={toggleFavorite}>
                <Heart className="w-4 h-4" fill={isFavorite ? "currentColor" : "none"} />
              </Button>
              {onAdd && (
                <Button onClick={() => onAdd(recipe)} disabled={isPlanned}>
                  {isPlanned ? 'Déjà planifiée' : 'Planifier'}
                </Button>
              )}
            </div>
          </div>

          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <Utensils className="w-4 h-4" />
              {recipe.difficulty}
            </span>
            <span className="flex items-center gap-1">
              <Star className="w-4 h-4" />
              {recipe.meal_type}
            </span>
          </div>

          {recipe.health_benefits && (
            <RecipeHealthBenefits benefits={recipe.health_benefits} />
          )}

          <Collapsible open={isOpen} onOpenChange={setIsOpen}>
            <CollapsibleContent className="space-y-6 mt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h4 className="font-semibold flex items-center gap-2">
                    <Utensils className="w-4 h-4 text-primary" />
                    Ingrédients
                  </h4>
                  <ul className="space-y-2">
                    {recipe.ingredients.map((ingredient, index) => (
                      <li key={index} className="flex items-center gap-2 text-sm">
                        <span className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-xs">
                          {index + 1}
                        </span>
                        <span>
                          {ingredient.quantity} {ingredient.unit} {ingredient.item}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="space-y-4">
                  <h4 className="font-semibold">Instructions</h4>
                  <ol className="space-y-2">
                    {recipe.instructions.map((step, index) => (
                      <li key={index} className="flex gap-2 text-sm">
                        <span className="w-6 h-6 rounded-full bg-accent/20 flex items-center justify-center text-xs shrink-0">
                          {index + 1}
                        </span>
                        <span>{step}</span>
                      </li>
                    ))}
                  </ol>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="flex items-center gap-2 p-3 rounded-lg bg-red-50">
                  <Flame className="w-5 h-5 text-red-500" />
                  <div>
                    <div className="text-sm font-medium">Calories</div>
                    <div className="text-lg font-bold text-red-600">
                      {recipe.nutritional_info.calories}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 p-3 rounded-lg bg-blue-50">
                  <Beef className="w-5 h-5 text-blue-500" />
                  <div>
                    <div className="text-sm font-medium">Protéines</div>
                    <div className="text-lg font-bold text-blue-600">
                      {recipe.nutritional_info.protein}g
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 p-3 rounded-lg bg-yellow-50">
                  <Wheat className="w-5 h-5 text-yellow-500" />
                  <div>
                    <div className="text-sm font-medium">Glucides</div>
                    <div className="text-lg font-bold text-yellow-600">
                      {recipe.nutritional_info.carbs}g
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 p-3 rounded-lg bg-purple-50">
                  <Cookie className="w-5 h-5 text-purple-500" />
                  <div>
                    <div className="text-sm font-medium">Lipides</div>
                    <div className="text-lg font-bold text-purple-600">
                      {recipe.nutritional_info.fat}g
                    </div>
                  </div>
                </div>
              </div>
            </CollapsibleContent>
          </Collapsible>

          <div className="flex justify-center">
            <Button
              variant="outline"
              onClick={() => setIsOpen(!isOpen)}
              className="w-full md:w-auto"
            >
              <ChevronDown className={`w-4 h-4 mr-2 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
              {isOpen ? 'Masquer la recette' : 'Afficher la recette'}
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
};