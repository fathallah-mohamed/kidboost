import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useSession } from "@supabase/auth-helpers-react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { toast } from "sonner";
import { format, parseISO } from "date-fns";
import { fr } from "date-fns/locale";
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
  Settings,
  UtensilsCrossed,
  ChefHat,
  X,
  Baby,
  Heart,
  Apple,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

interface ChildProfile {
  id: string;
  name: string;
  birth_date: string;
  allergies: string[] | null;
  preferences: string[] | null;
  dislikes: string[] | null;
  meal_objectives: string[] | null;
  available_time: number | null;
  dejeuner_habituel: string;
  regime_special: boolean;
  sortie_scolaire_dates: string[] | null;
  restrictions_alimentaires: string[] | null;
  aliments_interdits: string[] | null;
  aliments_preferes: string[] | null;
  preferences_gout: string[] | null;
  difficulte_souhaitee: string;
  materiel_disponible: string[] | null;
}

interface ParentPreferences {
  style_cuisine: string[];
  difficulte: string;
  allergenes_famille: string[];
  materiel_maison: string[];
  // Nouvelles préférences de planification
  cooking_frequency: 'daily' | 'every_2_days' | 'twice_a_week' | 'once_a_week';
  reuse_level: 0 | 1 | 2 | 3 | 'auto';
  include_weekend: boolean;
}

const ALLERGIES_OPTIONS = [
  "Gluten",
  "Lactose",
  "Œufs",
  "Arachides",
  "Fruits à coque",
  "Soja",
  "Poisson",
  "Crustacés",
  "Sésame",
];

const RESTRICTIONS_OPTIONS = [
  { id: "sans_lactose", label: "Sans lactose" },
  { id: "sans_gluten", label: "Sans gluten" },
  { id: "halal", label: "Halal" },
  { id: "vegetarien", label: "Végétarien" },
  { id: "vegan", label: "Vegan" },
];

const GOUT_OPTIONS = [
  { id: "sucre", label: "Sucré" },
  { id: "sale", label: "Salé" },
  { id: "doux", label: "Doux" },
  { id: "simple", label: "Simple" },
  { id: "gourmand", label: "Gourmand" },
];

const MATERIEL_OPTIONS = [
  { id: "four", label: "Four" },
  { id: "micro_ondes", label: "Micro-ondes" },
  { id: "airfryer", label: "Airfryer" },
  { id: "mixeur", label: "Mixeur" },
  { id: "robot_cuisine", label: "Robot cuisine" },
];

const STYLE_CUISINE_OPTIONS = [
  { id: "rapide", label: "Rapide" },
  { id: "equilibree", label: "Équilibrée" },
  { id: "traditionnelle", label: "Traditionnelle" },
  { id: "mini_budget", label: "Mini budget" },
  { id: "sans_cuisson", label: "Sans cuisson" },
];

