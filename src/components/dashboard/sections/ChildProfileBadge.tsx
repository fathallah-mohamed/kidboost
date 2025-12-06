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
    <div className="flex items-center gap-3 p-3 bg-card rounded-xl border shadow-sm">
      <Avatar className="h-12 w-12 border-2 border-primary/20">
        <AvatarFallback className="bg-gradient-to-br from-primary/30 to-accent/30 text-foreground font-bold">
          {initials}
        </AvatarFallback>
      </Avatar>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-bold text-foreground truncate">{childName}</span>
          <Badge variant="secondary" className="text-xs">
            {childAge} ans
          </Badge>
        </div>
        
        {allergies.length > 0 && (
          <div className="flex items-center gap-1 mt-1">
            <AlertTriangle className="w-3 h-3 text-destructive" />
            <span className="text-xs text-muted-foreground truncate">
              {allergies.slice(0, 2).join(", ")}
              {allergies.length > 2 && ` +${allergies.length - 2}`}
            </span>
          </div>
        )}
      </div>

      <Button
        variant="ghost"
        size="sm"
        onClick={onChangeChild}
        className="flex items-center gap-1 text-xs"
      >
        Changer
        <ChevronDown className="w-3 h-3" />
      </Button>
    </div>
  );
};
