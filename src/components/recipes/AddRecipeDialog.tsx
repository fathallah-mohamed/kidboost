import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, Plus, X } from "lucide-react";

interface AddRecipeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  showLunchbox: boolean;
  onSuccess: () => void;
}

const MEAL_TYPES = [
  { value: "breakfast", label: "Petit-déjeuner" },
  { value: "lunch", label: "Déjeuner" },
  { value: "snack", label: "Goûter" },
  { value: "dinner", label: "Dîner" },
  { value: "lunchbox", label: "Lunchbox" },
];

export const AddRecipeDialog = ({ open, onOpenChange, userId, showLunchbox, onSuccess }: AddRecipeDialogProps) => {
  const [name, setName] = useState("");
  const [mealType, setMealType] = useState("dinner");
  const [prepTime, setPrepTime] = useState([20]);
  const [ingredients, setIngredients] = useState<string[]>([""]);
  const [instructions, setInstructions] = useState("");
  const [saving, setSaving] = useState(false);

  const visibleMealTypes = MEAL_TYPES.filter(t => {
    if (t.value === "lunchbox" && !showLunchbox) return false;
    return true;
  });

  const addIngredient = () => {
    setIngredients([...ingredients, ""]);
  };

  const updateIngredient = (index: number, value: string) => {
    const updated = [...ingredients];
    updated[index] = value;
    setIngredients(updated);
  };

  const removeIngredient = (index: number) => {
    setIngredients(ingredients.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error("Veuillez entrer un nom de recette");
      return;
    }

    setSaving(true);
    try {
      const validIngredients = ingredients
        .filter(ing => ing.trim())
        .map(ing => ({ item: ing, quantity: "", unit: "" }));

      const { error } = await supabase.from("recipes").insert({
        profile_id: userId,
        name: name.trim(),
        meal_type: mealType,
        preparation_time: prepTime[0],
        ingredients: validIngredients,
        instructions: instructions.trim(),
        nutritional_info: { calories: 0, protein: 0, carbs: 0, fat: 0 },
        difficulty: "easy",
        servings: 4,
        is_generated: false,
      });

      if (error) throw error;

      toast.success("Recette ajoutée avec succès !");
      onSuccess();
      onOpenChange(false);
      resetForm();
    } catch (error) {
      console.error("Error saving recipe:", error);
      toast.error("Erreur lors de l'enregistrement");
    } finally {
      setSaving(false);
    }
  };

  const resetForm = () => {
    setName("");
    setMealType("dinner");
    setPrepTime([20]);
    setIngredients([""]);
    setInstructions("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Ajouter une recette</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          <div>
            <Label>Nom de la recette</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Pâtes au pesto"
            />
          </div>

          <div>
            <Label>Type de repas</Label>
            <Select value={mealType} onValueChange={setMealType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {visibleMealTypes.map(t => (
                  <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Temps de préparation: {prepTime[0]} min</Label>
            <Slider
              value={prepTime}
              onValueChange={setPrepTime}
              min={5}
              max={120}
              step={5}
              className="mt-2"
            />
          </div>

          <div>
            <Label>Ingrédients</Label>
            <div className="space-y-2 mt-2">
              {ingredients.map((ing, index) => (
                <div key={index} className="flex gap-2">
                  <Input
                    value={ing}
                    onChange={(e) => updateIngredient(index, e.target.value)}
                    placeholder={`Ingrédient ${index + 1}`}
                  />
                  {ingredients.length > 1 && (
                    <Button variant="ghost" size="icon" onClick={() => removeIngredient(index)}>
                      <X className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              ))}
              <Button variant="outline" size="sm" onClick={addIngredient}>
                <Plus className="w-4 h-4 mr-1" />
                Ajouter un ingrédient
              </Button>
            </div>
          </div>

          <div>
            <Label>Étapes de préparation</Label>
            <Textarea
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              placeholder="1. Faire bouillir l'eau...&#10;2. Ajouter les pâtes..."
              rows={4}
            />
          </div>

          <div className="flex gap-2 pt-2">
            <Button variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
              Annuler
            </Button>
            <Button onClick={handleSave} disabled={saving} className="flex-1">
              {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Enregistrer
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
