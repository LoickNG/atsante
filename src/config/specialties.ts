import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

// Fallback static list (used if DB not yet loaded)
export const SPECIALTIES = [
  { value: 'generaliste', label: 'Médecine générale' },
  { value: 'dentiste', label: 'Dentisterie' },
  { value: 'gynecologie', label: 'Gynécologie' },
  { value: 'pediatrie', label: 'Pédiatrie' },
  { value: 'cardiologie', label: 'Cardiologie' },
  { value: 'dermatologie', label: 'Dermatologie' },
  { value: 'ophtalmologie', label: 'Ophtalmologie' },
  { value: 'orl', label: 'ORL' },
  { value: 'chirurgie', label: 'Chirurgie' },
  { value: 'neurologie', label: 'Neurologie' },
  { value: 'urologie', label: 'Urologie' },
  { value: 'radiologie', label: 'Radiologie' },
  { value: 'pneumologie', label: 'Pneumologie' },
  { value: 'rhumatologie', label: 'Rhumatologie' },
] as const;

export type Specialty = string;

export const getSpecialtyLabel = (value: string): string => {
  return SPECIALTIES.find(s => s.value === value)?.label || value;
};

export function useSpecialties() {
  const [specialties, setSpecialties] = useState<{ value: string; label: string }[]>([...SPECIALTIES]);

  useEffect(() => {
    supabase
      .from('specialties')
      .select('value, label')
      .eq('is_active', true)
      .order('label')
      .then(({ data }) => {
        if (data && data.length > 0) {
          setSpecialties(data);
        }
      });
  }, []);

  return specialties;
}
