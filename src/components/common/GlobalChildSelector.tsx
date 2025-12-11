import { useChild, calculateAge } from '@/contexts/ChildContext';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { User, Users, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface GlobalChildSelectorProps {
  variant?: 'default' | 'compact' | 'header';
  showLabel?: boolean;
  className?: string;
  onChildChange?: (childId: string) => void;
}

export const GlobalChildSelector = ({
  variant = 'default',
  showLabel = true,
  className,
  onChildChange,
}: GlobalChildSelectorProps) => {
  const { children, selectedChild, selectChildById, loading } = useChild();

  const handleChildChange = (childId: string) => {
    selectChildById(childId);
    onChildChange?.(childId);
  };

  if (loading) {
    return (
      <div className={cn("animate-pulse h-9 w-48 bg-muted rounded-md", className)} />
    );
  }

  if (children.length === 0) {
    return null;
  }

  // Only one child - show simplified display
  if (children.length === 1) {
    return (
      <div className={cn("flex items-center gap-2", className)}>
        {showLabel && (
          <span className="text-sm text-muted-foreground">Enfant :</span>
        )}
        <div className="flex items-center gap-2 px-3 py-1.5 bg-primary/10 rounded-lg border border-primary/20">
          <User className="w-4 h-4 text-primary" />
          <span className="font-medium text-sm">
            {children[0].name}
          </span>
          <span className="text-xs text-muted-foreground">
            ({calculateAge(children[0].birth_date)} ans)
          </span>
        </div>
      </div>
    );
  }

  // Multiple children - show selector
  if (variant === 'compact') {
    return (
      <Select
        value={selectedChild?.id || ''}
        onValueChange={handleChildChange}
      >
        <SelectTrigger className={cn("w-auto min-w-[140px] h-8 text-sm gap-1", className)}>
          <User className="w-3.5 h-3.5" />
          <SelectValue placeholder="Enfant" />
        </SelectTrigger>
        <SelectContent className="bg-background">
          {children.map((child) => (
            <SelectItem key={child.id} value={child.id}>
              {child.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    );
  }

  if (variant === 'header') {
    return (
      <Select
        value={selectedChild?.id || ''}
        onValueChange={handleChildChange}
      >
        <SelectTrigger className={cn(
          "w-auto min-w-[160px] h-9 gap-2 bg-primary/10 border-primary/20 hover:bg-primary/20",
          className
        )}>
          <Users className="w-4 h-4 text-primary" />
          <SelectValue placeholder="Sélectionner" />
          <ChevronDown className="w-3.5 h-3.5 opacity-50" />
        </SelectTrigger>
        <SelectContent className="bg-background">
          {children.map((child) => (
            <SelectItem key={child.id} value={child.id}>
              <div className="flex items-center gap-2">
                <span>{child.name}</span>
                <span className="text-xs text-muted-foreground">
                  ({calculateAge(child.birth_date)} ans)
                </span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    );
  }

  // Default variant
  return (
    <div className={cn("flex items-center gap-2 flex-wrap", className)}>
      {showLabel && (
        <span className="text-sm text-muted-foreground">Enfant :</span>
      )}
      <Select
        value={selectedChild?.id || ''}
        onValueChange={handleChildChange}
      >
        <SelectTrigger className="w-48 h-9">
          <SelectValue placeholder="Sélectionner un enfant" />
        </SelectTrigger>
        <SelectContent className="bg-background">
          {children.map((child) => (
            <SelectItem key={child.id} value={child.id}>
              {child.name} ({calculateAge(child.birth_date)} ans)
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};
