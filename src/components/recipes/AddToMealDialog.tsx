import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, Calendar as CalendarIcon } from "lucide-react";
import { format, addDays, startOfWeek } from "date-fns";
import { fr } from "date-fns/locale";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

interface AddToMealDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  recipeId: string;
  recipeMealType: string;
  userId: string;
  showLunchbox: boolean;
  onSuccess: () => void;
}

const MEAL_SLOTS = [
  { value: "breakfast", label: "Petit-déjeuner" },
  { value: "lunch", label: "Déjeuner" },
  { value: "snack", label: "Goûter" },
  { value: "dinner", label: "Dîner" },
  { value: "lunchbox", label: "Lunchbox" },
];

export const AddToMealDialog = ({ 
  open, 
  onOpenChange, 
  recipeId, 
  recipeMealType, 
  userId,
  showLunchbox,
  onSuccess 
}: AddToMealDialogProps) => {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [mealSlot, setMealSlot] = useState(recipeMealType || "dinner");
  const [saving, setSaving] = useState(false);

  const visibleMealSlots = MEAL_SLOTS.filter(s => {
    if (s.value === "lunchbox" && !showLunchbox) return false;
    return true;
  });

  const handleAdd = async () => {
    setSaving(true);
    try {
      const { error } = await supabase.from("meal_plans").insert({
        profile_id: userId,
        recipe_id: recipeId,
        date: format(selectedDate, "yyyy-MM-dd"),
        meal_time: mealSlot,
      });

      if (error) throw error;

      toast.success("Recette ajoutée au planning !");
      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error("Error adding to meal plan:", error);
      toast.error("Erreur lors de l'ajout au planning");
    } finally {
      setSaving(false);
    }
  };

  // Generate quick date options for current week
  const today = new Date();
  const weekStart = startOfWeek(today, { weekStartsOn: 1 });
  const quickDates = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Ajouter au planning</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          <div>
            <Label>Jour</Label>
            <div className="flex flex-wrap gap-2 mt-2">
              {quickDates.map((date) => (
                <Button
                  key={date.toISOString()}
                  variant={selectedDate.toDateString() === date.toDateString() ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedDate(date)}
                >
                  {format(date, "EEE d", { locale: fr })}
                </Button>
              ))}
            </div>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="mt-2">
                  <CalendarIcon className="w-4 h-4 mr-2" />
                  Autre date
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={(date) => date && setSelectedDate(date)}
                  locale={fr}
                />
              </PopoverContent>
            </Popover>
          </div>

          <div>
            <Label>Repas</Label>
            <Select value={mealSlot} onValueChange={setMealSlot}>
              <SelectTrigger className="mt-2">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {visibleMealSlots.map(s => (
                  <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-2 pt-2">
            <Button variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
              Annuler
            </Button>
            <Button onClick={handleAdd} disabled={saving} className="flex-1">
              {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Ajouter
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
