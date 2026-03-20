import { Button } from '@/components/ui/button';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { FileText, Printer, Calendar, MapPin, User } from 'lucide-react';
import { Patient } from '@/hooks/usePatients';
import { printDeathCertificate } from './DeathCertificates';
import { useAuth } from '@/hooks/useAuth';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface DeceasedPatientActionsProps {
  patient: Patient | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DeceasedPatientActions({ patient, open, onOpenChange }: DeceasedPatientActionsProps) {
  const { user } = useAuth();
  const { data: profile } = useQuery({
    queryKey: ['profile', user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data } = await supabase.from('profiles').select('full_name').eq('user_id', user.id).single();
      return data;
    },
    enabled: !!user,
  });
  if (!patient) return null;

  const p = patient as any;
  const doctorName = profile?.full_name || 'Médecin';

  const formatDateTime = (d: string) =>
    new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Dossier archivé — Décès
          </DialogTitle>
          <DialogDescription>
            {patient.first_name} {patient.last_name} ({patient.code})
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-2">
          <div className="p-3 rounded-lg bg-muted/50 border space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">Date du décès:</span>
              <span>{p.deceased_at ? formatDateTime(p.deceased_at) : 'Non renseignée'}</span>
            </div>
            {p.place_of_death && (
              <div className="flex items-center gap-2 text-sm">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">Lieu:</span>
                <span>{p.place_of_death}</span>
              </div>
            )}
            {p.cause_of_death && (
              <div className="text-sm">
                <span className="font-medium">Cause:</span>
                <p className="text-muted-foreground mt-1">{p.cause_of_death}</p>
              </div>
            )}
          </div>

          <Separator />

          <p className="text-sm font-medium">Générer les certificats :</p>

          <div className="grid gap-2">
            <Button
              variant="outline"
              className="justify-start gap-2 h-auto py-3"
              onClick={() => printDeathCertificate(patient, 'genre', doctorName)}
            >
              <FileText className="h-5 w-5 text-primary" />
              <div className="text-left">
                <p className="font-medium">Certificat de Genre de Mort</p>
                <p className="text-xs text-muted-foreground">Constat du décès pour l'état civil</p>
              </div>
            </Button>

            <Button
              variant="outline"
              className="justify-start gap-2 h-auto py-3"
              onClick={() => printDeathCertificate(patient, 'cause', doctorName)}
            >
              <FileText className="h-5 w-5 text-destructive" />
              <div className="text-left">
                <p className="font-medium">Certificat de Cause de Décès</p>
                <p className="text-xs text-muted-foreground">Volet médical confidentiel</p>
              </div>
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
