import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { OnboardingStep } from '../OnboardingStep';
import { ArrowRight, ArrowLeft, Plus, X, Heart, HeartOff } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface PreferencesStepProps {
  preferences: string[];
  dislikes: string[];
  onPreferencesChange: (value: string[]) => void;
  onDislikesChange: (value: string[]) => void;
  onNext: () => void;
  onBack: () => void;
}

const COMMON_FOODS = [
  'Pâtes', 'Riz', 'Poulet', 'Poisson', 'Légumes verts',
  'Carottes', 'Tomates', 'Fromage', 'Fruits', 'Œufs',
  'Pommes de terre', 'Pizza', 'Viande rouge', 'Soupe'
];

export const PreferencesStep = ({ 
  preferences, 
  dislikes, 
  onPreferencesChange, 
  onDislikesChange, 
  onNext, 
  onBack 
}: PreferencesStepProps) => {
  const [customLike, setCustomLike] = useState('');
  const [customDislike, setCustomDislike] = useState('');

  const togglePreference = (food: string) => {
    // Remove from dislikes if present
    if (dislikes.includes(food)) {
      onDislikesChange(dislikes.filter(d => d !== food));
    }
    // Toggle in preferences
    if (preferences.includes(food)) {
      onPreferencesChange(preferences.filter(p => p !== food));
    } else {
      onPreferencesChange([...preferences, food]);
    }
  };

  const toggleDislike = (food: string) => {
    // Remove from preferences if present
    if (preferences.includes(food)) {
      onPreferencesChange(preferences.filter(p => p !== food));
    }
    // Toggle in dislikes
    if (dislikes.includes(food)) {
      onDislikesChange(dislikes.filter(d => d !== food));
    } else {
      onDislikesChange([...dislikes, food]);
    }
  };

  const addCustomLike = () => {
    if (customLike.trim() && !preferences.includes(customLike.trim())) {
      onPreferencesChange([...preferences, customLike.trim()]);
      setCustomLike('');
    }
  };

  const addCustomDislike = () => {
    if (customDislike.trim() && !dislikes.includes(customDislike.trim())) {
      onDislikesChange([...dislikes, customDislike.trim()]);
      setCustomDislike('');
    }
  };

  return (
    <OnboardingStep
      title="Quels sont ses goûts ?"
      description="Cela nous aidera à proposer des recettes adaptées"
    >
      <div className="space-y-6">
        <Tabs defaultValue="likes" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="likes" className="flex items-center gap-2">
              <Heart className="w-4 h-4" />
              Il aime
            </TabsTrigger>
            <TabsTrigger value="dislikes" className="flex items-center gap-2">
              <HeartOff className="w-4 h-4" />
              Il n'aime pas
            </TabsTrigger>
          </TabsList>

          <TabsContent value="likes" className="space-y-4 mt-4">
            <div className="flex flex-wrap gap-2">
              {COMMON_FOODS.map(food => (
                <Badge
                  key={food}
                  variant={preferences.includes(food) ? 'default' : 'outline'}
                  className="cursor-pointer py-2 px-3 text-sm transition-all hover:scale-105"
                  onClick={() => togglePreference(food)}
                >
                  {preferences.includes(food) && <Heart className="w-3 h-3 mr-1 fill-current" />}
                  {food}
                </Badge>
              ))}
            </div>

            <div className="flex gap-2">
              <Input
                value={customLike}
                onChange={(e) => setCustomLike(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addCustomLike())}
                placeholder="Autre aliment qu'il aime..."
                className="flex-1"
              />
              <Button type="button" variant="outline" onClick={addCustomLike} disabled={!customLike.trim()}>
                <Plus className="w-4 h-4" />
              </Button>
            </div>

            {preferences.filter(p => !COMMON_FOODS.includes(p)).length > 0 && (
              <div className="flex flex-wrap gap-2">
                {preferences.filter(p => !COMMON_FOODS.includes(p)).map(food => (
                  <Badge key={food} variant="secondary" className="py-1 px-2">
                    {food}
                    <X className="w-3 h-3 ml-1 cursor-pointer" onClick={() => onPreferencesChange(preferences.filter(p => p !== food))} />
                  </Badge>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="dislikes" className="space-y-4 mt-4">
            <div className="flex flex-wrap gap-2">
              {COMMON_FOODS.map(food => (
                <Badge
                  key={food}
                  variant={dislikes.includes(food) ? 'destructive' : 'outline'}
                  className="cursor-pointer py-2 px-3 text-sm transition-all hover:scale-105"
                  onClick={() => toggleDislike(food)}
                >
                  {dislikes.includes(food) && <HeartOff className="w-3 h-3 mr-1" />}
                  {food}
                </Badge>
              ))}
            </div>

            <div className="flex gap-2">
              <Input
                value={customDislike}
                onChange={(e) => setCustomDislike(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addCustomDislike())}
                placeholder="Autre aliment qu'il n'aime pas..."
                className="flex-1"
              />
              <Button type="button" variant="outline" onClick={addCustomDislike} disabled={!customDislike.trim()}>
                <Plus className="w-4 h-4" />
              </Button>
            </div>

            {dislikes.filter(d => !COMMON_FOODS.includes(d)).length > 0 && (
              <div className="flex flex-wrap gap-2">
                {dislikes.filter(d => !COMMON_FOODS.includes(d)).map(food => (
                  <Badge key={food} variant="secondary" className="py-1 px-2">
                    {food}
                    <X className="w-3 h-3 ml-1 cursor-pointer" onClick={() => onDislikesChange(dislikes.filter(dd => dd !== food))} />
                  </Badge>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>

        <div className="flex gap-3">
          <Button type="button" variant="outline" onClick={onBack} className="flex-1 h-12">
            <ArrowLeft className="mr-2 w-5 h-5" />
            Retour
          </Button>
          <Button type="button" onClick={onNext} className="flex-1 h-12">
            Continuer
            <ArrowRight className="ml-2 w-5 h-5" />
          </Button>
        </div>
      </div>
    </OnboardingStep>
  );
};
