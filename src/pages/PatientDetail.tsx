import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { AppLayout, PageHeader } from '@/components/layout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from '@/components/ui/card';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from '@/components/ui/dialog';
import {
  ArrowLeft, Printer, Phone, MapPin, Calendar, AlertTriangle,
  Stethoscope, Pill, FlaskConical, Clock, Loader2, ImageIcon, FileDown, MessageSquarePlus, Send, RotateCcw, Pencil, Camera, Skull, FileText, BedDouble,
} from 'lucide-react';
import { EditPatientDialog } from '@/components/patient/EditPatientDialog';
import { EditConsultationDialog } from '@/components/consultation/EditConsultationDialog';
import { Consultation } from '@/hooks/useConsultations';
import { DeclareDeceasedDialog } from '@/components/patient/DeclareDeceasedDialog';
import { DeceasedPatientActions } from '@/components/patient/DeceasedPatientActions';
import { QRCodeSVG } from 'qrcode.react';
import { PatientPDFExport } from '@/components/patient/PatientPDFExport';
import { cn } from '@/lib/utils';
import { usePatient } from '@/hooks/usePatients';
import { useVisits, useUpdateVisit } from '@/hooks/useVisits';
import { useConsultations, useUpdateConsultation } from '@/hooks/useConsultations';
import { usePrescriptions } from '@/hooks/usePrescriptions';
import { useLabRequests } from '@/hooks/useLabRequests';
import { useImagingRequests } from '@/hooks/useImagingRequests';
import { useAuth } from '@/hooks/useAuth';
import { useHospitalizations } from '@/hooks/useHospitalizations';
import { toast } from 'sonner';