const ProfileSettings = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const session = useSession();
  const [children, setChildren] = useState<ChildProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedChild, setSelectedChild] = useState<ChildProfile | null>(null);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newSortieDate, setNewSortieDate] = useState("");
  const [parentPreferences, setParentPreferences] = useState<ParentPreferences>({
    style_cuisine: [],
    difficulte: "facile",
    allergenes_famille: [],
    materiel_maison: [],
    cooking_frequency: 'every_2_days',
    reuse_level: 'auto',
    include_weekend: true,
  });
  const [newChild, setNewChild] = useState({
    name: "",
    birth_date: "",
  });

  useEffect(() => {
    if (session?.user?.id) {
      fetchData();
    }
  }, [session?.user?.id]);

  // Handle childId from URL
  useEffect(() => {
    const childId = searchParams.get("childId");
    if (childId && children.length > 0) {
      const child = children.find((c) => c.id === childId);
      if (child) setSelectedChild(child);
    }
  }, [searchParams, children]);

  const fetchData = async () => {
    if (!session?.user?.id) return;

    try {
      const [childrenRes, profileRes] = await Promise.all([
        supabase
          .from("children_profiles")
          .select("*")
          .eq("profile_id", session.user.id)
          .order("created_at", { ascending: true }),
        supabase
          .from("profiles")
          .select("preferences_parent")
          .eq("id", session.user.id)
          .single(),
      ]);

      if (childrenRes.error) throw childrenRes.error;
      
      const childrenData = (childrenRes.data || []).map((child) => ({
        ...child,
        dejeuner_habituel: child.dejeuner_habituel || "cantine",
        regime_special: child.regime_special || false,
        sortie_scolaire_dates: child.sortie_scolaire_dates || [],
        restrictions_alimentaires: child.restrictions_alimentaires || [],
        aliments_interdits: child.aliments_interdits || [],
        aliments_preferes: child.aliments_preferes || [],
        preferences_gout: child.preferences_gout || [],
        difficulte_souhaitee: child.difficulte_souhaitee || "facile",
        materiel_disponible: child.materiel_disponible || [],
      }));
      
      setChildren(childrenData as ChildProfile[]);

      if (profileRes.data?.preferences_parent) {
        const prefs = profileRes.data.preferences_parent as unknown as ParentPreferences;
        setParentPreferences({
          style_cuisine: prefs.style_cuisine || [],
          difficulte: prefs.difficulte || "facile",
          allergenes_famille: prefs.allergenes_famille || [],
          materiel_maison: prefs.materiel_maison || [],
          cooking_frequency: prefs.cooking_frequency || 'every_2_days',
          reuse_level: prefs.reuse_level ?? 'auto',
          include_weekend: prefs.include_weekend ?? true,
        });
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Erreur lors du chargement");
    } finally {
      setLoading(false);
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

  const handleAddChild = async () => {
    if (!session?.user?.id || !newChild.name || !newChild.birth_date) {
      toast.error("Veuillez remplir les champs obligatoires");
      return;
    }

    try {
      const { data, error } = await supabase
        .from("children_profiles")
        .insert({
          profile_id: session.user.id,
          name: newChild.name,
          birth_date: newChild.birth_date,
        })
        .select()
        .single();

      if (error) throw error;

      toast.success("Enfant ajouté avec succès");
      setShowAddDialog(false);
      setNewChild({ name: "", birth_date: "" });
      fetchData();
      
      // Auto-select the new child
      if (data) {
        setSelectedChild({
          ...data,
          dejeuner_habituel: data.dejeuner_habituel || "cantine",
          regime_special: data.regime_special || false,
          sortie_scolaire_dates: data.sortie_scolaire_dates || [],
          restrictions_alimentaires: data.restrictions_alimentaires || [],
          aliments_interdits: data.aliments_interdits || [],
          aliments_preferes: data.aliments_preferes || [],
          preferences_gout: data.preferences_gout || [],
          difficulte_souhaitee: data.difficulte_souhaitee || "facile",
          materiel_disponible: data.materiel_disponible || [],
        } as ChildProfile);
      }
    } catch (error) {
      console.error("Error adding child:", error);
      toast.error("Erreur lors de l'ajout");
    }
  };

  const handleSaveChild = async () => {
    if (!selectedChild) return;

    try {
      const { error } = await supabase
        .from("children_profiles")
        .update({
          name: selectedChild.name,
          birth_date: selectedChild.birth_date,
          allergies: selectedChild.allergies,
          preferences: selectedChild.preferences,
          dislikes: selectedChild.dislikes,
          available_time: selectedChild.available_time,
          dejeuner_habituel: selectedChild.dejeuner_habituel,
          regime_special: selectedChild.regime_special,
          sortie_scolaire_dates: selectedChild.sortie_scolaire_dates,
          restrictions_alimentaires: selectedChild.restrictions_alimentaires,
          aliments_interdits: selectedChild.aliments_interdits,
          aliments_preferes: selectedChild.aliments_preferes,
          preferences_gout: selectedChild.preferences_gout,
          difficulte_souhaitee: selectedChild.difficulte_souhaitee,
          materiel_disponible: selectedChild.materiel_disponible,
        })
        .eq("id", selectedChild.id);

      if (error) throw error;

      toast.success("Modifications enregistrées. Le Dashboard de votre enfant a été mis à jour.");
      fetchData();
    } catch (error) {
      console.error("Error updating child:", error);
      toast.error("Erreur lors de la sauvegarde");
    }
  };

  const handleDeleteChild = async (childId: string) => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer ce profil ?")) return;

    try {
      const { error } = await supabase.from("children_profiles").delete().eq("id", childId);
      if (error) throw error;

      toast.success("Profil supprimé");
      setSelectedChild(null);
      fetchData();
    } catch (error) {
      console.error("Error deleting child:", error);
      toast.error("Erreur lors de la suppression");
    }
  };

  const handleSaveParentPreferences = async () => {
    if (!session?.user?.id) return;

    try {
      const { error } = await supabase
        .from("profiles")
        .update({ preferences_parent: JSON.parse(JSON.stringify(parentPreferences)) })
        .eq("id", session.user.id);

      if (error) throw error;
      toast.success("Préférences parent enregistrées");
    } catch (error) {
      console.error("Error saving parent preferences:", error);
      toast.error("Erreur lors de la sauvegarde");
    }
  };

  const addSortieDate = () => {
    if (!selectedChild || !newSortieDate) return;
    const dates = [...(selectedChild.sortie_scolaire_dates || []), newSortieDate];
    setSelectedChild({ ...selectedChild, sortie_scolaire_dates: dates });
    setNewSortieDate("");
  };

  const removeSortieDate = (dateToRemove: string) => {
    if (!selectedChild) return;
    const dates = (selectedChild.sortie_scolaire_dates || []).filter((d) => d !== dateToRemove);
    setSelectedChild({ ...selectedChild, sortie_scolaire_dates: dates });
  };

  const toggleArrayValue = (
    field: keyof ChildProfile,
    value: string,
    checked: boolean
  ) => {
    if (!selectedChild) return;
    const current = (selectedChild[field] as string[]) || [];
    const updated = checked ? [...current, value] : current.filter((v) => v !== value);
    setSelectedChild({ ...selectedChild, [field]: updated });
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
      <div className="container mx-auto px-4 py-6 max-w-3xl">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-xl font-bold">Paramètres Kidboost</h1>
            <p className="text-sm text-muted-foreground">
              Gérez les profils et préférences pour des repas adaptés
            </p>
          </div>
        </div>

        {/* Section 1: Children List */}
        <Card className="p-4 mb-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-primary" />
              <h2 className="font-semibold">Profils des enfants</h2>
            </div>
            <Button size="sm" onClick={() => setShowAddDialog(true)} className="gap-1">
              <Plus className="w-4 h-4" />
              Ajouter un enfant
            </Button>
          </div>

          {loading ? (
            <p className="text-sm text-muted-foreground">Chargement...</p>
          ) : children.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Baby className="w-12 h-12 mx-auto mb-2 opacity-30" />
              <p>Aucun enfant enregistré</p>
              <Button variant="link" onClick={() => setShowAddDialog(true)}>
                Ajouter un premier enfant
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {children.map((child) => (
                <Card
                  key={child.id}
                  className={`p-3 cursor-pointer transition-all hover:shadow-md ${
                    selectedChild?.id === child.id
                      ? "ring-2 ring-primary bg-primary/5"
                      : "hover:bg-muted/30"
                  }`}
                  onClick={() => setSelectedChild(child)}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                      <User className="w-5 h-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium truncate">{child.name}</span>
                        <Badge variant="secondary" className="text-xs shrink-0">
                          {calculateAge(child.birth_date)} ans
                        </Badge>
                      </div>
                      {child.allergies && child.allergies.length > 0 && (
                        <div className="flex items-center gap-1 mt-0.5">
                          <AlertTriangle className="w-3 h-3 text-amber-500" />
                          <span className="text-xs text-muted-foreground truncate">
                            {child.allergies.filter((a) => a).slice(0, 2).join(", ")}
                            {child.allergies.length > 2 && "..."}
                          </span>
                        </div>
                      )}
                      <div className="flex gap-1 mt-1">
                        {child.regime_special && (
                          <Badge variant="outline" className="text-[10px] text-amber-600 border-amber-300">
                            Régime spécial
                          </Badge>
                        )}
                        <Badge variant="outline" className="text-[10px]">
                          {child.dejeuner_habituel === "cantine" ? "Cantine" : "Maison"}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </Card>

        {/* Section 2: Child Detail */}
        {selectedChild && (
          <Card className="p-4 mb-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <User className="w-5 h-5 text-primary" />
                <h2 className="font-semibold">Fiche de {selectedChild.name}</h2>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="text-destructive hover:text-destructive"
                  onClick={() => handleDeleteChild(selectedChild.id)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
                <Button size="sm" onClick={handleSaveChild} className="gap-1">
                  <Save className="w-4 h-4" />
                  Enregistrer
                </Button>
              </div>
            </div>

            <Accordion type="multiple" defaultValue={["general", "dejeuner"]} className="space-y-2">
              {/* A. Informations générales */}
              <AccordionItem value="general" className="border rounded-lg px-3">
                <AccordionTrigger className="hover:no-underline">
                  <div className="flex items-center gap-2">
                    <Baby className="w-4 h-4 text-blue-500" />
                    <span>Informations générales</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="space-y-4 pt-2">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Prénom</Label>
                      <Input
                        value={selectedChild.name}
                        onChange={(e) =>
                          setSelectedChild({ ...selectedChild, name: e.target.value })
                        }
                      />
                    </div>
                    <div>
                      <Label>Date de naissance</Label>
                      <Input
                        type="date"
                        value={selectedChild.birth_date}
                        onChange={(e) =>
                          setSelectedChild({ ...selectedChild, birth_date: e.target.value })
                        }
                      />
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>

              {/* B. Paramètres déjeuner */}
              <AccordionItem value="dejeuner" className="border rounded-lg px-3">
                <AccordionTrigger className="hover:no-underline">
                  <div className="flex items-center gap-2">
                    <UtensilsCrossed className="w-4 h-4 text-orange-500" />
                    <span>Paramètres déjeuner</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="space-y-6 pt-2">
                  {/* 1. Où mange-t-il ? */}
                  <div>
                    <Label className="text-sm font-medium mb-3 block">
                      Où votre enfant mange-t-il habituellement le midi ?
                    </Label>
                    <RadioGroup
                      value={selectedChild.dejeuner_habituel}
                      onValueChange={(v) =>
                        setSelectedChild({ ...selectedChild, dejeuner_habituel: v })
                      }
                      className="flex gap-4"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="cantine" id="cantine" />
                        <Label htmlFor="cantine" className="flex items-center gap-2 cursor-pointer">
                          <School className="w-4 h-4" />
                          À la cantine
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="maison" id="maison" />
                        <Label htmlFor="maison" className="flex items-center gap-2 cursor-pointer">
                          <Home className="w-4 h-4" />
                          À la maison
                        </Label>
                      </div>
                    </RadioGroup>
                  </div>

                  <Separator />

                  {/* 2. Régime spécial */}
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-sm font-medium">Régime alimentaire spécial</Label>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Activez si votre enfant a des restrictions alimentaires particulières
                      </p>
                    </div>
                    <Switch
                      checked={selectedChild.regime_special}
                      onCheckedChange={(checked) =>
                        setSelectedChild({ ...selectedChild, regime_special: checked })
                      }
                    />
                  </div>

                  <Separator />

                  {/* 3. Sorties scolaires */}
                  <div>
                    <Label className="text-sm font-medium mb-2 block">
                      <Calendar className="w-4 h-4 inline mr-1" />
                      Sorties scolaires
                    </Label>
                    <p className="text-xs text-muted-foreground mb-3">
                      Ajoutez les dates où un pique-nique est obligatoire
                    </p>
                    <div className="flex gap-2 mb-2">
                      <Input
                        type="date"
                        value={newSortieDate}
                        onChange={(e) => setNewSortieDate(e.target.value)}
                        className="flex-1"
                      />
                      <Button onClick={addSortieDate} size="sm" disabled={!newSortieDate}>
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>
                    {selectedChild.sortie_scolaire_dates && selectedChild.sortie_scolaire_dates.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {selectedChild.sortie_scolaire_dates.map((date) => (
                          <Badge key={date} variant="secondary" className="gap-1">
                            {format(parseISO(date), "EEEE d MMMM yyyy", { locale: fr })}
                            <button
                              onClick={() => removeSortieDate(date)}
                              className="ml-1 hover:text-destructive"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                </AccordionContent>
              </AccordionItem>

              {/* C. Allergies & Restrictions */}
              {selectedChild.regime_special && (
                <AccordionItem value="allergies" className="border rounded-lg px-3 border-amber-200 bg-amber-50/30">
                  <AccordionTrigger className="hover:no-underline">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-amber-500" />
                      <span>Allergies & Restrictions</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="space-y-4 pt-2">
                    {/* Allergies */}
                    <div>
                      <Label className="text-sm font-medium mb-2 block">Allergies</Label>
                      <div className="flex flex-wrap gap-2">
                        {ALLERGIES_OPTIONS.map((allergy) => (
                          <div key={allergy} className="flex items-center space-x-2">
                            <Checkbox
                              id={`allergy-${allergy}`}
                              checked={(selectedChild.allergies || []).includes(allergy)}
                              onCheckedChange={(checked) =>
                                toggleArrayValue("allergies", allergy, checked as boolean)
                              }
                            />
                            <Label htmlFor={`allergy-${allergy}`} className="text-sm cursor-pointer">
                              {allergy}
                            </Label>
                          </div>
                        ))}
                      </div>
                    </div>

                    <Separator />

                    {/* Restrictions */}
                    <div>
                      <Label className="text-sm font-medium mb-2 block">Restrictions alimentaires</Label>
                      <div className="flex flex-wrap gap-3">
                        {RESTRICTIONS_OPTIONS.map((r) => (
                          <div key={r.id} className="flex items-center space-x-2">
                            <Checkbox
                              id={`restriction-${r.id}`}
                              checked={(selectedChild.restrictions_alimentaires || []).includes(r.id)}
                              onCheckedChange={(checked) =>
                                toggleArrayValue("restrictions_alimentaires", r.id, checked as boolean)
                              }
                            />
                            <Label htmlFor={`restriction-${r.id}`} className="text-sm cursor-pointer">
                              {r.label}
                            </Label>
                          </div>
                        ))}
                      </div>
                    </div>

                    <Separator />

                    {/* Aliments interdits/préférés */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-sm font-medium mb-1 block">Aliments interdits</Label>
                        <Input
                          placeholder="Séparés par des virgules"
                          value={(selectedChild.aliments_interdits || []).join(", ")}
                          onChange={(e) =>
                            setSelectedChild({
                              ...selectedChild,
                              aliments_interdits: e.target.value.split(",").map((s) => s.trim()).filter(Boolean),
                            })
                          }
                        />
                      </div>
                      <div>
                        <Label className="text-sm font-medium mb-1 block">Aliments préférés</Label>
                        <Input
                          placeholder="Séparés par des virgules"
                          value={(selectedChild.aliments_preferes || []).join(", ")}
                          onChange={(e) =>
                            setSelectedChild({
                              ...selectedChild,
                              aliments_preferes: e.target.value.split(",").map((s) => s.trim()).filter(Boolean),
                            })
                          }
                        />
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              )}

              {/* D. Préférences de l'enfant */}
              <AccordionItem value="preferences" className="border rounded-lg px-3">
                <AccordionTrigger className="hover:no-underline">
                  <div className="flex items-center gap-2">
                    <Heart className="w-4 h-4 text-pink-500" />
                    <span>Préférences de l'enfant</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="space-y-4 pt-2">
                  {/* Goûts */}
                  <div>
                    <Label className="text-sm font-medium mb-2 block">Préférences de goût</Label>
                    <div className="flex flex-wrap gap-3">
                      {GOUT_OPTIONS.map((g) => (
                        <div key={g.id} className="flex items-center space-x-2">
                          <Checkbox
                            id={`gout-${g.id}`}
                            checked={(selectedChild.preferences_gout || []).includes(g.id)}
                            onCheckedChange={(checked) =>
                              toggleArrayValue("preferences_gout", g.id, checked as boolean)
                            }
                          />
                          <Label htmlFor={`gout-${g.id}`} className="text-sm cursor-pointer">
                            {g.label}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>

                  <Separator />

                  {/* Difficulté */}
                  <div>
                    <Label className="text-sm font-medium mb-2 block">Difficulté souhaitée</Label>
                    <RadioGroup
                      value={selectedChild.difficulte_souhaitee}
                      onValueChange={(v) =>
                        setSelectedChild({ ...selectedChild, difficulte_souhaitee: v })
                      }
                      className="flex gap-4"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="tres_facile" id="tres_facile" />
                        <Label htmlFor="tres_facile" className="cursor-pointer">Très facile</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="facile" id="facile" />
                        <Label htmlFor="facile" className="cursor-pointer">Facile</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="moyen" id="moyen" />
                        <Label htmlFor="moyen" className="cursor-pointer">Moyen</Label>
                      </div>
                    </RadioGroup>
                  </div>

                  <Separator />

                  {/* Temps de préparation */}
                  <div>
                    <Label className="text-sm font-medium mb-2 block">
                      Durée de préparation max : {selectedChild.available_time || 20} min
                    </Label>
                    <Slider
                      value={[selectedChild.available_time || 20]}
                      onValueChange={([v]) => setSelectedChild({ ...selectedChild, available_time: v })}
                      min={5}
                      max={60}
                      step={5}
                      className="w-full"
                    />
                    <div className="flex justify-between text-xs text-muted-foreground mt-1">
                      <span>5 min</span>
                      <span>60 min</span>
                    </div>
                  </div>

                  <Separator />

                  {/* Matériel */}
                  <div>
                    <Label className="text-sm font-medium mb-2 block">Matériel disponible</Label>
                    <div className="flex flex-wrap gap-3">
                      {MATERIEL_OPTIONS.map((m) => (
                        <div key={m.id} className="flex items-center space-x-2">
                          <Checkbox
                            id={`materiel-child-${m.id}`}
                            checked={(selectedChild.materiel_disponible || []).includes(m.id)}
                            onCheckedChange={(checked) =>
                              toggleArrayValue("materiel_disponible", m.id, checked as boolean)
                            }
                          />
                          <Label htmlFor={`materiel-child-${m.id}`} className="text-sm cursor-pointer">
                            {m.label}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>

                  <Separator />

                  {/* Ce qu'il n'aime pas */}
                  <div>
                    <Label className="text-sm font-medium mb-1 block">Ce qu'il/elle n'aime pas</Label>
                    <Input
                      placeholder="Séparés par des virgules (ex: épinards, poisson)"
                      value={(selectedChild.dislikes || []).join(", ")}
                      onChange={(e) =>
                        setSelectedChild({
                          ...selectedChild,
                          dislikes: e.target.value.split(",").map((s) => s.trim()).filter(Boolean),
                        })
                      }
                    />
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </Card>
        )}

        {/* Section 5: Parent Preferences */}
        <Card className="p-4 mb-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Settings className="w-5 h-5 text-primary" />
              <h2 className="font-semibold">Préférences du parent</h2>
            </div>
            <Button size="sm" variant="outline" onClick={handleSaveParentPreferences} className="gap-1">
              <Save className="w-4 h-4" />
              Enregistrer
            </Button>
          </div>

          <Accordion type="multiple" defaultValue={["planning", "cuisine"]} className="space-y-2">
            {/* Section Planification - NOUVELLE */}
            <AccordionItem value="planning" className="border rounded-lg px-3 bg-primary/5">
              <AccordionTrigger className="hover:no-underline">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-primary" />
                  <span className="font-medium">Mode Parent Pressé 🏃</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="space-y-6 pt-4">
                {/* Fréquence de cuisine */}
                <div>
                  <Label className="text-sm font-medium mb-2 block">À quelle fréquence cuisinez-vous ?</Label>
                  <RadioGroup
                    value={parentPreferences.cooking_frequency}
                    onValueChange={(v) => setParentPreferences({ ...parentPreferences, cooking_frequency: v as any })}
                    className="grid grid-cols-1 sm:grid-cols-2 gap-2"
                  >
                    {[
                      { value: 'daily', label: 'Tous les jours', desc: '7 recettes/semaine' },
                      { value: 'every_2_days', label: 'Tous les 2 jours', desc: '4 recettes/semaine' },
                      { value: 'twice_a_week', label: '2 fois par semaine', desc: '2 recettes max' },
                      { value: 'once_a_week', label: '1 fois par semaine', desc: 'Batch cooking' },
                    ].map((opt) => (
                      <div key={opt.value} className="flex items-start space-x-2 p-2 rounded-lg border hover:bg-muted/50">
                        <RadioGroupItem value={opt.value} id={`freq-${opt.value}`} className="mt-0.5" />
                        <Label htmlFor={`freq-${opt.value}`} className="cursor-pointer flex-1">
                          <span className="block font-medium text-sm">{opt.label}</span>
                          <span className="text-xs text-muted-foreground">{opt.desc}</span>
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>
                </div>

                <Separator />

                {/* Niveau de réutilisation */}
                <div>
                  <Label className="text-sm font-medium mb-2 block">Combien de fois réutiliser chaque plat ?</Label>
                  <RadioGroup
                    value={String(parentPreferences.reuse_level)}
                    onValueChange={(v) => setParentPreferences({ 
                      ...parentPreferences, 
                      reuse_level: v === 'auto' ? 'auto' : parseInt(v) as any 
                    })}
                    className="grid grid-cols-2 sm:grid-cols-3 gap-2"
                  >
                    {[
                      { value: '0', label: 'Jamais', desc: 'Plats uniques' },
                      { value: '1', label: '2 repas', desc: 'Cuisiner → manger 2x' },
                      { value: '2', label: '3 repas', desc: 'Cuisiner → manger 3x' },
                      { value: '3', label: '4 repas', desc: 'Max réutilisation' },
                      { value: 'auto', label: '✨ Auto', desc: "L'IA décide" },
                    ].map((opt) => (
                      <div key={opt.value} className="flex items-start space-x-2 p-2 rounded-lg border hover:bg-muted/50">
                        <RadioGroupItem value={opt.value} id={`reuse-${opt.value}`} className="mt-0.5" />
                        <Label htmlFor={`reuse-${opt.value}`} className="cursor-pointer flex-1">
                          <span className="block font-medium text-sm">{opt.label}</span>
                          <span className="text-xs text-muted-foreground">{opt.desc}</span>
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>
                </div>

                <Separator />

                {/* Inclure le week-end */}
                <div className="flex items-center justify-between p-3 rounded-lg border">
                  <div>
                    <Label className="text-sm font-medium">Planifier le week-end ?</Label>
                    <p className="text-xs text-muted-foreground">
                      {parentPreferences.include_weekend 
                        ? 'Lundi → Dimanche (7 jours)' 
                        : 'Lundi → Vendredi (5 jours)'}
                    </p>
                  </div>
                  <Switch
                    checked={parentPreferences.include_weekend}
                    onCheckedChange={(checked) => 
                      setParentPreferences({ ...parentPreferences, include_weekend: checked })
                    }
                  />
                </div>

                {/* Résumé */}
                <div className="p-3 bg-primary/10 rounded-lg">
                  <p className="text-sm font-medium text-primary">📊 Votre configuration :</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {parentPreferences.cooking_frequency === 'once_a_week' && 'Mode batch cooking : 1 session cuisine pour la semaine'}
                    {parentPreferences.cooking_frequency === 'twice_a_week' && 'Vous cuisinerez 2 fois, le reste sera des réutilisations'}
                    {parentPreferences.cooking_frequency === 'every_2_days' && 'Cuisine un jour sur deux avec réutilisations'}
                    {parentPreferences.cooking_frequency === 'daily' && 'Cuisine quotidienne avec possibilité de réutilisation'}
                    {!parentPreferences.include_weekend && ' • Week-end exclu'}
                  </p>
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* Section Cuisine existante */}
            <AccordionItem value="cuisine" className="border rounded-lg px-3">
              <AccordionTrigger className="hover:no-underline">
                <div className="flex items-center gap-2">
                  <ChefHat className="w-4 h-4 text-orange-500" />
                  <span>Style de cuisine & équipement</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="space-y-6 pt-4">
                {/* Style cuisine */}
                <div>
                  <Label className="text-sm font-medium mb-2 block">Style de cuisine favori</Label>
                  <div className="flex flex-wrap gap-3">
                    {STYLE_CUISINE_OPTIONS.map((s) => (
                      <div key={s.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={`style-${s.id}`}
                          checked={parentPreferences.style_cuisine.includes(s.id)}
                          onCheckedChange={(checked) => {
                            const updated = checked
                              ? [...parentPreferences.style_cuisine, s.id]
                              : parentPreferences.style_cuisine.filter((v) => v !== s.id);
                            setParentPreferences({ ...parentPreferences, style_cuisine: updated });
                          }}
                        />
                        <Label htmlFor={`style-${s.id}`} className="text-sm cursor-pointer">
                          {s.label}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>

                <Separator />

                {/* Difficulté parent */}
                <div>
                  <Label className="text-sm font-medium mb-2 block">Niveau de difficulté souhaité</Label>
                  <RadioGroup
                    value={parentPreferences.difficulte}
                    onValueChange={(v) => setParentPreferences({ ...parentPreferences, difficulte: v })}
                    className="flex gap-4"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="tres_facile" id="parent-tres-facile" />
                      <Label htmlFor="parent-tres-facile" className="cursor-pointer">Très facile</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="facile" id="parent-facile" />
                      <Label htmlFor="parent-facile" className="cursor-pointer">Facile</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="moyen" id="parent-moyen" />
                      <Label htmlFor="parent-moyen" className="cursor-pointer">Moyen</Label>
                    </div>
                  </RadioGroup>
                </div>

                <Separator />

                {/* Allergènes famille */}
                <div>
                  <Label className="text-sm font-medium mb-2 block">Allergènes à éviter pour toute la famille</Label>
                  <div className="flex flex-wrap gap-3">
                    {["Gluten", "Lactose", "Fruits à coque", "Œufs", "Aucun"].map((a) => (
                      <div key={a} className="flex items-center space-x-2">
                        <Checkbox
                          id={`fam-allergy-${a}`}
                          checked={parentPreferences.allergenes_famille.includes(a)}
                          onCheckedChange={(checked) => {
                            let updated: string[];
                            if (a === "Aucun") {
                              updated = checked ? ["Aucun"] : [];
                            } else {
                              updated = checked
                                ? [...parentPreferences.allergenes_famille.filter((v) => v !== "Aucun"), a]
                                : parentPreferences.allergenes_famille.filter((v) => v !== a);
                            }
                            setParentPreferences({ ...parentPreferences, allergenes_famille: updated });
                          }}
                        />
                        <Label htmlFor={`fam-allergy-${a}`} className="text-sm cursor-pointer">
                          {a}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>

                <Separator />

                {/* Matériel maison */}
                <div>
                  <Label className="text-sm font-medium mb-2 block">Matériel disponible à la maison</Label>
                  <div className="flex flex-wrap gap-3">
                    {MATERIEL_OPTIONS.map((m) => (
                      <div key={m.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={`parent-materiel-${m.id}`}
                          checked={parentPreferences.materiel_maison.includes(m.id)}
                          onCheckedChange={(checked) => {
                            const updated = checked
                              ? [...parentPreferences.materiel_maison, m.id]
                              : parentPreferences.materiel_maison.filter((v) => v !== m.id);
                            setParentPreferences({ ...parentPreferences, materiel_maison: updated });
                          }}
                        />
                        <Label htmlFor={`parent-materiel-${m.id}`} className="text-sm cursor-pointer">
                          {m.label}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </Card>

        {/* Footer actions */}
        <div className="flex justify-between">
          <Button variant="outline" onClick={() => navigate("/dashboard")} className="gap-1">
            <ArrowLeft className="w-4 h-4" />
            Retour au Dashboard
          </Button>
        </div>
      </div>

      {/* Add Child Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="w-5 h-5" />
              Ajouter un enfant
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="new-name">Prénom *</Label>
              <Input
                id="new-name"
                value={newChild.name}
                onChange={(e) => setNewChild({ ...newChild, name: e.target.value })}
                placeholder="Prénom de l'enfant"
              />
            </div>
            <div>
              <Label htmlFor="new-birth">Date de naissance *</Label>
              <Input
                id="new-birth"
                type="date"
                value={newChild.birth_date}
                onChange={(e) => setNewChild({ ...newChild, birth_date: e.target.value })}
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
    </div>
  );
};

export default ProfileSettings;
