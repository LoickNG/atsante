import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { Search, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Patient {
  id: string;
  code: string;
  first_name: string;
  last_name: string;
}

interface Doctor {
  id: string;
  full_name: string;
}

interface AddPatientDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function AddPatientDialog({ open, onOpenChange, onSuccess }: AddPatientDialogProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [patients, setPatients] = useState<Patient[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [selectedDoctor, setSelectedDoctor] = useState<string>('');
  const [visitType, setVisitType] = useState<'consultation' | 'urgence' | 'suivi'>('consultation');

  useEffect(() => {
    if (open) {
      fetchDoctors();
    }
  }, [open]);

  useEffect(() => {
    if (searchTerm.length >= 2) {
      searchPatients();
    } else {
      setPatients([]);
    }
  }, [searchTerm]);

  const fetchDoctors = async () => {
    const { data } = await supabase
      .from('user_roles')
      .select('user_id')
      .eq('role', 'medecin');

    if (data) {
      const userIds = data.map(d => d.user_id);
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name, user_id')
        .in('user_id', userIds);

      if (profiles) {
        setDoctors(profiles.map(p => ({ id: p.user_id, full_name: p.full_name })));
      }
    }
  };

  const searchPatients = async () => {
    const { data } = await supabase
      .from('patients')
      .select('id, code, first_name, last_name')
      .or(`first_name.ilike.%${searchTerm}%,last_name.ilike.%${searchTerm}%,code.ilike.%${searchTerm}%`)
      .limit(10);

    if (data) {
      setPatients(data);
    }
  };

  const handleSubmit = async () => {
    if (!selectedPatient) {
      toast({ title: 'Erreur', description: 'Veuillez sélectionner un patient', variant: 'destructive' });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.from('visits').insert({
        patient_id: selectedPatient.id,
        type: visitType,
        status: 'en_attente',
        assigned_doctor_id: selectedDoctor || null,
      });

      if (error) throw error;

      toast({ title: 'Succès', description: 'Patient ajouté à la file d\'attente' });
      onSuccess();
      onOpenChange(false);
      resetForm();
    } catch (error: any) {
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setSearchTerm('');
    setSelectedPatient(null);
    setSelectedDoctor('');
    setVisitType('consultation');
    setPatients([]);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Ajouter un patient à la file</DialogTitle>
          <DialogDescription>
            Recherchez un patient et assignez-le à un médecin
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Patient Search */}
          <div className="space-y-2">
            <Label>Rechercher un patient</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Nom, prénom ou code patient..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            {patients.length > 0 && !selectedPatient && (
              <div className="border rounded-md max-h-40 overflow-y-auto">
                {patients.map((patient) => (
                  <button
                    key={patient.id}
                    onClick={() => {
                      setSelectedPatient(patient);
                      setSearchTerm(`${patient.first_name} ${patient.last_name}`);
                      setPatients([]);
                    }}
                    className="w-full px-3 py-2 text-left hover:bg-muted text-sm"
                  >
                    <span className="font-medium">{patient.first_name} {patient.last_name}</span>
                    <span className="text-muted-foreground ml-2">({patient.code})</span>
                  </button>
                ))}
              </div>
            )}
            {selectedPatient && (
              <div className="flex items-center justify-between p-2 bg-primary/10 rounded-md">
                <span className="text-sm font-medium">
                  {selectedPatient.first_name} {selectedPatient.last_name} ({selectedPatient.code})
                </span>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => {
                    setSelectedPatient(null);
                    setSearchTerm('');
                  }}
                >
                  Changer
                </Button>
              </div>
            )}
          </div>

          {/* Visit Type */}
          <div className="space-y-2">
            <Label>Type de visite</Label>
            <Select value={visitType} onValueChange={(v: any) => setVisitType(v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="consultation">Consultation</SelectItem>
                <SelectItem value="urgence">Urgence</SelectItem>
                <SelectItem value="suivi">Suivi</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Doctor Assignment */}
          <div className="space-y-2">
            <Label>Médecin assigné (optionnel)</Label>
            <Select value={selectedDoctor} onValueChange={setSelectedDoctor}>
              <SelectTrigger>
                <SelectValue placeholder="Tous les médecins" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Tous les médecins</SelectItem>
                {doctors.map((doctor) => (
                  <SelectItem key={doctor.id} value={doctor.id}>
                    Dr. {doctor.full_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Si aucun médecin n'est assigné, tous les médecins verront ce patient
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button onClick={handleSubmit} disabled={loading || !selectedPatient}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Ajout...
              </>
            ) : (
              'Ajouter à la file'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
