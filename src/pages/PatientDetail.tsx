import { useParams, Link } from 'react-router-dom';
import { AppLayout, PageHeader } from '@/components/layout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from '@/components/ui/card';
import {
  ArrowLeft, Printer, Edit, Phone, MapPin, Calendar, AlertTriangle,
  Stethoscope, Pill, FlaskConical, Clock, Loader2, ImageIcon, FileText, Eye, FileDown,
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { PatientPDFExport } from '@/components/patient/PatientPDFExport';
import { cn } from '@/lib/utils';
import { usePatient } from '@/hooks/usePatients';
import { useVisits } from '@/hooks/useVisits';
import { useConsultations } from '@/hooks/useConsultations';
import { usePrescriptions } from '@/hooks/usePrescriptions';
import { useLabRequests } from '@/hooks/useLabRequests';
import { useImagingRequests } from '@/hooks/useImagingRequests';

const PatientDetail = () => {
  const { id } = useParams();
  const { data: patient, isLoading: patientLoading } = usePatient(id);
  const { data: allVisits, isLoading: visitsLoading } = useVisits();
  const { data: consultations } = useConsultations(id);
  const { data: allPrescriptions } = usePrescriptions();
  const { data: allLabRequests } = useLabRequests();
  const { data: allImagingRequests } = useImagingRequests();

  const patientVisits = (allVisits || []).filter(v => v.patient_id === id);
  const patientLabs = (allLabRequests || []).filter(r => r.patient_id === id);
  const patientImaging = (allImagingRequests || []).filter(r => r.patient_id === id);

  // Get prescriptions for this patient's consultations
  const patientConsultationIds = (consultations || []).map(c => c.id);
  const patientPrescriptions = (allPrescriptions || []).filter(
    p => patientConsultationIds.includes(p.consultation_id)
  );

  if (patientLoading || visitsLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

  if (!patient) {
    return (
      <AppLayout>
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
          <h2 className="text-xl font-semibold mb-2">Patient non trouvé</h2>
          <p className="text-muted-foreground mb-4">Le patient demandé n'existe pas.</p>
          <Button asChild><Link to="/patients">Retour à la liste</Link></Button>
        </div>
      </AppLayout>
    );
  }

  const calculateAge = (dateOfBirth: string) => {
    const today = new Date();
    const birth = new Date(dateOfBirth);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) age--;
    return age;
  };

  const formatDate = (dateStr: string) => new Date(dateStr).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' });

  const formatDateTime = (dateStr: string) => new Date(dateStr).toLocaleString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

  // Group prescriptions by consultation
  const prescriptionsByConsultation = patientPrescriptions.reduce((acc, p) => {
    if (!acc[p.consultation_id]) acc[p.consultation_id] = [];
    acc[p.consultation_id].push(p);
    return acc;
  }, {} as Record<string, typeof patientPrescriptions>);

  return (
    <AppLayout>
      <div className="p-6 lg:p-8">
        <div className="mb-6">
          <Button variant="ghost" size="sm" asChild className="mb-4 no-print">
            <Link to="/patients"><ArrowLeft className="mr-2 h-4 w-4" />Retour à la liste</Link>
          </Button>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Left Column - Patient Card */}
          <div className="lg:col-span-1 space-y-6">
            <Card>
              <CardContent className="pt-6">
                <div className="flex flex-col items-center text-center">
                  <Avatar className="h-20 w-20 mb-4">
                    <AvatarFallback className={cn('text-2xl font-semibold', patient.gender === 'F' ? 'bg-pink-100 text-pink-700' : 'bg-blue-100 text-blue-700')}>
                      {patient.first_name[0]}{patient.last_name[0]}
                    </AvatarFallback>
                  </Avatar>
                  <h2 className="text-xl font-bold">{patient.first_name} {patient.last_name}</h2>
                  <p className="text-sm text-muted-foreground mb-3">
                    {calculateAge(patient.date_of_birth)} ans • {patient.gender === 'F' ? 'Féminin' : 'Masculin'}
                  </p>
                  <div className="flex gap-2 mb-4">
                    {patient.blood_type && <Badge variant="secondary" className="bg-destructive/10 text-destructive">{patient.blood_type}</Badge>}
                    <Badge variant="outline">{patient.code}</Badge>
                  </div>
                  <div className="qr-container border-2 border-dashed border-primary/30 rounded-xl p-4 mb-4">
                    <QRCodeSVG value={patient.code} size={140} level="H" includeMargin={false} />
                    <p className="text-xs text-muted-foreground mt-2 font-mono">{patient.code}</p>
                  </div>
                  <div className="flex gap-2 w-full no-print">
                    <Button variant="outline" className="flex-1 gap-2" onClick={() => window.print()}>
                      <Printer className="h-4 w-4" />Imprimer
                    </Button>
                    <PatientPDFExport
                      patient={patient}
                      consultations={consultations || []}
                      prescriptions={patientPrescriptions}
                      labRequests={patientLabs}
                      imagingRequests={patientImaging}
                      visits={patientVisits}
                    />
                  </div>
                </div>

                <Separator className="my-6" />

                <div className="space-y-3">
                  <div className="flex items-center gap-3 text-sm"><Phone className="h-4 w-4 text-muted-foreground" /><span>{patient.phone}</span></div>
                  {patient.address && <div className="flex items-start gap-3 text-sm"><MapPin className="h-4 w-4 text-muted-foreground mt-0.5" /><span>{patient.address}</span></div>}
                  <div className="flex items-center gap-3 text-sm"><Calendar className="h-4 w-4 text-muted-foreground" /><span>Né(e) le {formatDate(patient.date_of_birth)}</span></div>
                </div>

                {patient.allergies && patient.allergies.length > 0 && (
                  <>
                    <Separator className="my-4" />
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <AlertTriangle className="h-4 w-4 text-destructive" />
                        <span className="text-sm font-medium text-destructive">Allergies</span>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {patient.allergies.map((allergy, index) => (
                          <Badge key={index} variant="destructive" className="text-xs">{allergy}</Badge>
                        ))}
                      </div>
                    </div>
                  </>
                )}

                {patient.emergency_contact_name && (
                  <>
                    <Separator className="my-4" />
                    <div>
                      <p className="text-sm font-medium mb-2">Contact d'urgence</p>
                      <div className="text-sm text-muted-foreground">
                        <p>{patient.emergency_contact_name}</p>
                        {patient.emergency_contact_phone && <p>{patient.emergency_contact_phone}</p>}
                        {patient.emergency_contact_relationship && <p className="text-xs">{patient.emergency_contact_relationship}</p>}
                      </div>
                    </div>
                  </>
                )}

                {/* Summary stats */}
                <Separator className="my-4" />
                <div className="grid grid-cols-2 gap-3">
                  <div className="text-center p-2 bg-muted/30 rounded-lg">
                    <p className="text-lg font-bold">{patientVisits.length}</p>
                    <p className="text-xs text-muted-foreground">Visites</p>
                  </div>
                  <div className="text-center p-2 bg-muted/30 rounded-lg">
                    <p className="text-lg font-bold">{(consultations || []).length}</p>
                    <p className="text-xs text-muted-foreground">Consultations</p>
                  </div>
                  <div className="text-center p-2 bg-muted/30 rounded-lg">
                    <p className="text-lg font-bold">{patientLabs.length}</p>
                    <p className="text-xs text-muted-foreground">Analyses</p>
                  </div>
                  <div className="text-center p-2 bg-muted/30 rounded-lg">
                    <p className="text-lg font-bold">{patientImaging.length}</p>
                    <p className="text-xs text-muted-foreground">Imageries</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Tabs */}
          <div className="lg:col-span-2">
            <Tabs defaultValue="consultations" className="w-full">
              <TabsList className="grid w-full grid-cols-5 no-print">
                <TabsTrigger value="consultations" className="gap-1.5 text-xs">
                  <Stethoscope className="h-3.5 w-3.5" />Consultations
                </TabsTrigger>
                <TabsTrigger value="prescriptions" className="gap-1.5 text-xs">
                  <Pill className="h-3.5 w-3.5" />Ordonnances
                </TabsTrigger>
                <TabsTrigger value="analyses" className="gap-1.5 text-xs">
                  <FlaskConical className="h-3.5 w-3.5" />Analyses
                </TabsTrigger>
                <TabsTrigger value="imagerie" className="gap-1.5 text-xs">
                  <ImageIcon className="h-3.5 w-3.5" />Imagerie
                </TabsTrigger>
                <TabsTrigger value="historique" className="gap-1.5 text-xs">
                  <Clock className="h-3.5 w-3.5" />Visites
                </TabsTrigger>
              </TabsList>

              {/* Consultations Tab */}
              <TabsContent value="consultations" className="mt-6">
                <Card>
                  <CardHeader className="flex-row items-center justify-between">
                    <div>
                      <CardTitle>Consultations</CardTitle>
                      <CardDescription>{(consultations || []).length} consultation(s) — Historique complet</CardDescription>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {(!consultations || consultations.length === 0) ? (
                      <div className="text-center py-8 text-muted-foreground">Aucune consultation enregistrée</div>
                    ) : (
                      <div className="space-y-4">
                        {consultations.map((c) => {
                          const consultPrescriptions = prescriptionsByConsultation[c.id] || [];
                          return (
                            <div key={c.id} className="p-4 border rounded-lg bg-muted/30">
                              <div className="flex items-center justify-between mb-3">
                                <div>
                                  <p className="font-semibold text-base">{c.diagnosis || 'Diagnostic non renseigné'}</p>
                                  <p className="text-xs text-muted-foreground">{formatDateTime(c.date)}</p>
                                </div>
                                <Badge variant={c.status === 'termine' ? 'default' : 'secondary'}>
                                  {c.status === 'termine' ? 'Terminée' : 'En cours'}
                                </Badge>
                              </div>

                              {c.symptoms && (
                                <div className="mb-2">
                                  <p className="text-xs font-medium text-muted-foreground">Symptômes</p>
                                  <p className="text-sm">{c.symptoms}</p>
                                </div>
                              )}

                              {c.notes && (
                                <div className="mb-2">
                                  <p className="text-xs font-medium text-muted-foreground">Notes</p>
                                  <p className="text-sm">{c.notes}</p>
                                </div>
                              )}

                              {/* Vitals */}
                              {(c.temperature || c.heart_rate || c.blood_pressure || c.weight || c.height) && (
                                <div className="flex flex-wrap gap-2 mt-2 mb-2">
                                  {c.temperature && <Badge variant="outline" className="text-xs">🌡️ {c.temperature}°C</Badge>}
                                  {c.heart_rate && <Badge variant="outline" className="text-xs">❤️ {c.heart_rate} bpm</Badge>}
                                  {c.blood_pressure && <Badge variant="outline" className="text-xs">🩸 {c.blood_pressure}</Badge>}
                                  {c.weight && <Badge variant="outline" className="text-xs">⚖️ {c.weight} kg</Badge>}
                                  {c.height && <Badge variant="outline" className="text-xs">📏 {c.height} cm</Badge>}
                                </div>
                              )}

                              {/* Prescriptions for this consultation */}
                              {consultPrescriptions.length > 0 && (
                                <div className="mt-3 p-3 bg-background rounded border">
                                  <p className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1">
                                    <Pill className="h-3 w-3" /> Ordonnance ({consultPrescriptions.length} médicament(s))
                                  </p>
                                  <div className="space-y-2">
                                    {consultPrescriptions.map((p: any) => (
                                      <div key={p.id} className="flex items-center justify-between text-sm">
                                        <div>
                                          <span className="font-medium">{p.medications?.name || 'Médicament'}</span>
                                          <span className="text-muted-foreground ml-2">{p.dosage} • {p.frequency} • {p.duration}</span>
                                        </div>
                                        <Badge variant={p.dispensed ? 'default' : 'outline'} className="text-[10px]">
                                          {p.dispensed ? 'Délivré' : 'En attente'}
                                        </Badge>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Prescriptions Tab */}
              <TabsContent value="prescriptions" className="mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Toutes les ordonnances</CardTitle>
                    <CardDescription>{patientPrescriptions.length} prescription(s) au total</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {patientPrescriptions.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">Aucune prescription enregistrée</div>
                    ) : (
                      <div className="space-y-3">
                        {patientPrescriptions.map((p: any) => {
                          const consultation = (consultations || []).find(c => c.id === p.consultation_id);
                          return (
                            <div key={p.id} className="flex items-center gap-4 p-3 border rounded-lg">
                              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                                <Pill className="h-5 w-5 text-primary" />
                              </div>
                              <div className="flex-1">
                                <p className="font-medium">{p.medications?.name || 'Médicament'}</p>
                                <p className="text-xs text-muted-foreground">{p.dosage} • {p.frequency} • {p.duration}</p>
                                {p.instructions && <p className="text-xs text-muted-foreground italic mt-0.5">"{p.instructions}"</p>}
                                <p className="text-xs text-muted-foreground mt-0.5">
                                  Consultation du {consultation ? formatDate(consultation.date) : 'N/A'}
                                  {consultation?.diagnosis && ` — ${consultation.diagnosis}`}
                                </p>
                              </div>
                              <div className="text-right">
                                <Badge variant={p.dispensed ? 'default' : 'outline'} className="text-[10px]">
                                  {p.dispensed ? 'Délivré' : 'En attente'}
                                </Badge>
                                {p.dispensed_at && (
                                  <p className="text-[10px] text-muted-foreground mt-1">
                                    le {formatDate(p.dispensed_at)}
                                  </p>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Lab Results Tab */}
              <TabsContent value="analyses" className="mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Résultats d'analyses</CardTitle>
                    <CardDescription>{patientLabs.length} analyse(s) — Historique complet</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {patientLabs.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">Aucun résultat disponible</div>
                    ) : (
                      <div className="space-y-4">
                        {patientLabs.map((lab) => (
                          <div key={lab.id} className={cn('p-4 border rounded-lg', lab.status === 'termine' ? 'bg-success/5 border-success/20' : 'bg-muted/30')}>
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <FlaskConical className="h-4 w-4 text-primary" />
                                <p className="font-semibold">{lab.test_type}</p>
                                {lab.priority === 'urgente' && <Badge variant="destructive" className="text-[10px]">URGENT</Badge>}
                              </div>
                              <Badge variant={lab.status === 'termine' ? 'default' : lab.status === 'en_cours' ? 'secondary' : 'outline'}>
                                {lab.status === 'termine' ? 'Terminé' : lab.status === 'en_cours' ? 'En cours' : 'Demandé'}
                              </Badge>
                            </div>
                            {lab.results && (
                              <div className="p-3 bg-background rounded border text-sm mt-2">
                                <p className="whitespace-pre-wrap">{lab.results}</p>
                              </div>
                            )}
                            <div className="flex gap-4 text-xs text-muted-foreground mt-2">
                              <span>Demandé le {formatDateTime(lab.requested_at)}</span>
                              {lab.completed_at && <span>• Terminé le {formatDateTime(lab.completed_at)}</span>}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Imaging Tab */}
              <TabsContent value="imagerie" className="mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Examens d'imagerie</CardTitle>
                    <CardDescription>{patientImaging.length} examen(s) — Historique complet</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {patientImaging.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">Aucun examen d'imagerie</div>
                    ) : (
                      <div className="space-y-4">
                        {patientImaging.map((img) => (
                          <div key={img.id} className={cn('p-4 border rounded-lg', img.status === 'termine' ? 'bg-success/5 border-success/20' : 'bg-muted/30')}>
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <ImageIcon className="h-4 w-4 text-primary" />
                                <p className="font-semibold">{img.exam_type}</p>
                                <Badge variant="outline" className="text-xs">{img.body_part}</Badge>
                                {img.priority === 'urgente' && <Badge variant="destructive" className="text-[10px]">URGENT</Badge>}
                              </div>
                              <Badge variant={img.status === 'termine' ? 'default' : img.status === 'en_cours' ? 'secondary' : 'outline'}>
                                {img.status === 'termine' ? 'Terminé' : img.status === 'en_cours' ? 'En cours' : 'Demandé'}
                              </Badge>
                            </div>
                            {img.report && (
                              <div className="p-3 bg-background rounded border text-sm mt-2">
                                <p className="text-xs font-medium text-muted-foreground mb-1">Compte rendu :</p>
                                <p className="whitespace-pre-wrap">{img.report}</p>
                              </div>
                            )}
                            <div className="flex gap-4 text-xs text-muted-foreground mt-2">
                              <span>Demandé le {formatDateTime(img.requested_at)}</span>
                              {img.completed_at && <span>• Réalisé le {formatDateTime(img.completed_at)}</span>}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Visits History Tab */}
              <TabsContent value="historique" className="mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Historique des visites</CardTitle>
                    <CardDescription>{patientVisits.length} visite(s) enregistrée(s)</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {patientVisits.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">Aucune visite enregistrée</div>
                    ) : (
                      <div className="space-y-4">
                        {patientVisits.map((visit) => (
                          <div key={visit.id} className="flex items-center gap-4 p-4 rounded-lg border bg-muted/30">
                            <div className={cn('h-10 w-10 rounded-full flex items-center justify-center', visit.type === 'urgence' ? 'bg-destructive/10' : 'bg-primary/10')}>
                              <Stethoscope className={cn('h-5 w-5', visit.type === 'urgence' ? 'text-destructive' : 'text-primary')} />
                            </div>
                            <div className="flex-1">
                              <p className="font-medium capitalize">{visit.type}</p>
                              <p className="text-sm text-muted-foreground">{formatDateTime(visit.date)}</p>
                              {visit.notes && <p className="text-xs text-muted-foreground mt-1">{visit.notes}</p>}
                            </div>
                            <Badge variant={visit.status === 'termine' ? 'default' : visit.status === 'en_cours' ? 'secondary' : 'outline'}>
                              {visit.status.replace('_', ' ')}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>

        {/* Print-only Patient Card */}
        <div className="print-only mt-8">
          <div className="patient-card-print mx-auto">
            <div className="flex items-start justify-between h-full">
              <div className="flex-1">
                <h3 className="font-bold text-lg text-primary mb-1">SantéPro</h3>
                <p className="text-xs text-muted-foreground mb-3">Clinique Médicale</p>
                <div className="space-y-1">
                  <p className="font-semibold">{patient.first_name} {patient.last_name}</p>
                  <p className="text-sm text-muted-foreground">
                    {calculateAge(patient.date_of_birth)} ans • {patient.gender === 'F' ? 'F' : 'M'}
                    {patient.blood_type && ` • ${patient.blood_type}`}
                  </p>
                  <p className="text-xs font-mono mt-2">{patient.code}</p>
                </div>
              </div>
              <div className="flex flex-col items-center">
                <QRCodeSVG value={patient.code} size={80} level="H" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default PatientDetail;
