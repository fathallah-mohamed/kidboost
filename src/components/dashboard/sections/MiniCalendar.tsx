import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, ChevronRight } from "lucide-react";
import { format, startOfWeek, addDays } from "date-fns";
import { fr } from "date-fns/locale";
import { useState } from "react";

interface MiniCalendarProps {
  plannedDays: string[];
  onDayClick: (date: string) => void;
  onViewFull: () => void;
}

export const MiniCalendar = ({ plannedDays, onDayClick, onViewFull }: MiniCalendarProps) => {
  const [activeDay, setActiveDay] = useState<string | null>(null);
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

  const handleDayClick = (formattedDate: string) => {
    setActiveDay(formattedDate);
    onDayClick(formattedDate);
  };

  return (
    <Card className="p-2 space-y-1.5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Calendar className="w-3.5 h-3.5 text-primary" />
          <h3 className="font-bold text-xs">Semaine</h3>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={onViewFull}
          className="text-[10px] h-5 px-1.5"
        >
          Voir
          <ChevronRight className="w-3 h-3" />
        </Button>
      </div>

      <div className="grid grid-cols-7 gap-0.5">
        {weekDays.map((day) => (
          <button
            key={day.formattedDate}
            onClick={() => handleDayClick(day.formattedDate)}
            className={`flex flex-col items-center py-1 px-0.5 rounded-md transition-all cursor-pointer
              hover:scale-105 active:scale-95
              ${activeDay === day.formattedDate ? "ring-2 ring-primary/50" : ""}
              ${day.isToday
                ? "bg-primary text-primary-foreground"
                : "bg-muted/50 hover:bg-muted"
              }`}
          >
            <span className="text-[8px] font-medium uppercase leading-none">{day.dayName}</span>
            <span className="text-[10px] font-bold leading-tight">{day.dayNumber}</span>
            <div
              className={`w-1.5 h-1.5 rounded-full ${
                day.isPlanned ? "bg-pastel-green" : "bg-destructive/60"
              }`}
            />
          </button>
        ))}
      </div>

      <div className="flex items-center justify-center gap-2 text-[8px] text-muted-foreground">
        <div className="flex items-center gap-0.5">
          <div className="w-1.5 h-1.5 rounded-full bg-pastel-green" />
          <span>Planifié</span>
        </div>
        <div className="flex items-center gap-0.5">
          <div className="w-1.5 h-1.5 rounded-full bg-destructive/60" />
          <span>À planifier</span>
        </div>
      </div>
    </Card>
  );
};
