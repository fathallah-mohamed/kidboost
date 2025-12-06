import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, ChevronRight } from "lucide-react";
import { format, startOfWeek, addDays } from "date-fns";
import { fr } from "date-fns/locale";

interface MiniCalendarProps {
  plannedDays: string[];
  onDayClick: (date: string) => void;
  onViewFull: () => void;
}

export const MiniCalendar = ({ plannedDays, onDayClick, onViewFull }: MiniCalendarProps) => {
  const today = new Date();
  const weekStart = startOfWeek(today, { weekStartsOn: 1 });

  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const date = addDays(weekStart, i);
    const formattedDate = format(date, "yyyy-MM-dd");
    const isPlanned = plannedDays.includes(formattedDate);
    const isToday = format(date, "yyyy-MM-dd") === format(today, "yyyy-MM-dd");

    return {
      date,
      formattedDate,
      isPlanned,
      isToday,
      dayName: format(date, "EEE", { locale: fr }),
      dayNumber: format(date, "d"),
    };
  });

  return (
    <Card className="p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-primary" />
          <h3 className="font-bold text-sm">Aperçu de la semaine</h3>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={onViewFull}
          className="text-xs h-7 px-2"
        >
          Voir tout
          <ChevronRight className="w-3 h-3 ml-1" />
        </Button>
      </div>

      <div className="grid grid-cols-7 gap-1">
        {weekDays.map((day) => (
          <button
            key={day.formattedDate}
            onClick={() => onDayClick(day.formattedDate)}
            className={`flex flex-col items-center p-2 rounded-lg transition-all hover:scale-105 ${
              day.isToday
                ? "bg-primary text-primary-foreground"
                : "bg-muted/50 hover:bg-muted"
            }`}
          >
            <span className="text-[10px] font-medium uppercase">{day.dayName}</span>
            <span className="text-sm font-bold">{day.dayNumber}</span>
            <div
              className={`w-2 h-2 rounded-full mt-1 ${
                day.isPlanned ? "bg-pastel-green" : "bg-destructive/60"
              }`}
            />
          </button>
        ))}
      </div>

      <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground">
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-full bg-pastel-green" />
          <span>Planifié</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-full bg-destructive/60" />
          <span>Non planifié</span>
        </div>
      </div>
    </Card>
  );
};
