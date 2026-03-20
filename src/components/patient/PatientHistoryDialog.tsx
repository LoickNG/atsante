import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog';
import { Stethoscope, Pill, FlaskConical, ImageIcon, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Patient } from '@/hooks/usePatients';
import { useVisits } from '@/hooks/useVisits';
import { useConsultations } from '@/hooks/useConsultations';
import { useLabRequests } from '@/hooks/useLabRequests';
import { useImagingRequests } from '@/hooks/useImagingRequests';

interface PatientHistoryDialogProps {
  patient: Patient | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PatientHistoryDialog({ patient, open, onOpenChange }: PatientHistoryDialogProps) {
  const { data: allVisits, isLoading: visitsLoading } = useVisits();
  const { data: consultations } = useConsultations(patient?.id);
  const { data: allLabRequests } = useLabRequests();
  const { data: allImagingRequests } = useImagingRequests();

  if (!patient) return null;

  const patientVisits = (allVisits || []).filter(v => v.patient_id === patient.id);
  const patientLabs = (allLabRequests || []).filter(r => r.patient_id === patient.id);
  const patientImaging = (allImagingRequests || []).filter(r => r.patient_id === patient.id);

  const formatDateTime = (d: string) =>
    new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Historique — {patient.first_name} {patient.last_name}</DialogTitle>
          <DialogDescription>{patient.code}</DialogDescription>
        </DialogHeader>

        {visitsLoading ? (
          <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
        ) : (
          <div className="space-y-4">
            {/* Stats */}
            <div className="grid grid-cols-4 gap-2">
              <div className="text-center p-2 bg-muted/30 rounded-lg">
                <p className="text-lg font-bold">{patientVisits.length}</p>
                <p className="text-[10px] text-muted-foreground">Visites</p>
              </div>
              <div className="text-center p-2 bg-muted/30 rounded-lg">
                <p className="text-lg font-bold">{(consultations || []).length}</p>
                <p className="text-[10px] text-muted-foreground">Consultations</p>
              </div>
              <div className="text-center p-2 bg-muted/30 rounded-lg">
                <p className="text-lg font-bold">{patientLabs.length}</p>
                <p className="text-[10px] text-muted-foreground">Analyses</p>
              </div>
              <div className="text-center p-2 bg-muted/30 rounded-lg">
                <p className="text-lg font-bold">{patientImaging.length}</p>
                <p className="text-[10px] text-muted-foreground">Imageries</p>
              </div>
            </div>

            <Separator />

            {/* Visits timeline */}
            <div>
              <h4 className="text-sm font-semibold mb-3">Visites</h4>
              {patientVisits.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">Aucune visite</p>
              ) : (
                <div className="space-y-2">
                  {patientVisits.map(visit => (
                    <div key={visit.id} className="flex items-center gap-3 p-3 rounded-lg border bg-muted/20">
                      <div className={cn('h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0', visit.type === 'urgence' ? 'bg-destructive/10' : 'bg-primary/10')}>
                        <Stethoscope className={cn('h-4 w-4', visit.type === 'urgence' ? 'text-destructive' : 'text-primary')} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm capitalize">{visit.type}</p>
                        <p className="text-xs text-muted-foreground">{formatDateTime(visit.date)}</p>
                      </div>
                      <Badge variant={visit.status === 'termine' ? 'default' : visit.status === 'en_cours' ? 'secondary' : 'outline'} className="text-[10px]">
                        {visit.status.replace('_', ' ')}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Consultations */}
            {(consultations || []).length > 0 && (
              <>
                <Separator />
                <div>
                  <h4 className="text-sm font-semibold mb-3">Consultations</h4>
                  <div className="space-y-2">
                    {(consultations || []).map(c => (
                      <div key={c.id} className="p-3 rounded-lg border bg-muted/20">
                        <p className="font-medium text-sm">{c.diagnosis || 'Diagnostic non renseigné'}</p>
                        <p className="text-xs text-muted-foreground">{formatDateTime(c.date)}</p>
                        {c.symptoms && <p className="text-xs mt-1">Symptômes: {c.symptoms}</p>}
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}

            {/* Labs */}
            {patientLabs.length > 0 && (
              <>
                <Separator />
                <div>
                  <h4 className="text-sm font-semibold mb-3">Analyses</h4>
                  <div className="space-y-2">
                    {patientLabs.map(lab => (
                      <div key={lab.id} className="flex items-center gap-3 p-3 rounded-lg border bg-muted/20">
                        <FlaskConical className="h-4 w-4 text-primary flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm">{lab.test_type}</p>
                          <p className="text-xs text-muted-foreground">{formatDateTime(lab.requested_at)}</p>
                        </div>
                        <Badge variant={lab.status === 'termine' ? 'default' : 'outline'} className="text-[10px]">
                          {lab.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}

            {/* Imaging */}
            {patientImaging.length > 0 && (
              <>
                <Separator />
                <div>
                  <h4 className="text-sm font-semibold mb-3">Imageries</h4>
                  <div className="space-y-2">
                    {patientImaging.map(img => (
                      <div key={img.id} className="flex items-center gap-3 p-3 rounded-lg border bg-muted/20">
                        <ImageIcon className="h-4 w-4 text-primary flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm">{img.exam_type} — {img.body_part}</p>
                          <p className="text-xs text-muted-foreground">{formatDateTime(img.requested_at)}</p>
                        </div>
                        <Badge variant={img.status === 'termine' ? 'default' : 'outline'} className="text-[10px]">
                          {img.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
