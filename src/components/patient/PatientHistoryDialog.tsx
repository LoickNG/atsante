import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog';
import { Stethoscope, Pill, FlaskConical, ImageIcon, Loader2, Baby } from 'lucide-react';
import { Stethoscope as StethoscopeIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Patient } from '@/hooks/usePatients';
import { useVisits } from '@/hooks/useVisits';
import { useConsultations } from '@/hooks/useConsultations';
import { useLabRequests } from '@/hooks/useLabRequests';
import { useImagingRequests } from '@/hooks/useImagingRequests';
import { useMaternityAdmissions, useBirths, usePrenatalVisits } from '@/hooks/useMaternity';

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
  const { data: allAdmissions } = useMaternityAdmissions();
  const { data: allBirths } = useBirths();
  const { data: allPrenatalVisits } = usePrenatalVisits();

  if (!patient) return null;

  const patientVisits = (allVisits || []).filter(v => v.patient_id === patient.id);
  const patientLabs = (allLabRequests || []).filter(r => r.patient_id === patient.id);
  const patientImaging = (allImagingRequests || []).filter(r => r.patient_id === patient.id);
  const patientAdmissions = (allAdmissions || []).filter(a => a.patient_id === patient.id);
  const patientBirths = (allBirths || []).filter(b => b.patient_id === patient.id);
  const patientPrenatal = (allPrenatalVisits || []).filter(v => v.patient_id === patient.id);

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
            <div className="grid grid-cols-5 gap-2">
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
              <div className="text-center p-2 bg-pink-500/10 rounded-lg">
                <p className="text-lg font-bold">{patientBirths.length}</p>
                <p className="text-[10px] text-muted-foreground">Naissances</p>
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

            {/* Maternity Admissions & Births */}
            {patientAdmissions.length > 0 && (
              <>
                <Separator />
                <div>
                  <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                    <Baby className="h-4 w-4 text-pink-500" /> Maternité
                  </h4>
                  <div className="space-y-3">
                    {patientAdmissions.map(admission => {
                      const admissionBirths = patientBirths.filter(b => b.maternity_admission_id === admission.id);
                      const admPrenatal = patientPrenatal.filter(v => v.maternity_admission_id === admission.id);
                      return (
                        <div key={admission.id} className="p-3 rounded-lg border bg-pink-500/5 space-y-2">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium text-sm">
                                Grossesse {admission.pregnancy_type === 'simple' ? 'simple' : admission.pregnancy_type}
                                {admission.gestational_weeks && ` — ${admission.gestational_weeks} SA`}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                Admission: {formatDateTime(admission.admission_date)}
                              </p>
                              {admission.expected_due_date && (
                                <p className="text-xs text-muted-foreground">
                                  DPA: {new Date(admission.expected_due_date).toLocaleDateString('fr-FR')}
                                </p>
                              )}
                            </div>
                            <div className="flex flex-col items-end gap-1">
                              <Badge variant={admission.status === 'en_cours' ? 'secondary' : 'default'} className="text-[10px]">
                                {admission.status === 'en_cours' ? 'En cours' : admission.status === 'sortie' ? 'Sortie' : admission.status}
                              </Badge>
                              {admission.risk_level !== 'normal' && (
                                <Badge variant="destructive" className="text-[10px]">
                                  Risque {admission.risk_level}
                                </Badge>
                              )}
                            </div>
                          </div>

                          {admission.gravida && (
                            <p className="text-xs">G{admission.gravida}P{admission.para ?? 0} • {admission.blood_group || '?'}{admission.rhesus || ''}</p>
                          )}

                          {/* Prenatal visits */}
                          {admPrenatal.length > 0 && (
                            <div className="mt-2 space-y-1.5 border-t border-primary/20 pt-2">
                              <p className="text-xs font-semibold text-primary">Consultations prénatales ({admPrenatal.length})</p>
                              {admPrenatal.map((visit, idx) => (
                                <div key={visit.id} className="p-2 rounded bg-background/80 text-xs space-y-0.5">
                                  <div className="flex items-center justify-between">
                                    <span className="font-medium">CPN #{admPrenatal.length - idx} — {visit.gestational_weeks ? `${visit.gestational_weeks} SA` : ''}</span>
                                    <span className="text-muted-foreground">{formatDateTime(visit.visit_date)}</span>
                                  </div>
                                  <div className="flex flex-wrap gap-2 text-muted-foreground">
                                    {visit.weight_kg && <span>Poids: {visit.weight_kg}kg</span>}
                                    {visit.blood_pressure && <span>TA: {visit.blood_pressure}</span>}
                                    {visit.uterine_height_cm && <span>HU: {visit.uterine_height_cm}cm</span>}
                                    {visit.fetal_heart_rate && <span>BCF: {visit.fetal_heart_rate}bpm</span>}
                                    {visit.presentation && <span>Prés: {visit.presentation}</span>}
                                    {visit.hemoglobin && <span>Hb: {visit.hemoglobin}g/dL</span>}
                                  </div>
                                  {visit.ultrasound_notes && <p className="text-muted-foreground">Écho: {visit.ultrasound_notes}</p>}
                                  {visit.complications && <p className="text-destructive">⚠ {visit.complications}</p>}
                                </div>
                              ))}
                            </div>
                          )}

                          {/* Births */}
                          {admissionBirths.length > 0 && (
                            <div className="mt-2 space-y-1.5 border-t border-pink-200/50 pt-2">
                              <p className="text-xs font-semibold text-pink-600">Naissances</p>
                              {admissionBirths.map(birth => (
                                <div key={birth.id} className="flex items-center gap-2 p-2 rounded bg-background/80">
                                  <Baby className="h-3.5 w-3.5 text-pink-500 flex-shrink-0" />
                                  <div className="flex-1 min-w-0">
                                    <p className="font-medium text-xs">
                                      {birth.baby_first_name || '—'} {birth.baby_last_name || ''} ({birth.baby_gender === 'M' ? 'Garçon' : 'Fille'})
                                    </p>
                                    <p className="text-[10px] text-muted-foreground">
                                      {formatDateTime(birth.birth_date)} • {birth.delivery_type === 'voie_basse' ? 'Voie basse' : birth.delivery_type === 'cesarienne' ? 'Césarienne' : birth.delivery_type}
                                      {birth.birth_weight_grams && ` • ${birth.birth_weight_grams}g`}
                                    </p>
                                    {(birth.apgar_1min != null || birth.apgar_5min != null) && (
                                      <p className="text-[10px] text-muted-foreground">
                                        APGAR: {birth.apgar_1min ?? '?'}/{birth.apgar_5min ?? '?'}/{birth.apgar_10min ?? '?'}
                                      </p>
                                    )}
                                  </div>
                                  <Badge variant={birth.baby_status === 'vivant' ? 'default' : 'destructive'} className="text-[10px]">
                                    {birth.baby_status}
                                  </Badge>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
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