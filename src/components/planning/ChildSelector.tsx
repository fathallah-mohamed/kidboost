import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { User } from "lucide-react";

interface Child {
  id: string;
  name: string;
  birth_date: string;
  regime_special: boolean;
  dejeuner_habituel: string;
  sortie_scolaire_dates: string[];
}

interface ChildSelectorProps {
  userId: string;
  selectedChildId: string | null;
  onSelectChild: (child: Child | null) => void;
}

export function ChildSelector({ userId, selectedChildId, onSelectChild }: ChildSelectorProps) {
  const [children, setChildren] = useState<Child[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchChildren = async () => {
      const { data, error } = await supabase
        .from("children_profiles")
        .select("id, name, birth_date, regime_special, dejeuner_habituel, sortie_scolaire_dates")
        .eq("profile_id", userId);

      if (!error && data) {
        setChildren(data as Child[]);
        
        // Auto-sélectionner le premier enfant si aucun n'est sélectionné
        if (!selectedChildId && data.length > 0) {
          onSelectChild(data[0] as Child);
        } else if (selectedChildId) {
          const selected = data.find((c) => c.id === selectedChildId);
          if (selected) {
            onSelectChild(selected as Child);
          }
        }
      }
      setLoading(false);
    };

    fetchChildren();
  }, [userId, selectedChildId, onSelectChild]);

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  if (loading) {
    return <div className="h-10 bg-muted animate-pulse rounded-md" />;
  }

  if (children.length === 0) {
    return (
      <div className="text-sm text-muted-foreground">
        Aucun enfant configuré. Ajoutez un enfant dans les paramètres.
      </div>
    );
  }

  const selectedChild = children.find((c) => c.id === selectedChildId);

  return (
    <Select
      value={selectedChildId || undefined}
      onValueChange={(value) => {
        const child = children.find((c) => c.id === value);
        onSelectChild(child || null);
      }}
    >
      <SelectTrigger className="w-full md:w-[250px]">
        <SelectValue placeholder="Sélectionner un enfant">
          {selectedChild && (
            <div className="flex items-center gap-2">
              <Avatar className="w-6 h-6">
                <AvatarFallback className="text-xs bg-primary/10 text-primary">
                  {getInitials(selectedChild.name)}
                </AvatarFallback>
              </Avatar>
              <span>{selectedChild.name}</span>
            </div>
          )}
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {children.map((child) => (
          <SelectItem key={child.id} value={child.id}>
            <div className="flex items-center gap-2">
              <Avatar className="w-6 h-6">
                <AvatarFallback className="text-xs bg-primary/10 text-primary">
                  {getInitials(child.name)}
                </AvatarFallback>
              </Avatar>
              <span>{child.name}</span>
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
