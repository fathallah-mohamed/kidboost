import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, ChevronRight } from "lucide-react";
import { format, startOfWeek, addDays } from "date-fns";
import { fr } from "date-fns/locale";
import { useNavigate } from "react-router-dom";

interface MiniCalendarProps {
  plannedDays: string[];
  onDayClick: (date: string) => void;
  onViewFull: () => void;
}

export const MiniCalendar = ({ plannedDays, onDayClick, onViewFull }: MiniCalendarProps) => {
  const navigate = useNavigate();
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
    navigate(`/planning/day/${formattedDate}`);
  };

  const plannedCount = weekDays.filter(d => d.isPlanned).length;
  const toplanCount = 7 - plannedCount;

  return (
    <Card className="p-3 space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-primary" />
          <h3 className="font-bold text-sm">Semaine</h3>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate("/planning")}
          className="text-xs h-6 px-2 hover:bg-primary/10"
        >
          Voir planning
          <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
        </Button>
      </div>

      <div className="grid grid-cols-7 gap-1">
        {weekDays.map((day) => (
          <button
            key={day.formattedDate}
            onClick={() => handleDayClick(day.formattedDate)}
            className={`flex flex-col items-center py-1.5 px-1 rounded-lg transition-all cursor-pointer
              hover:scale-105 active:scale-95
              ${day.isToday
                ? "bg-primary text-primary-foreground ring-2 ring-primary/30"
                : day.isPlanned
                  ? "bg-emerald-100 dark:bg-emerald-900/40 hover:bg-emerald-200 dark:hover:bg-emerald-900/60"
                  : "bg-red-100/50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30"
              }`}
          >
            <span className="text-[8px] font-medium uppercase leading-none opacity-70">{day.dayName}</span>
            <span className="text-xs font-bold leading-tight mt-0.5">{day.dayNumber}</span>
            <div
              className={`w-2 h-2 rounded-full mt-0.5 ${
                day.isPlanned 
                  ? "bg-emerald-500 dark:bg-emerald-400" 
                  : "bg-red-400 dark:bg-red-500"
              }`}
            />
          </button>
        ))}
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-4 text-[10px] pt-1 border-t border-border/40">
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
          <span className="text-muted-foreground">Planifié</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-red-400" />
          <span className="text-muted-foreground">À planifier</span>
        </div>
      </div>
    </Card>
  );
};