const PatientDetail = () => {
  const { id } = useParams();
  const { user, role } = useAuth();
  const { data: patient, isLoading: patientLoading } = usePatient(id);
  const { data: allVisits, isLoading: visitsLoading } = useVisits();
  const { data: consultations } = useConsultations(id);
  const { data: allPrescriptions } = usePrescriptions();
  const { data: allLabRequests } = useLabRequests();
  const { data: allImagingRequests } = useImagingRequests();
  const { data: allHospitalizations } = useHospitalizations();
  const updateConsultation = useUpdateConsultation();
  const updateVisit = useUpdateVisit();

  const [followUpDialogOpen, setFollowUpDialogOpen] = useState(false);
  const [selectedConsultationId, setSelectedConsultationId] = useState<string | null>(null);
  const [followUpNote, setFollowUpNote] = useState('');
  const [isReopening, setIsReopening] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editConsultation, setEditConsultation] = useState<Consultation | null>(null);
  const [editConsultationOpen, setEditConsultationOpen] = useState(false);
  const [deceasedDialogOpen, setDeceasedDialogOpen] = useState(false);
  const [deceasedActionsOpen, setDeceasedActionsOpen] = useState(false);

  const handleReopenConsultation = async (consultationId: string, visitId: string) => {
    setIsReopening(true);
    try {
      await updateConsultation.mutateAsync({ id: consultationId, status: 'en_cours' });
      await updateVisit.mutateAsync({ id: visitId, status: 'en_cours' });
      toast.success('Consultation rouverte — le patient est de retour dans la file d\'attente');
    } catch (e: any) {
      toast.error('Erreur: ' + e.message);
    } finally {
      setIsReopening(false);
    }
  };

  const patientVisits = (allVisits || []).filter(v => v.patient_id === id);
  const patientLabs = (allLabRequests || []).filter(r => r.patient_id === id);
  const patientImaging = (allImagingRequests || []).filter(r => r.patient_id === id);
  const patientHospitalizations = (allHospitalizations || []).filter(h => h.patient_id === id);

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

  const prescriptionsByConsultation = patientPrescriptions.reduce((acc, p) => {
    if (!acc[p.consultation_id]) acc[p.consultation_id] = [];
    acc[p.consultation_id].push(p);
    return acc;
  }, {} as Record<string, typeof patientPrescriptions>);

  const handleOpenFollowUp = (consultationId: string) => {
    setSelectedConsultationId(consultationId);
    setFollowUpNote('');
    setFollowUpDialogOpen(true);
  };

  const handleSaveFollowUp = async () => {
    if (!selectedConsultationId || !followUpNote.trim()) return;
    const consultation = (consultations || []).find(c => c.id === selectedConsultationId);
    if (!consultation) return;

    const existingNotes = Array.isArray(consultation.follow_up_notes) ? consultation.follow_up_notes : [];
    const newNote = {
      date: new Date().toISOString(),
      author: user?.email || 'Médecin',
      text: followUpNote.trim(),
    };
    const updatedNotes = [...existingNotes, newNote];

    try {
      await updateConsultation.mutateAsync({
        id: selectedConsultationId,
        follow_up_notes: updatedNotes as any,
      });
      toast.success('Commentaire de suivi ajouté');
      setFollowUpDialogOpen(false);
    } catch {
      toast.error("Erreur lors de l'ajout du commentaire");
    }
  };

  const handlePrintPrescriptions = (consultationId: string) => {
    const presc = prescriptionsByConsultation[consultationId] || [];
    if (presc.length === 0) return;
    const consultation = (consultations || []).find(c => c.id === consultationId);
    const html = `
      <html><head><title>Ordonnance</title>
      <style>
        body { font-family: 'Segoe UI', sans-serif; padding: 40px; max-width: 700px; margin: 0 auto; }
        h1 { font-size: 20px; color: #1a365d; border-bottom: 2px solid #1a365d; padding-bottom: 8px; }
        .header { text-align: center; margin-bottom: 30px; }
        .header h2 { margin: 0; font-size: 24px; color: #1a365d; }
        .header p { margin: 2px 0; color: #666; font-size: 12px; }
        .patient-info { background: #f7fafc; padding: 12px 16px; border-radius: 8px; margin-bottom: 20px; }
        .patient-info p { margin: 4px 0; font-size: 14px; }
        .med { padding: 12px 0; border-bottom: 1px dashed #e2e8f0; }
        .med:last-child { border-bottom: none; }
        .med-name { font-weight: 700; font-size: 15px; }
        .med-detail { color: #555; font-size: 13px; margin-top: 4px; }
        .med-instructions { font-style: italic; color: #888; font-size: 12px; margin-top: 2px; }
        .footer { margin-top: 40px; display: flex; justify-content: space-between; }
        .footer div { text-align: center; }
        .footer .line { border-top: 1px solid #333; width: 200px; margin-top: 60px; padding-top: 5px; font-size: 12px; }
        @media print { body { padding: 20px; } }
      </style></head><body>
      <div class="header">
        <h2>ATSanté</h2>
        <p>Centre Médical</p>
        <p>Ordonnance Médicale</p>
      </div>
      <div class="patient-info">
        <p><strong>Patient :</strong> ${patient.first_name} ${patient.last_name}</p>
        <p><strong>Code :</strong> ${patient.code}</p>
        <p><strong>Diagnostic :</strong> ${consultation?.diagnosis || 'N/A'}</p>
        <p><strong>Date :</strong> ${consultation ? formatDate(consultation.date) : formatDate(new Date().toISOString())}</p>
      </div>
      <h1>Prescription</h1>
      ${presc.map((p: any, i: number) => {
        const medName = p.medication_name || p.medications?.name || 'Médicament';
        return `<div class="med">
          <div class="med-name">${i + 1}. ${medName}</div>
          <div class="med-detail">${p.dosage} — ${p.frequency} — ${p.duration}</div>
          ${p.instructions ? `<div class="med-instructions">"${p.instructions}"</div>` : ''}
        </div>`;
      }).join('')}
      <div class="footer">
        <div><div class="line">Date et cachet</div></div>
        <div><div class="line">Signature du médecin</div></div>
      </div>
      </body></html>`;
    const w = window.open('', '_blank');
    if (w) { w.document.write(html); w.document.close(); w.print(); }
  };

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
                  <div className="relative group mb-4">
                    <Avatar className="h-20 w-20">
                      {(patient as any).photo_url && (
                        <AvatarImage src={(patient as any).photo_url} alt={`${patient.first_name} ${patient.last_name}`} />
                      )}
                      <AvatarFallback className={cn('text-2xl font-semibold', patient.gender === 'F' ? 'bg-pink-100 text-pink-700' : 'bg-blue-100 text-blue-700')}>
                        {patient.first_name[0]}{patient.last_name[0]}
                      </AvatarFallback>
                    </Avatar>
                    <button
                      type="button"
                      onClick={() => setEditDialogOpen(true)}
                      className="absolute bottom-0 right-0 h-7 w-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-md"
                      title="Modifier la photo"
                    >
                      <Camera className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <h2 className="text-xl font-bold">{patient.first_name} {patient.last_name}</h2>
                  <p className="text-sm text-muted-foreground mb-3">{calculateAge(patient.date_of_birth)} ans • {patient.gender === 'F' ? 'Féminin' : 'Masculin'}</p>
                  <div className="flex gap-2 mb-4">
                    {patient.blood_type && <Badge variant="secondary" className="bg-destructive/10 text-destructive">{patient.blood_type}</Badge>}
                    <Badge variant="outline">{patient.code}</Badge>
                  </div>
                  <div className="qr-container border-2 border-dashed border-primary/30 rounded-xl p-4 mb-4">
                    <QRCodeSVG value={patient.code} size={140} level="H" includeMargin={false} />
                    <p className="text-xs text-muted-foreground mt-2 font-mono">{patient.code}</p>
                  </div>
                  {!(patient as any).is_deceased ? (
                    <>
                      <div className="flex gap-2 w-full no-print">
                        <Button variant="outline" className="flex-1 gap-2" onClick={() => setEditDialogOpen(true)}>
                          <Pencil className="h-4 w-4" />Modifier
                        </Button>
                        <Button variant="outline" className="flex-1 gap-2" onClick={() => window.print()}>
                          <Printer className="h-4 w-4" />Imprimer
                        </Button>
                      </div>
                      <div className="mt-2 w-full no-print">
                        <PatientPDFExport
                          patient={patient}
                          consultations={consultations || []}
                          prescriptions={patientPrescriptions}
                          labRequests={patientLabs}
                          imagingRequests={patientImaging}
                          visits={patientVisits}
                        />
                      </div>
                      <div className="mt-2 w-full no-print">
                        <Button
                          variant="outline"
                          className="w-full gap-2 text-destructive border-destructive/30 hover:bg-destructive/10"
                          onClick={() => setDeceasedDialogOpen(true)}
                        >
                          <Skull className="h-4 w-4" />Déclarer décédé
                        </Button>
                      </div>
                    </>
                  ) : (
                    <>
                      <Badge variant="destructive" className="mb-2">Décédé(e)</Badge>
                      <div className="flex gap-2 w-full no-print">
                        <Button variant="outline" className="flex-1 gap-2" onClick={() => setDeceasedActionsOpen(true)}>
                          <FileText className="h-4 w-4" />Certificats
                        </Button>
                        <Button variant="outline" className="flex-1 gap-2" onClick={() => window.print()}>
                          <Printer className="h-4 w-4" />Imprimer
                        </Button>
                      </div>
                    </>
                  )}
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

                <Separator className="my-4" />
                <div className="grid grid-cols-3 gap-3">
                  <div className="text-center p-2 bg-muted/30 rounded-lg">
                    <p className="text-lg font-bold">{patientVisits.length}</p>
                    <p className="text-xs text-muted-foreground">Visites</p>
                  </div>
                  <div className="text-center p-2 bg-muted/30 rounded-lg">
                    <p className="text-lg font-bold">{(consultations || []).length}</p>
                    <p className="text-xs text-muted-foreground">Consultations</p>
                  </div>
                  <div className="text-center p-2 bg-muted/30 rounded-lg">
                    <p className="text-lg font-bold">{patientHospitalizations.length}</p>
                    <p className="text-xs text-muted-foreground">Hospit.</p>
                  </div>
                  <div className="text-center p-2 bg-muted/30 rounded-lg">
                    <p className="text-lg font-bold">{patientLabs.length}</p>
                    <p className="text-xs text-muted-foreground">Analyses</p>
                  </div>
                  <div className="text-center p-2 bg-muted/30 rounded-lg">
                    <p className="text-lg font-bold">{patientImaging.length}</p>
                    <p className="text-xs text-muted-foreground">Imageries</p>
                  </div>
                  <div className="text-center p-2 bg-muted/30 rounded-lg">
                    <p className="text-lg font-bold">{patientPrescriptions.length}</p>
                    <p className="text-xs text-muted-foreground">Prescriptions</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Tabs */}
          <div className="lg:col-span-2">
            {/* Medical tabs hidden from non-medical roles (accueil, caissier, admin, daf) */}
            {(role === 'medecin' || role === 'infirmier' || role === 'pharmacien' || role === 'laborantin' || role === 'imagerie') ? (
            <Tabs defaultValue="consultations" className="w-full">
              <TabsList className="grid w-full grid-cols-6 no-print">
                <TabsTrigger value="consultations" className="gap-1.5 text-xs"><Stethoscope className="h-3.5 w-3.5" />Consultations</TabsTrigger>
                {(role === 'medecin' || role === 'infirmier' || role === 'pharmacien') && (
                  <TabsTrigger value="prescriptions" className="gap-1.5 text-xs"><Pill className="h-3.5 w-3.5" />Ordonnances</TabsTrigger>
                )}
                {(role === 'medecin' || role === 'infirmier' || role === 'laborantin') && (
                  <TabsTrigger value="analyses" className="gap-1.5 text-xs"><FlaskConical className="h-3.5 w-3.5" />Analyses</TabsTrigger>
                )}
                {(role === 'medecin' || role === 'infirmier' || role === 'imagerie') && (
                  <TabsTrigger value="imagerie" className="gap-1.5 text-xs"><ImageIcon className="h-3.5 w-3.5" />Imagerie</TabsTrigger>
                )}
                {(role === 'medecin' || role === 'infirmier') && (
                  <TabsTrigger value="hospitalisation" className="gap-1.5 text-xs"><BedDouble className="h-3.5 w-3.5" />Hospit.</TabsTrigger>
                )}
                <TabsTrigger value="historique" className="gap-1.5 text-xs"><Clock className="h-3.5 w-3.5" />Visites</TabsTrigger>
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
                          const followUpNotes = Array.isArray(c.follow_up_notes) ? c.follow_up_notes : [];
                          return (
                            <div key={c.id} className="p-4 border rounded-lg bg-muted/30">
                              <div className="flex items-center justify-between mb-3">
                                <div>
                                  <p className="font-semibold text-base">{c.diagnosis || 'Diagnostic non renseigné'}</p>
                                  <p className="text-xs text-muted-foreground">{formatDateTime(c.date)}</p>
                                </div>
                                <div className="flex items-center gap-2">
                                  {c.status === 'termine' && role === 'medecin' && (
                                    <Button variant="ghost" size="sm" className="gap-1 text-xs" onClick={() => handleReopenConsultation(c.id, c.visit_id)} disabled={isReopening}>
                                      {isReopening ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RotateCcw className="h-3.5 w-3.5" />}
                                      Rouvrir
                                    </Button>
                                  )}
                                  <Button variant="ghost" size="sm" className="gap-1 text-xs" onClick={() => handleOpenFollowUp(c.id)}>
                                    <MessageSquarePlus className="h-3.5 w-3.5" />Suivi
                                  </Button>
                                  {consultPrescriptions.length > 0 && (
                                    <Button variant="ghost" size="sm" className="gap-1 text-xs" onClick={() => handlePrintPrescriptions(c.id)}>
                                      <Printer className="h-3.5 w-3.5" />Ordonnance
                                    </Button>
                                  )}
                                  <Badge variant={c.status === 'termine' ? 'default' : 'secondary'}>
                                    {c.status === 'termine' ? 'Terminée' : 'En cours'}
                                  </Badge>
                                </div>
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

                              {(c.temperature || c.heart_rate || c.blood_pressure || c.weight || c.height) && (
                                <div className="flex flex-wrap gap-2 mt-2 mb-2">
                                  {c.temperature && <Badge variant="outline" className="text-xs">🌡️ {c.temperature}°C</Badge>}
                                  {c.heart_rate && <Badge variant="outline" className="text-xs">❤️ {c.heart_rate} bpm</Badge>}
                                  {c.blood_pressure && <Badge variant="outline" className="text-xs">🩸 {c.blood_pressure}</Badge>}
                                  {c.weight && <Badge variant="outline" className="text-xs">⚖️ {c.weight} kg</Badge>}
                                  {c.height && <Badge variant="outline" className="text-xs">📏 {c.height} cm</Badge>}
                                </div>
                              )}

                              {/* Prescriptions */}
                              {consultPrescriptions.length > 0 && (
                                <div className="mt-3 p-3 bg-background rounded border">
                                  <p className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1">
                                    <Pill className="h-3 w-3" /> Ordonnance ({consultPrescriptions.length} médicament(s))
                                  </p>
                                  <div className="space-y-2">
                                    {consultPrescriptions.map((p: any) => (
                                      <div key={p.id} className="flex items-center justify-between text-sm">
                                        <div>
                                          <span className="font-medium">{p.medication_name || p.medications?.name || 'Médicament'}</span>
                                          <span className="text-muted-foreground ml-2">{p.dosage} • {p.frequency} • {p.duration}</span>
                                        </div>
                                        <Badge variant={p.dispensed ? 'default' : 'outline'} className="text-[10px]">
                                          {p.dispensed ? 'Délivré' : p.medication_id ? 'En attente' : 'Externe'}
                                        </Badge>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {/* Follow-up notes */}
                              {followUpNotes.length > 0 && (
                                <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-950/20 rounded border border-blue-200 dark:border-blue-800">
                                  <p className="text-xs font-medium text-blue-700 dark:text-blue-300 mb-2 flex items-center gap-1">
                                    <MessageSquarePlus className="h-3 w-3" /> Notes de suivi ({followUpNotes.length})
                                  </p>
                                  <div className="space-y-2">
                                    {(followUpNotes as any[]).map((note: any, idx: number) => (
                                      <div key={idx} className="text-sm border-l-2 border-blue-300 pl-3">
                                        <p className="text-xs text-muted-foreground">{formatDateTime(note.date)} — {note.author}</p>
                                        <p className="mt-0.5">{note.text}</p>
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
                                <p className="font-medium">{p.medication_name || p.medications?.name || 'Médicament'}</p>
                                <p className="text-xs text-muted-foreground">{p.dosage} • {p.frequency} • {p.duration}</p>
                                {p.instructions && <p className="text-xs text-muted-foreground italic mt-0.5">"{p.instructions}"</p>}
                                <p className="text-xs text-muted-foreground mt-0.5">
                                  Consultation du {consultation ? formatDate(consultation.date) : 'N/A'}
                                  {consultation?.diagnosis && ` — ${consultation.diagnosis}`}
                                </p>
                              </div>
                              <div className="text-right">
                                <Badge variant={p.dispensed ? 'default' : 'outline'} className="text-[10px]">
                                  {p.dispensed ? 'Délivré' : p.medication_id ? 'En attente' : 'Externe'}
                                </Badge>
                                {p.dispensed_at && (
                                  <p className="text-[10px] text-muted-foreground mt-1">le {formatDate(p.dispensed_at)}</p>
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

              {/* Hospitalizations Tab */}
              <TabsContent value="hospitalisation" className="mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Hospitalisations</CardTitle>
                    <CardDescription>{patientHospitalizations.length} hospitalisation(s)</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {patientHospitalizations.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">Aucune hospitalisation enregistrée</div>
                    ) : (
                      <div className="space-y-4">
                        {patientHospitalizations.map((h) => (
                          <div key={h.id} className={cn('p-4 border rounded-lg', h.status === 'en_cours' ? 'bg-warning/5 border-warning/30' : h.status === 'termine' ? 'bg-success/5 border-success/20' : 'bg-muted/30')}>
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <BedDouble className="h-4 w-4 text-primary" />
                                <p className="font-semibold">{h.reason}</p>
                              </div>
                              <Badge variant={h.status === 'en_cours' ? 'secondary' : h.status === 'termine' ? 'default' : 'outline'}>
                                {h.status === 'en_cours' ? 'En cours' : h.status === 'termine' ? 'Terminée' : 'Annulée'}
                              </Badge>
                            </div>
                            {h.rooms && (
                              <p className="text-sm text-muted-foreground">
                                Chambre {h.rooms.room_number} — {h.rooms.category.replace('_', ' ')} — {h.rooms.comfort === 'climatise' ? 'Climatisé' : 'Ventilé'}
                              </p>
                            )}
                            <div className="flex gap-4 text-xs text-muted-foreground mt-2">
                              <span>Admis le {new Date(h.admission_date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                              {h.discharge_date && <span>• Sorti le {new Date(h.discharge_date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })}</span>}
                            </div>
                            {h.discharge_notes && (
                              <div className="mt-2 p-2 bg-background rounded border text-sm">
                                <p className="text-xs font-medium text-muted-foreground mb-1">Notes de sortie</p>
                                <p>{h.discharge_notes}</p>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

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
            ) : (
              <Card>
                <CardContent className="py-12 text-center text-muted-foreground">
                  <Stethoscope className="h-12 w-12 mx-auto mb-4 opacity-30" />
                  <p className="text-lg font-medium">Accès restreint</p>
                  <p className="text-sm mt-1">Les données médicales ne sont pas accessibles pour votre rôle.</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Print-only Patient Card (PVC format) */}
        <div className="print-only mt-8">
          <div className="patient-card-print mx-auto" style={{ width: '85.6mm', height: '54mm', padding: '5mm', border: '1px solid #ccc', borderRadius: '3mm', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '3mm' }}>
                {(patient as any).photo_url ? (
                  <img src={(patient as any).photo_url} alt="" style={{ width: '18mm', height: '18mm', borderRadius: '50%', objectFit: 'cover', border: '1px solid #ccc' }} />
                ) : (
                  <div style={{ width: '18mm', height: '18mm', borderRadius: '50%', background: '#e5e7eb', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: 'bold', color: '#6b7280' }}>
                    {patient.first_name[0]}{patient.last_name[0]}
                  </div>
                )}
                <div>
                  <p style={{ fontWeight: 'bold', fontSize: '11px', margin: 0 }}>{patient.first_name} {patient.last_name}</p>
                  <p style={{ fontSize: '9px', color: '#6b7280', margin: '1mm 0 0 0' }}>
                    {calculateAge(patient.date_of_birth)} ans • {patient.gender === 'F' ? 'F' : 'M'}
                    {patient.blood_type && ` • ${patient.blood_type}`}
                  </p>
                </div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <QRCodeSVG value={patient.code} size={60} level="H" />
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
              <div>
                <h3 style={{ fontWeight: 'bold', fontSize: '12px', margin: 0, color: 'hsl(var(--primary))' }}>ATSanté</h3>
                <p style={{ fontSize: '8px', color: '#6b7280', margin: 0 }}>Centre Médical</p>
              </div>
              <p style={{ fontSize: '10px', fontFamily: 'monospace', fontWeight: 'bold', margin: 0 }}>{patient.code}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Follow-up Notes Dialog */}
      <Dialog open={followUpDialogOpen} onOpenChange={setFollowUpDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ajouter un commentaire de suivi</DialogTitle>
            <DialogDescription>
              Ajoutez un commentaire basé sur les résultats d'analyses ou le suivi du patient
            </DialogDescription>
          </DialogHeader>
          <Textarea
            placeholder="Ex: Résultats NFS normaux, poursuivre le traitement..."
            className="min-h-[120px]"
            value={followUpNote}
            onChange={(e) => setFollowUpNote(e.target.value)}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setFollowUpDialogOpen(false)}>Annuler</Button>
            <Button onClick={handleSaveFollowUp} disabled={!followUpNote.trim() || updateConsultation.isPending} className="gap-1.5">
              {updateConsultation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              Enregistrer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Patient Dialog */}
      {patient && (
        <>
          <EditPatientDialog patient={patient} open={editDialogOpen} onOpenChange={setEditDialogOpen} />
          <DeclareDeceasedDialog patient={patient} open={deceasedDialogOpen} onOpenChange={setDeceasedDialogOpen} />
          <DeceasedPatientActions patient={patient} open={deceasedActionsOpen} onOpenChange={setDeceasedActionsOpen} />
        </>
      )}
    </AppLayout>
  );
};

export default PatientDetail;
