import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useSession } from '@supabase/auth-helpers-react';

export interface ChildProfile {
  id: string;
  name: string;
  birth_date: string;
  allergies: string[] | null;
  preferences: string[] | null;
  dislikes: string[] | null;
  meal_objectives: string[] | null;
  available_time: number | null;
  dejeuner_habituel: string | null;
  regime_special: boolean | null;
  sortie_scolaire_dates: string[] | null;
  restrictions_alimentaires: string[] | null;
  aliments_interdits: string[] | null;
  aliments_preferes: string[] | null;
  preferences_gout: string[] | null;
  materiel_disponible: string[] | null;
}

interface ChildContextType {
  children: ChildProfile[];
  selectedChild: ChildProfile | null;
  setSelectedChild: (child: ChildProfile | null) => void;
  selectChildById: (childId: string) => void;
  loading: boolean;
  refreshChildren: () => Promise<void>;
}

const ChildContext = createContext<ChildContextType | undefined>(undefined);

const STORAGE_KEY = 'kidboost_selected_child_id';

export const ChildProvider = ({ children: childrenNodes }: { children: ReactNode }) => {
  const session = useSession();
  const [children, setChildren] = useState<ChildProfile[]>([]);
  const [selectedChild, setSelectedChildState] = useState<ChildProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchChildren = useCallback(async () => {
    if (!session?.user?.id) {
      setChildren([]);
      setSelectedChildState(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('children_profiles')
        .select('*')
        .eq('profile_id', session.user.id)
        .order('created_at', { ascending: true });

      if (error) throw error;

      const childrenData = data as ChildProfile[] || [];
      setChildren(childrenData);

      // Restore previously selected child from localStorage
      const storedChildId = localStorage.getItem(STORAGE_KEY);
      
      if (storedChildId) {
        const storedChild = childrenData.find(c => c.id === storedChildId);
        if (storedChild) {
          setSelectedChildState(storedChild);
        } else if (childrenData.length > 0) {
          // Fallback to first child if stored child not found
          setSelectedChildState(childrenData[0]);
          localStorage.setItem(STORAGE_KEY, childrenData[0].id);
        }
      } else if (childrenData.length > 0) {
        // Default to first child
        setSelectedChildState(childrenData[0]);
        localStorage.setItem(STORAGE_KEY, childrenData[0].id);
      }
    } catch (error) {
      console.error('Error fetching children:', error);
    } finally {
      setLoading(false);
    }
  }, [session?.user?.id]);

  useEffect(() => {
    fetchChildren();
  }, [fetchChildren]);

  const setSelectedChild = useCallback((child: ChildProfile | null) => {
    setSelectedChildState(child);
    if (child) {
      localStorage.setItem(STORAGE_KEY, child.id);
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  const selectChildById = useCallback((childId: string) => {
    const child = children.find(c => c.id === childId);
    if (child) {
      setSelectedChild(child);
    }
  }, [children, setSelectedChild]);

  const refreshChildren = useCallback(async () => {
    await fetchChildren();
  }, [fetchChildren]);

  return (
    <ChildContext.Provider
      value={{
        children,
        selectedChild,
        setSelectedChild,
        selectChildById,
        loading,
        refreshChildren,
      }}
    >
      {childrenNodes}
    </ChildContext.Provider>
  );
};

export const useChild = () => {
  const context = useContext(ChildContext);
  if (context === undefined) {
    throw new Error('useChild must be used within a ChildProvider');
  }
  return context;
};

// Helper to calculate age
export const calculateAge = (birthDate: string): number => {
  const today = new Date();
  const birth = new Date(birthDate);
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age;
};
