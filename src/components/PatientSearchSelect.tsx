import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Search, X, User } from 'lucide-react';
import { useSearchPatients, Patient } from '@/hooks/usePatients';
import { cn } from '@/lib/utils';

interface PatientSearchSelectProps {
  selectedPatient: Patient | null;
  onSelect: (patient: Patient | null) => void;
  placeholder?: string;
}

export function PatientSearchSelect({ selectedPatient, onSelect, placeholder = 'Rechercher un patient par nom, code ou téléphone...' }: PatientSearchSelectProps) {
  const [query, setQuery] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const { data: results } = useSearchPatients(query);

  if (selectedPatient) {
    return (
      <div className="flex items-center gap-3 p-3 border rounded-lg bg-primary/5 border-primary/20">
        <Avatar className="h-10 w-10">
          <AvatarFallback className={cn(
            'text-sm font-semibold',
            selectedPatient.gender === 'F' ? 'bg-pink-100 text-pink-700' : 'bg-blue-100 text-blue-700'
          )}>
            {selectedPatient.first_name[0]}{selectedPatient.last_name[0]}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <p className="font-semibold">{selectedPatient.first_name} {selectedPatient.last_name}</p>
          <p className="text-xs text-muted-foreground font-mono">{selectedPatient.code}</p>
        </div>
        <Button variant="ghost" size="icon" onClick={() => onSelect(null)} className="h-8 w-8">
          <X className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  return (
    <div className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder={placeholder}
          className="pl-10"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setTimeout(() => setIsFocused(false), 200)}
        />
      </div>
      {isFocused && query.length > 0 && (
        <div className="absolute z-50 top-full left-0 right-0 mt-1 border rounded-lg bg-popover shadow-lg max-h-64 overflow-y-auto">
          {(!results || results.length === 0) ? (
            <div className="p-4 text-center text-sm text-muted-foreground">
              Aucun patient trouvé
            </div>
          ) : (
            results.map((patient) => (
              <button
                key={patient.id}
                className="w-full flex items-center gap-3 p-3 hover:bg-accent text-left transition-colors"
                onMouseDown={(e) => { e.preventDefault(); onSelect(patient); setQuery(''); }}
              >
                <Avatar className="h-8 w-8">
                  <AvatarFallback className={cn(
                    'text-xs font-semibold',
                    patient.gender === 'F' ? 'bg-pink-100 text-pink-700' : 'bg-blue-100 text-blue-700'
                  )}>
                    {patient.first_name[0]}{patient.last_name[0]}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{patient.first_name} {patient.last_name}</p>
                  <p className="text-xs text-muted-foreground font-mono">{patient.code}</p>
                </div>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
