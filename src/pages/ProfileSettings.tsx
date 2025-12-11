import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useSession } from "@supabase/auth-helpers-react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import {
  ArrowLeft,
  User,
  Users,
  Plus,
  Pencil,
  Trash2,
  AlertTriangle,
  School,
  Home,
  Calendar,
  Save,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Child {
  id: string;
  name: string;
  birth_date: string;
  allergies: string[] | null;
  preferences: string[] | null;
  dislikes: string[] | null;
  meal_objectives: string[] | null;
  available_time: number | null;
}

const ProfileSettings = () => {
  const navigate = useNavigate();
  const session = useSession();
  const [children, setChildren] = useState<Child[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingChild, setEditingChild] = useState<Child | null>(null);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newChild, setNewChild] = useState({
    name: "",
    birth_date: "",
    allergies: "",
    preferences: "",
    dislikes: "",
  });

  useEffect(() => {
    if (session?.user?.id) {
      fetchChildren();
    }
  }, [session?.user?.id]);

  const fetchChildren = async () => {
    if (!session?.user?.id) return;

    try {
      const { data, error } = await supabase
        .from("children_profiles")
        .select("*")
        .eq("profile_id", session.user.id)
        .order("created_at", { ascending: true });

      if (error) throw error;
      setChildren(data || []);
    } catch (error) {
      console.error("Error fetching children:", error);
      toast.error("Erreur lors du chargement des profils");
    } finally {
      setLoading(false);
    }
  };

  const handleAddChild = async () => {
    if (!session?.user?.id || !newChild.name || !newChild.birth_date) {
      toast.error("Veuillez remplir les champs obligatoires");
      return;
    }

    try {
      const { error } = await supabase.from("children_profiles").insert({
        profile_id: session.user.id,
        name: newChild.name,
        birth_date: newChild.birth_date,
        allergies: newChild.allergies ? newChild.allergies.split(",").map((s) => s.trim()) : [],
        preferences: newChild.preferences ? newChild.preferences.split(",").map((s) => s.trim()) : [],
        dislikes: newChild.dislikes ? newChild.dislikes.split(",").map((s) => s.trim()) : [],
      });

      if (error) throw error;

      toast.success("Enfant ajouté avec succès");
      setShowAddDialog(false);
      setNewChild({ name: "", birth_date: "", allergies: "", preferences: "", dislikes: "" });
      fetchChildren();
    } catch (error) {
      console.error("Error adding child:", error);
      toast.error("Erreur lors de l'ajout de l'enfant");
    }
  };

  const handleUpdateChild = async () => {
    if (!editingChild) return;

    try {
      const { error } = await supabase
        .from("children_profiles")
        .update({
          name: editingChild.name,
          birth_date: editingChild.birth_date,
          allergies: editingChild.allergies,
          preferences: editingChild.preferences,
          dislikes: editingChild.dislikes,
          available_time: editingChild.available_time,
        })
        .eq("id", editingChild.id);

      if (error) throw error;

      toast.success("Profil mis à jour");
      setEditingChild(null);
      fetchChildren();
    } catch (error) {
      console.error("Error updating child:", error);
      toast.error("Erreur lors de la mise à jour");
    }
  };

  const handleDeleteChild = async (childId: string) => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer ce profil ?")) return;

    try {
      const { error } = await supabase.from("children_profiles").delete().eq("id", childId);

      if (error) throw error;

      toast.success("Profil supprimé");
      fetchChildren();
    } catch (error) {
      console.error("Error deleting child:", error);
      toast.error("Erreur lors de la suppression");
    }
  };

  const calculateAge = (birthDate: string): number => {
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  };

  if (!session) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p>Veuillez vous connecter</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-6 max-w-2xl">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-xl font-bold">Paramètres du profil</h1>
            <p className="text-sm text-muted-foreground">Gérez votre famille et vos préférences</p>
          </div>
        </div>

        {/* Children Section */}
        <Card className="p-4 mb-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-primary" />
              <h2 className="font-semibold">Profils des enfants</h2>
            </div>
            <Button size="sm" onClick={() => setShowAddDialog(true)} className="gap-1">
              <Plus className="w-4 h-4" />
              Ajouter
            </Button>
          </div>

          {loading ? (
            <p className="text-sm text-muted-foreground">Chargement...</p>
          ) : children.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="w-12 h-12 mx-auto mb-2 opacity-30" />
              <p>Aucun enfant enregistré</p>
              <Button variant="link" onClick={() => setShowAddDialog(true)}>
                Ajouter un premier enfant
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {children.map((child) => (
                <div
                  key={child.id}
                  className="flex items-start justify-between p-3 bg-muted/30 rounded-lg"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{child.name}</span>
                      <Badge variant="secondary" className="text-xs">
                        {calculateAge(child.birth_date)} ans
                      </Badge>
                    </div>

                    {child.allergies && child.allergies.length > 0 && (
                      <div className="flex items-center gap-1 mt-1">
                        <AlertTriangle className="w-3 h-3 text-destructive" />
                        <span className="text-xs text-muted-foreground">
                          {child.allergies.filter((a) => a).join(", ")}
                        </span>
                      </div>
                    )}

                    {child.preferences && child.preferences.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {child.preferences.filter((p) => p).slice(0, 3).map((pref, idx) => (
                          <Badge key={idx} variant="outline" className="text-[10px]">
                            {pref}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => setEditingChild(child)}
                    >
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:text-destructive"
                      onClick={() => handleDeleteChild(child.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Info Card */}
        <Card className="p-4 bg-muted/30">
          <h3 className="font-medium text-sm mb-2">À propos des préférences</h3>
          <ul className="text-xs text-muted-foreground space-y-1">
            <li>• Les allergies sont prises en compte pour exclure certains ingrédients</li>
            <li>• Les préférences orientent les suggestions de recettes</li>
            <li>• Les aversions (ce qu'ils n'aiment pas) sont évitées dans les propositions</li>
            <li>• Le temps disponible influence la complexité des recettes proposées</li>
          </ul>
        </Card>
      </div>

      {/* Add Child Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Ajouter un enfant</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Prénom *</Label>
              <Input
                id="name"
                value={newChild.name}
                onChange={(e) => setNewChild({ ...newChild, name: e.target.value })}
                placeholder="Prénom de l'enfant"
              />
            </div>
            <div>
              <Label htmlFor="birth_date">Date de naissance *</Label>
              <Input
                id="birth_date"
                type="date"
                value={newChild.birth_date}
                onChange={(e) => setNewChild({ ...newChild, birth_date: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="allergies">Allergies (séparées par des virgules)</Label>
              <Input
                id="allergies"
                value={newChild.allergies}
                onChange={(e) => setNewChild({ ...newChild, allergies: e.target.value })}
                placeholder="Ex: gluten, lactose"
              />
            </div>
            <div>
              <Label htmlFor="preferences">Préférences alimentaires</Label>
              <Input
                id="preferences"
                value={newChild.preferences}
                onChange={(e) => setNewChild({ ...newChild, preferences: e.target.value })}
                placeholder="Ex: pâtes, poulet"
              />
            </div>
            <div>
              <Label htmlFor="dislikes">Ce qu'il/elle n'aime pas</Label>
              <Input
                id="dislikes"
                value={newChild.dislikes}
                onChange={(e) => setNewChild({ ...newChild, dislikes: e.target.value })}
                placeholder="Ex: épinards, poisson"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>
              Annuler
            </Button>
            <Button onClick={handleAddChild}>Ajouter</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Child Dialog */}
      <Dialog open={!!editingChild} onOpenChange={() => setEditingChild(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Modifier le profil</DialogTitle>
          </DialogHeader>
          {editingChild && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="edit-name">Prénom</Label>
                <Input
                  id="edit-name"
                  value={editingChild.name}
                  onChange={(e) => setEditingChild({ ...editingChild, name: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="edit-birth">Date de naissance</Label>
                <Input
                  id="edit-birth"
                  type="date"
                  value={editingChild.birth_date}
                  onChange={(e) =>
                    setEditingChild({ ...editingChild, birth_date: e.target.value })
                  }
                />
              </div>
              <div>
                <Label htmlFor="edit-allergies">Allergies</Label>
                <Input
                  id="edit-allergies"
                  value={(editingChild.allergies || []).join(", ")}
                  onChange={(e) =>
                    setEditingChild({
                      ...editingChild,
                      allergies: e.target.value.split(",").map((s) => s.trim()),
                    })
                  }
                  placeholder="Ex: gluten, lactose"
                />
              </div>
              <div>
                <Label htmlFor="edit-prefs">Préférences</Label>
                <Input
                  id="edit-prefs"
                  value={(editingChild.preferences || []).join(", ")}
                  onChange={(e) =>
                    setEditingChild({
                      ...editingChild,
                      preferences: e.target.value.split(",").map((s) => s.trim()),
                    })
                  }
                  placeholder="Ex: pâtes, poulet"
                />
              </div>
              <div>
                <Label htmlFor="edit-dislikes">Ce qu'il/elle n'aime pas</Label>
                <Input
                  id="edit-dislikes"
                  value={(editingChild.dislikes || []).join(", ")}
                  onChange={(e) =>
                    setEditingChild({
                      ...editingChild,
                      dislikes: e.target.value.split(",").map((s) => s.trim()),
                    })
                  }
                  placeholder="Ex: épinards, poisson"
                />
              </div>
              <div>
                <Label htmlFor="edit-time">Temps de préparation max (min)</Label>
                <Select
                  value={String(editingChild.available_time || 30)}
                  onValueChange={(v) =>
                    setEditingChild({ ...editingChild, available_time: Number(v) })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-background">
                    <SelectItem value="15">15 minutes</SelectItem>
                    <SelectItem value="20">20 minutes</SelectItem>
                    <SelectItem value="30">30 minutes</SelectItem>
                    <SelectItem value="45">45 minutes</SelectItem>
                    <SelectItem value="60">60 minutes</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingChild(null)}>
              Annuler
            </Button>
            <Button onClick={handleUpdateChild} className="gap-1">
              <Save className="w-4 h-4" />
              Enregistrer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ProfileSettings;