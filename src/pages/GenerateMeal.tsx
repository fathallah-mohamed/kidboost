import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useSession } from "@supabase/auth-helpers-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft, Cookie, Utensils, Sandwich, Sparkles, Save, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type MealType = "snack" | "dinner" | "lunchbox";

export default function GenerateMeal() {
  const navigate = useNavigate();
  const session = useSession();
  const [searchParams] = useSearchParams();
  const childId = searchParams.get("childId");
  
  const [selectedType, setSelectedType] = useState<MealType | null>(null);
  const [generating, setGenerating] = useState(false);
  const [generatedRecipe, setGeneratedRecipe] = useState<any>(null);
  const [saving, setSaving] = useState(false);

  const mealTypes = [
    { type: "snack" as MealType, label: "Goûter", icon: Cookie, color: "bg-pastel-yellow/30 hover:bg-pastel-yellow/50" },
    { type: "dinner" as MealType, label: "Repas du soir", icon: Utensils, color: "bg-primary/20 hover:bg-primary/30" },
    { type: "lunchbox" as MealType, label: "Lunchbox", icon: Sandwich, color: "bg-pastel-green/30 hover:bg-pastel-green/50" },
  ];

  const handleGenerate = async (type: MealType) => {
    if (!session?.user?.id || !childId) {
      toast.error("Veuillez sélectionner un enfant");
      return;
    }

    setSelectedType(type);
    setGenerating(true);
    setGeneratedRecipe(null);

    try {
      const { data, error } = await supabase.functions.invoke("generate-daily-meal", {
        body: {
          childId,
          mealType: type,
          date: new Date().toISOString().split("T")[0],
        },
      });

      if (error) throw error;
      setGeneratedRecipe(data.recipe);
      toast.success("Recette générée avec succès !");
    } catch (error) {
      console.error("Error generating meal:", error);
      toast.error("Erreur lors de la génération");
    } finally {
      setGenerating(false);
    }
  };

  const handleSave = async () => {
    if (!generatedRecipe || !session?.user?.id) return;

    setSaving(true);
    try {
      const today = new Date().toISOString().split("T")[0];
      
      const { error } = await supabase.from("meal_plans").insert({
        profile_id: session.user.id,
        recipe_id: generatedRecipe.id,
        child_id: childId,
        date: today,
        meal_time: selectedType || "dinner",
      });

      if (error) throw error;
      toast.success("Recette enregistrée pour aujourd'hui !");
      navigate("/dashboard");
    } catch (error) {
      console.error("Error saving meal:", error);
      toast.error("Erreur lors de l'enregistrement");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-lg mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-xl font-bold">Génération de recette</h1>
            <p className="text-sm text-muted-foreground">
              Choisissez le type de repas ou laissez l'IA proposer une suggestion
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3">
          {mealTypes.map((meal) => {
            const Icon = meal.icon;
            return (
              <Button
                key={meal.type}
                variant="outline"
                disabled={generating}
                onClick={() => handleGenerate(meal.type)}
                className={`h-16 justify-start gap-4 ${meal.color} ${
                  selectedType === meal.type ? "ring-2 ring-primary" : ""
                }`}
              >
                <Icon className="w-6 h-6" />
                <span className="font-semibold">Générer un {meal.label.toLowerCase()}</span>
                {generating && selectedType === meal.type && (
                  <Loader2 className="w-5 h-5 ml-auto animate-spin" />
                )}
              </Button>
            );
          })}
        </div>

        {generatedRecipe && (
          <Card className="p-4 space-y-4 bg-gradient-to-br from-primary/10 to-accent/10">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" />
              <h2 className="font-bold text-lg">Recette générée</h2>
            </div>
            
            <div className="space-y-2">
              <h3 className="font-bold text-xl">{generatedRecipe.name}</h3>
              <p className="text-sm text-muted-foreground">
                Temps de préparation : {generatedRecipe.preparation_time} minutes
              </p>
              <p className="text-sm">{generatedRecipe.instructions?.substring(0, 200)}...</p>
            </div>

            <Button 
              onClick={handleSave} 
              disabled={saving}
              className="w-full"
            >
              {saving ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <Save className="w-4 h-4 mr-2" />
              )}
              Enregistrer pour aujourd'hui
            </Button>
          </Card>
        )}
      </div>
    </div>
  );
}
