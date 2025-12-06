import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronDown, AlertTriangle } from "lucide-react";

interface ChildProfileBadgeProps {
  childName: string;
  childAge: number;
  allergies: string[];
  onChangeChild: () => void;
}

export const ChildProfileBadge = ({
  childName,
  childAge,
  allergies,
  onChangeChild,
}: ChildProfileBadgeProps) => {
  const initials = childName.slice(0, 2).toUpperCase();

  return (
    <div className="flex items-center gap-2 px-2 py-1.5 bg-card rounded-lg border shadow-sm">
      <Avatar className="h-8 w-8 border border-primary/20">
        <AvatarFallback className="bg-gradient-to-br from-primary/30 to-accent/30 text-foreground text-xs font-bold">
          {initials}
        </AvatarFallback>
      </Avatar>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <span className="font-bold text-sm text-foreground truncate">{childName}</span>
          <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
            {childAge} ans
          </Badge>
        </div>
        
        {allergies.length > 0 && (
          <div className="flex items-center gap-0.5">
            <AlertTriangle className="w-2.5 h-2.5 text-destructive" />
            <span className="text-[10px] text-muted-foreground truncate">
              {allergies.slice(0, 2).join(", ")}
            </span>
          </div>
        )}
      </div>

      <Button
        variant="ghost"
        size="sm"
        onClick={onChangeChild}
        className="h-6 px-1.5 text-[10px]"
      >
        <ChevronDown className="w-3 h-3" />
      </Button>
    </div>
  );
};
