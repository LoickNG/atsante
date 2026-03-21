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

export type Specialty = typeof SPECIALTIES[number]['value'];

export const getSpecialtyLabel = (value: string): string => {
  return SPECIALTIES.find(s => s.value === value)?.label || value;
};
