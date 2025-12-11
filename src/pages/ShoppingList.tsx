import { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useSession } from "@supabase/auth-helpers-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { 
  ArrowLeft, Sparkles, Trash2, Download, ShoppingCart, Loader2,
  Apple, Carrot, Drumstick, Wheat, Milk, Cookie, Fish, Egg, 
  CheckSquare, Square, RefreshCw, Calendar, ChefHat
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format, startOfWeek, endOfWeek, addDays, isSameDay, parseISO } from "date-fns";
import { fr } from "date-fns/locale";
import { ChildSelector } from "@/components/planning/ChildSelector";
import { LunchType, determineLunchType, ChildMealConfig } from "@/lib/meals";

interface Ingredient {
  name?: string;
  ingredient?: string;
  quantity?: number | string;
  unit?: string;
}

interface ShoppingItem {
  id: string;
  name: string;
  quantity: string;
  category: string;
  checked: boolean;
  recipeNames: string[];
}

interface Child {
  id: string;
  name: string;
  regime_special: boolean;
  dejeuner_habituel: string;
  sortie_scolaire_dates: string[];
}

interface PlannedMeal {
  date: string;
  meal_time: string;
  recipe: {
    id: string;
    name: string;
    ingredients: Ingredient[] | string;
  } | null;
}

// Category configuration with icons and colors
const CATEGORY_CONFIG: Record<string, { 
  label: string; 
  icon: typeof Apple; 
  color: string;
  bgColor: string;
  keywords: string[];
}> = {
  fruits: {
    label: "Fruits",
    icon: Apple,
    color: "text-red-500",
    bgColor: "bg-red-50 dark:bg-red-950/20",
    keywords: ["pomme", "banane", "orange", "citron", "fraise", "framboise", "myrtille", "raisin", "poire", "pêche", "abricot", "cerise", "mangue", "ananas", "kiwi", "melon", "pastèque", "fruit"],
  },
  vegetables: {
    label: "Légumes",
    icon: Carrot,
    color: "text-green-500",
    bgColor: "bg-green-50 dark:bg-green-950/20",
    keywords: ["carotte", "tomate", "courgette", "aubergine", "poivron", "oignon", "ail", "échalote", "salade", "laitue", "épinard", "brocoli", "chou", "haricot vert", "petit pois", "concombre", "radis", "navet", "poireau", "céleri", "champignon", "légume", "avocat", "patate douce"],
  },
  proteins: {
    label: "Protéines",
    icon: Drumstick,
    color: "text-amber-600",
    bgColor: "bg-amber-50 dark:bg-amber-950/20",
    keywords: ["poulet", "boeuf", "porc", "veau", "agneau", "dinde", "canard", "viande", "steak", "escalope", "filet", "cuisse", "blanc", "jambon", "saucisse", "lardons", "bacon"],
  },
  fish: {
    label: "Poissons & Fruits de mer",
    icon: Fish,
    color: "text-blue-500",
    bgColor: "bg-blue-50 dark:bg-blue-950/20",
    keywords: ["saumon", "thon", "cabillaud", "colin", "merlu", "truite", "sardine", "maquereau", "crevette", "moule", "poisson", "crustacé", "fruit de mer"],
  },
  dairy: {
    label: "Produits laitiers",
    icon: Milk,
    color: "text-sky-500",
    bgColor: "bg-sky-50 dark:bg-sky-950/20",
    keywords: ["lait", "fromage", "yaourt", "yogourt", "crème", "beurre", "parmesan", "gruyère", "emmental", "mozzarella", "feta", "chèvre", "mascarpone", "ricotta", "crème fraîche"],
  },
  eggs: {
    label: "Œufs",
    icon: Egg,
    color: "text-yellow-500",
    bgColor: "bg-yellow-50 dark:bg-yellow-950/20",
    keywords: ["oeuf", "œuf", "oeufs", "œufs"],
  },
  starches: {
    label: "Féculents",
    icon: Wheat,
    color: "text-amber-700",
    bgColor: "bg-amber-100 dark:bg-amber-900/20",
    keywords: ["pâte", "riz", "spaghetti", "tagliatelle", "penne", "fusilli", "pain", "farine", "semoule", "quinoa", "boulgour", "pomme de terre", "lentille", "pois chiche", "haricot blanc", "haricot rouge", "céréale", "avoine", "flocon"],
  },
  snacks: {
    label: "Snacks & Goûters",
    icon: Cookie,
    color: "text-pink-500",
    bgColor: "bg-pink-50 dark:bg-pink-950/20",
    keywords: ["biscuit", "gâteau", "chocolat", "bonbon", "chips", "compote", "confiture", "miel", "nutella", "céréales petit déjeuner", "barre", "cookie"],
  },
  other: {
    label: "Autres",
    icon: ShoppingCart,
    color: "text-slate-500",
    bgColor: "bg-slate-50 dark:bg-slate-800/50",
    keywords: [],
  },
};

