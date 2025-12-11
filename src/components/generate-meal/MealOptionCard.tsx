import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Coffee, Utensils, Cookie, Moon, Backpack, ChevronRight } from "lucide-react";
import { MealSlot } from "@/lib/meals";

export type MealOptionType = MealSlot | 'lunchbox_special' | 'lunchbox_trip';

interface MealOption {
  type: MealOptionType;
  title: string;
  subtitle: string;
  icon: typeof Coffee;
  color: string;
  badge?: string;
  badgeColor?: string;
}

interface MealOptionCardProps {
  option: MealOption;
  onClick: () => void;
  disabled?: boolean;
}

export const MEAL_OPTIONS: Record<MealOptionType, Omit<MealOption, 'type'>> = {
  breakfast: {
    title: "Petit-déjeuner",
    subtitle: "Commencer la journée avec énergie",
    icon: Coffee,
    color: "bg-amber-50 dark:bg-amber-950/20 hover:bg-amber-100 dark:hover:bg-amber-950/40 border-amber-200 dark:border-amber-800",
  },
  lunch: {
    title: "Déjeuner maison",
    subtitle: "Repas à préparer pour le midi",
    icon: Utensils,
    color: "bg-emerald-50 dark:bg-emerald-950/20 hover:bg-emerald-100 dark:hover:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800",
  },
  lunchbox_special: {
    title: "Lunchbox personnalisée",
    subtitle: "Adaptée au régime alimentaire de votre enfant",
    icon: Backpack,
    color: "bg-purple-50 dark:bg-purple-950/20 hover:bg-purple-100 dark:hover:bg-purple-950/40 border-purple-200 dark:border-purple-800",
    badge: "Régime spécial",
    badgeColor: "bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300",
  },
  lunchbox_trip: {
    title: "Lunchbox sortie scolaire",
    subtitle: "Pique-nique obligatoire",
    icon: Backpack,
    color: "bg-orange-50 dark:bg-orange-950/20 hover:bg-orange-100 dark:hover:bg-orange-950/40 border-orange-200 dark:border-orange-800",
    badge: "Sortie scolaire",
    badgeColor: "bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300",
  },
  snack: {
    title: "Goûter",
    subtitle: "Un moment de plaisir après l'école",
    icon: Cookie,
    color: "bg-yellow-50 dark:bg-yellow-950/20 hover:bg-yellow-100 dark:hover:bg-yellow-950/40 border-yellow-200 dark:border-yellow-800",
  },
  dinner: {
    title: "Dîner",
    subtitle: "Repas du soir en famille",
    icon: Moon,
    color: "bg-indigo-50 dark:bg-indigo-950/20 hover:bg-indigo-100 dark:hover:bg-indigo-950/40 border-indigo-200 dark:border-indigo-800",
  },
};

export function MealOptionCard({ option, onClick, disabled }: MealOptionCardProps) {
  const Icon = option.icon;
  
  return (
    <Card
      onClick={disabled ? undefined : onClick}
      className={`p-4 cursor-pointer transition-all border-2 ${option.color} ${
        disabled ? "opacity-50 cursor-not-allowed" : ""
      }`}
    >
      <div className="flex items-center gap-4">
        <div className="p-3 rounded-full bg-background/80">
          <Icon className="w-6 h-6" />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold">{option.title}</h3>
            {option.badge && (
              <Badge variant="secondary" className={`text-xs ${option.badgeColor}`}>
                {option.badge}
              </Badge>
            )}
          </div>
          <p className="text-sm text-muted-foreground">{option.subtitle}</p>
        </div>
        <ChevronRight className="w-5 h-5 text-muted-foreground" />
      </div>
    </Card>
  );
}
