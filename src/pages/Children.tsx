import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useSession } from "@supabase/auth-helpers-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { ArrowLeft, Plus, User, Check, Loader2, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { differenceInYears } from "date-fns";

interface Child {
  id: string;
  name: string;
  birth_date: string;
  allergies: string[];
  preferences: string[];
  has_lunchbox?: boolean;
}

export default function Children() {
  const navigate = useNavigate();
  const session = useSession();
  const [children, setChildren] = useState<Child[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  
  const [formData, setFormData] = useState({
    name: "",
    birth_date: "",
    allergies: "",
    preferences: "",
    has_lunchbox: false,
  });

  useEffect(() => {
    const fetchChildren = async () => {
      if (!session?.user?.id) return;
      
      const { data, error } = await supabase
        .from("children_profiles")
        .select("*")
        .eq("profile_id", session.user.id);
      
      if (!error && data) {
        setChildren(data as any);
      }
      setLoading(false);
    };

    fetchChildren();
  }, [session?.user?.id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session?.user?.id) return;

    setSaving(true);

    try {
      const { data, error } = await supabase
        .from("children_profiles")
        .insert({
          profile_id: session.user.id,
          name: formData.name,
          birth_date: formData.birth_date,
          allergies: formData.allergies.split(",").map(a => a.trim()).filter(Boolean),
          preferences: formData.preferences.split(",").map(p => p.trim()).filter(Boolean),
        })
        .select()
        .single();

      if (error) throw error;

      setChildren([...children, data as any]);
      setShowForm(false);
      setFormData({ name: "", birth_date: "", allergies: "", preferences: "", has_lunchbox: false });
      toast.success("Enfant ajouté avec succès");
    } catch (error) {
      console.error("Error adding child:", error);
      toast.error("Erreur lors de l'ajout");
    } finally {
      setSaving(false);
    }
  };

  const handleSelectChild = (childId: string) => {
    // Store selected child and go back to dashboard
    localStorage.setItem("selectedChildId", childId);
    navigate("/dashboard");
    toast.success("Enfant sélectionné");
  };

  const handleDeleteChild = async (childId: string) => {
    try {
      const { error } = await supabase
        .from("children_profiles")
        .delete()
        .eq("id", childId);

      if (error) throw error;

      setChildren(children.filter(c => c.id !== childId));
      toast.success("Profil supprimé");
    } catch (error) {
      console.error("Error deleting child:", error);
      toast.error("Erreur lors de la suppression");
    }
  };

  const getAge = (birthDate: string) => {
    return differenceInYears(new Date(), new Date(birthDate));
  };

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-lg mx-auto space-y-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-xl font-bold">Profils enfants</h1>
          </div>
          <Button onClick={() => setShowForm(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Ajouter
          </Button>
        </div>

        {showForm && (
          <Card className="p-4">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="name">Prénom</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>

              <div>
                <Label htmlFor="birth_date">Date de naissance</Label>
                <Input
                  id="birth_date"
                  type="date"
                  value={formData.birth_date}
                  onChange={(e) => setFormData({ ...formData, birth_date: e.target.value })}
                  required
                />
              </div>

              <div>
                <Label htmlFor="allergies">Allergies (séparées par des virgules)</Label>
                <Input
                  id="allergies"
                  placeholder="ex: arachides, lait"
                  value={formData.allergies}
                  onChange={(e) => setFormData({ ...formData, allergies: e.target.value })}
                />
              </div>

              <div>
                <Label htmlFor="preferences">Préférences alimentaires (séparées par des virgules)</Label>
                <Input
                  id="preferences"
                  placeholder="ex: pâtes, poulet"
                  value={formData.preferences}
                  onChange={(e) => setFormData({ ...formData, preferences: e.target.value })}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="lunchbox">Lunchbox activée</Label>
                <Switch
                  id="lunchbox"
                  checked={formData.has_lunchbox}
                  onCheckedChange={(checked) => setFormData({ ...formData, has_lunchbox: checked })}
                />
              </div>

              <div className="flex gap-2">
                <Button type="button" variant="outline" className="flex-1" onClick={() => setShowForm(false)}>
                  Annuler
                </Button>
                <Button type="submit" className="flex-1" disabled={saving}>
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Enregistrer"}
                </Button>
              </div>
            </form>
          </Card>
        )}

        {loading ? (
          <div className="text-center py-8 text-muted-foreground">
            Chargement...
          </div>
        ) : children.length === 0 ? (
          <Card className="p-8 text-center">
            <User className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground mb-4">
              Aucun profil enfant
            </p>
            <Button onClick={() => setShowForm(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Ajouter un enfant
            </Button>
          </Card>
        ) : (
          <div className="space-y-3">
            {children.map((child) => (
              <Card
                key={child.id}
                className="p-4 cursor-pointer hover:shadow-md transition-all"
                onClick={() => handleSelectChild(child.id)}
              >
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                    <User className="w-6 h-6 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold">{child.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      {getAge(child.birth_date)} ans
                    </p>
                    {child.allergies && child.allergies.length > 0 && (
                      <p className="text-xs text-destructive">
                        Allergies: {child.allergies.join(", ")}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSelectChild(child.id);
                      }}
                    >
                      <Check className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteChild(child.id);
                      }}
                    >
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