// Determine category based on ingredient name
function categorizeIngredient(name: string): string {
  const lowerName = name.toLowerCase();
  
  for (const [category, config] of Object.entries(CATEGORY_CONFIG)) {
    if (category === 'other') continue;
    if (config.keywords.some(keyword => lowerName.includes(keyword))) {
      return category;
    }
  }
  
  return 'other';
}

// Normalize ingredient name for deduplication
function normalizeIngredientName(name: string): string {
  return name.toLowerCase().trim();
}

// Parse quantity string to number
function parseQuantity(qty: string | number | undefined): number {
  if (typeof qty === 'number') return qty;
  if (!qty) return 1;
  const parsed = parseFloat(qty.toString().replace(',', '.'));
  return isNaN(parsed) ? 1 : parsed;
}

export default function ShoppingList() {
  const navigate = useNavigate();
  const session = useSession();
  const [searchParams] = useSearchParams();
  
  const [items, setItems] = useState<ShoppingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [selectedChild, setSelectedChild] = useState<Child | null>(null);
  const [lastGeneratedAt, setLastGeneratedAt] = useState<Date | null>(null);

  // Week dates
  const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
  const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 });
  const weekLabel = `${format(weekStart, "d MMM", { locale: fr })} - ${format(weekEnd, "d MMM", { locale: fr })}`;

  // Load saved shopping list
  useEffect(() => {
    const fetchShoppingList = async () => {
      if (!session?.user?.id) return;
      
      const { data, error } = await supabase
        .from("shopping_lists")
        .select("items, updated_at")
        .eq("profile_id", session.user.id)
        .maybeSingle();
      
      if (!error && data?.items && Array.isArray(data.items)) {
        // Ensure all items have recipeNames array (for backward compatibility)
        const normalizedItems = (data.items as unknown as ShoppingItem[]).map(item => ({
          ...item,
          recipeNames: item.recipeNames || []
        }));
        setItems(normalizedItems);
        if (data.updated_at) {
          setLastGeneratedAt(new Date(data.updated_at));
        }
      }
      setLoading(false);
    };

    fetchShoppingList();
  }, [session?.user?.id]);

  // Check if meal should be included (not canteen, lunchbox only if applicable)
  const shouldIncludeMeal = useCallback((meal: PlannedMeal, child: Child | null): boolean => {
    if (!child) return true;
    
    // Check lunch type for this day
    if (meal.meal_time === 'lunch') {
      const schoolTripDates = child.sortie_scolaire_dates || [];
      const hasSchoolTripToday = schoolTripDates.some((tripDate) => {
        try {
          return isSameDay(parseISO(tripDate), parseISO(meal.date));
        } catch {
          return false;
        }
      });

      const config: ChildMealConfig = {
        hasSpecialDiet: child.regime_special || false,
        hasSchoolTripToday,
        eatsAtCanteen: child.dejeuner_habituel === "cantine",
      };

      const lunchType = determineLunchType(config);
      
      // Don't include canteen meals
      if (lunchType === 'canteen') {
        return false;
      }
    }
    
    return true;
  }, []);

  // Generate shopping list from planned meals
  const handleGenerateList = async () => {
    if (!session?.user?.id) return;
    setGenerating(true);

    try {
      const startDate = format(weekStart, "yyyy-MM-dd");
      const endDate = format(weekEnd, "yyyy-MM-dd");

      // Build query
      let query = supabase
        .from("meal_plans")
        .select(`
          date,
          meal_time,
          recipe:recipes(id, name, ingredients)
        `)
        .eq("profile_id", session.user.id)
        .gte("date", startDate)
        .lte("date", endDate);

      // Filter by child if selected
      if (selectedChild) {
        query = query.eq("child_id", selectedChild.id);
      }

      const { data: meals, error } = await query;

      if (error) throw error;

      if (!meals || meals.length === 0) {
        toast.error("Aucun repas planifié pour cette semaine");
        setGenerating(false);
        return;
      }

      // Filter meals based on lunch type rules
      const filteredMeals = (meals as PlannedMeal[]).filter(meal => 
        meal.recipe && shouldIncludeMeal(meal, selectedChild)
      );

      if (filteredMeals.length === 0) {
        toast.error("Aucun repas à préparer cette semaine (uniquement des cantines)");
        setGenerating(false);
        return;
      }

      // Extract and consolidate ingredients
      const ingredientMap = new Map<string, {
        name: string;
        totalQuantity: number;
        unit: string;
        category: string;
        recipeNames: Set<string>;
      }>();

      filteredMeals.forEach((meal) => {
        if (!meal.recipe) return;
        
        let ingredients: Ingredient[] = [];
        
        // Parse ingredients (can be array or JSON string)
        if (typeof meal.recipe.ingredients === 'string') {
          try {
            ingredients = JSON.parse(meal.recipe.ingredients);
          } catch {
            ingredients = [{ name: meal.recipe.ingredients }];
          }
        } else if (Array.isArray(meal.recipe.ingredients)) {
          ingredients = meal.recipe.ingredients;
        }

        ingredients.forEach((ing) => {
          const name = typeof ing === 'string' ? ing : (ing.name || ing.ingredient || 'Ingrédient');
          const normalizedName = normalizeIngredientName(name);
          const quantity = typeof ing === 'object' ? parseQuantity(ing.quantity) : 1;
          const unit = typeof ing === 'object' ? (ing.unit || '') : '';

          if (ingredientMap.has(normalizedName)) {
            const existing = ingredientMap.get(normalizedName)!;
            existing.totalQuantity += quantity;
            existing.recipeNames.add(meal.recipe!.name);
          } else {
            ingredientMap.set(normalizedName, {
              name: name.charAt(0).toUpperCase() + name.slice(1),
              totalQuantity: quantity,
              unit,
              category: categorizeIngredient(name),
              recipeNames: new Set([meal.recipe!.name]),
            });
          }
        });
      });

      // Convert to shopping items
      const newItems: ShoppingItem[] = Array.from(ingredientMap.values()).map((item, index) => ({
        id: `item-${index}-${Date.now()}`,
        name: item.name,
        quantity: item.totalQuantity > 1 || item.unit 
          ? `${item.totalQuantity}${item.unit ? ` ${item.unit}` : ''}`
          : '',
        category: item.category,
        checked: false,
        recipeNames: Array.from(item.recipeNames),
      }));

      // Sort by category
      newItems.sort((a, b) => {
        const catOrder = Object.keys(CATEGORY_CONFIG);
        return catOrder.indexOf(a.category) - catOrder.indexOf(b.category);
      });

      // Save to database
      await supabase
        .from("shopping_lists")
        .delete()
        .eq("profile_id", session.user.id);

      await supabase
        .from("shopping_lists")
        .insert({
          profile_id: session.user.id,
          items: newItems as unknown as any,
        });

      setItems(newItems);
      setLastGeneratedAt(new Date());
      toast.success(`Liste générée : ${newItems.length} ingrédients à partir de ${filteredMeals.length} repas`);
    } catch (error) {
      console.error("Error generating list:", error);
      toast.error("Erreur lors de la génération");
    } finally {
      setGenerating(false);
    }
  };

  // Toggle item checked state
  const toggleItem = async (itemId: string) => {
    const newItems = items.map(item =>
      item.id === itemId ? { ...item, checked: !item.checked } : item
    );
    setItems(newItems);

    if (session?.user?.id) {
      await supabase
        .from("shopping_lists")
        .update({ items: newItems as unknown as any })
        .eq("profile_id", session.user.id);
    }
  };

  // Check/uncheck all items
  const setAllChecked = async (checked: boolean) => {
    const newItems = items.map(item => ({ ...item, checked }));
    setItems(newItems);

    if (session?.user?.id) {
      await supabase
        .from("shopping_lists")
        .update({ items: newItems as unknown as any })
        .eq("profile_id", session.user.id);
    }
    
    toast.success(checked ? "Tout coché ✓" : "Tout décoché");
  };

  // Clear list
  const clearList = async () => {
    if (!session?.user?.id) return;
    
    await supabase
      .from("shopping_lists")
      .delete()
      .eq("profile_id", session.user.id);
    
    setItems([]);
    setLastGeneratedAt(null);
    toast.success("Liste vidée");
  };

  // Export list
  const exportList = () => {
    const grouped = items.reduce((acc, item) => {
      const cat = CATEGORY_CONFIG[item.category]?.label || "Autres";
      if (!acc[cat]) acc[cat] = [];
      acc[cat].push(item);
      return acc;
    }, {} as Record<string, ShoppingItem[]>);

    let text = `🛒 Liste de courses - Semaine du ${weekLabel}\n\n`;
    
    Object.entries(grouped).forEach(([category, catItems]) => {
      text += `📦 ${category}\n`;
      catItems.forEach(item => {
        text += `${item.checked ? "✓" : "○"} ${item.name}${item.quantity ? ` (${item.quantity})` : ""}\n`;
      });
      text += "\n";
    });
    
    navigator.clipboard.writeText(text);
    toast.success("Liste copiée dans le presse-papier");
  };

  // Group items by category
  const groupedItems = useMemo(() => {
    return items.reduce((acc, item) => {
      const cat = item.category || "other";
      if (!acc[cat]) acc[cat] = [];
      acc[cat].push(item);
      return acc;
    }, {} as Record<string, ShoppingItem[]>);
  }, [items]);

  // Stats
  const stats = useMemo(() => {
    const total = items.length;
    const checked = items.filter(i => i.checked).length;
    return { total, checked, remaining: total - checked };
  }, [items]);

  const childIdFromParams = searchParams.get("childId");

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-lg mx-auto space-y-4">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-xl font-bold">Liste de courses</h1>
            <p className="text-sm text-muted-foreground">
              Semaine du {weekLabel}
            </p>
          </div>
        </div>

        {/* Child selector */}
        {session?.user?.id && (
          <ChildSelector
            userId={session.user.id}
            selectedChildId={selectedChild?.id || childIdFromParams}
            onSelectChild={(child) => setSelectedChild(child as Child | null)}
          />
        )}

        {/* Generate button */}
        <Card className="p-4 bg-gradient-to-br from-primary/10 to-accent/10 border-primary/20">
          <div className="flex items-start gap-3 mb-3">
            <ShoppingCart className="w-5 h-5 text-primary mt-0.5" />
            <div className="flex-1">
              <p className="text-sm">
                Génère automatiquement la liste des ingrédients à partir des repas planifiés.
                {selectedChild && (
                  <span className="text-muted-foreground"> Les repas à la cantine sont exclus.</span>
                )}
              </p>
            </div>
          </div>
          <Button 
            onClick={handleGenerateList} 
            disabled={generating}
            className="w-full"
          >
            {generating ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Génération en cours...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-2" />
                🛒 Générer la liste de courses de la semaine
              </>
            )}
          </Button>
          
          {lastGeneratedAt && (
            <p className="text-xs text-muted-foreground text-center mt-2">
              Dernière génération : {format(lastGeneratedAt, "d MMM à HH:mm", { locale: fr })}
            </p>
          )}
        </Card>

        {/* Content */}
        {loading ? (
          <div className="text-center py-8 text-muted-foreground">
            Chargement...
          </div>
        ) : items.length === 0 ? (
          <Card className="p-8 text-center">
            <ShoppingCart className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground mb-2">
              Aucun article dans la liste
            </p>
            <p className="text-sm text-muted-foreground">
              Planifiez vos repas puis générez la liste
            </p>
            <Button 
              variant="outline" 
              className="mt-4"
              onClick={() => navigate("/planning")}
            >
              <Calendar className="w-4 h-4 mr-2" />
              Voir le planning
            </Button>
          </Card>
        ) : (
          <>
            {/* Stats bar */}
            <Card className="p-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-primary">{stats.remaining}</p>
                    <p className="text-xs text-muted-foreground">à acheter</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-green-500">{stats.checked}</p>
                    <p className="text-xs text-muted-foreground">achetés</p>
                  </div>
                </div>
                <div className="flex gap-1">
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => setAllChecked(true)}
                    title="Tout cocher"
                  >
                    <CheckSquare className="w-4 h-4" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => setAllChecked(false)}
                    title="Tout décocher"
                  >
                    <Square className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </Card>

            {/* Categories */}
            {Object.entries(CATEGORY_CONFIG).map(([key, config]) => {
              const categoryItems = groupedItems[key];
              if (!categoryItems || categoryItems.length === 0) return null;
              
              const Icon = config.icon;
              const checkedCount = categoryItems.filter(i => i.checked).length;
              
              return (
                <Card key={key} className={`p-4 ${config.bgColor}`}>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Icon className={`w-5 h-5 ${config.color}`} />
                      <span className="font-semibold">{config.label}</span>
                    </div>
                    <Badge variant="secondary" className="text-xs">
                      {checkedCount}/{categoryItems.length}
                    </Badge>
                  </div>
                  <div className="space-y-2">
                    {categoryItems.map((item) => (
                      <div
                        key={item.id}
                        className={`flex items-start gap-3 p-2 rounded-lg transition-colors ${
                          item.checked ? "bg-muted/50" : "bg-background/50"
                        }`}
                      >
                        <Checkbox
                          checked={item.checked}
                          onCheckedChange={() => toggleItem(item.id)}
                          className="mt-0.5"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-baseline gap-2">
                            <span className={`text-sm ${item.checked ? "line-through text-muted-foreground" : ""}`}>
                              {item.name}
                            </span>
                            {item.quantity && (
                              <span className="text-xs text-muted-foreground font-medium">
                                ({item.quantity})
                              </span>
                            )}
                          </div>
                          {item.recipeNames && item.recipeNames.length > 0 && (
                            <p className="text-xs text-muted-foreground truncate mt-0.5">
                              <ChefHat className="w-3 h-3 inline mr-1" />
                              {item.recipeNames.join(", ")}
                            </p>
                          )}
                        </div>
                        {item.checked && (
                          <span className="text-green-500 text-sm">✓</span>
                        )}
                      </div>
                    ))}
                  </div>
                </Card>
              );
            })}

            {/* Actions */}
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={handleGenerateList} disabled={generating}>
                <RefreshCw className={`w-4 h-4 mr-2 ${generating ? "animate-spin" : ""}`} />
                Actualiser
              </Button>
              <Button variant="outline" onClick={exportList}>
                <Download className="w-4 h-4" />
              </Button>
              <Button variant="outline" onClick={clearList}>
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
