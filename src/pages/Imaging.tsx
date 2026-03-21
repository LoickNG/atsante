import { useState } from 'react';
import { AppLayout, PageHeader } from '@/components/layout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from '@/components/ui/card';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  ImageIcon, Clock, Check, AlertTriangle, User, FileText, Printer, Eye, Camera, Upload, Loader2, Search,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { useImagingRequests, usePendingImagingRequests, useUpdateImagingRequest, ImagingRequestWithPatient } from '@/hooks/useImagingRequests';
import { useAuth } from '@/hooks/useAuth';
import { useClinicSettings } from '@/hooks/useClinicSettings';
import { printMultiResultDocument } from '@/utils/printResult';
import { PatientSearchSelect } from '@/components/PatientSearchSelect';
import { Patient } from '@/hooks/usePatients';
import { Link } from 'react-router-dom';

const imagingExamTypes = [
  { id: 'radio', name: 'Radiographie' },
  { id: 'echo', name: 'Échographie' },
  { id: 'scanner', name: 'Scanner' },
  { id: 'irm', name: 'IRM' },
];

const Imaging = () => {
  const [activeTab, setActiveTab] = useState('pending');
  const [selectedRequest, setSelectedRequest] = useState<ImagingRequestWithPatient | null>(null);
  const [isReportDialogOpen, setIsReportDialogOpen] = useState(false);
  const [reportText, setReportText] = useState('');
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const { user } = useAuth();
  const { data: clinicData } = useClinicSettings();

  const { data: allRequests, isLoading } = useImagingRequests();
  const { data: pendingRequests } = usePendingImagingRequests();
  const updateImagingRequest = useUpdateImagingRequest();

  const completedRequests = allRequests?.filter(r => r.status === 'termine') || [];

  const patientPendingRequests = selectedPatient
    ? (pendingRequests || []).filter(r => r.patient_id === selectedPatient.id)
    : pendingRequests;
  const patientCompletedRequests = selectedPatient
    ? completedRequests.filter(r => r.patient_id === selectedPatient.id)
    : completedRequests;

  const getExamTypeName = (examType: string) => imagingExamTypes.find(t => t.id === examType)?.name || examType;

  const formatDateTime = (dateStr: string) => new Date(dateStr).toLocaleString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });

  const handleStartExam = async (requestId: string) => {
    try {
      await updateImagingRequest.mutateAsync({ id: requestId, status: 'en_cours' });
      toast.info('Examen démarré');
    } catch { toast.error('Erreur lors du démarrage'); }
  };

  const handleOpenReportDialog = (request: ImagingRequestWithPatient) => {
    setSelectedRequest(request);
    setReportText(request.report || '');
    setIsReportDialogOpen(true);
  };

  const handleSaveReport = async () => {
    if (!selectedRequest || !reportText.trim()) { toast.error('Veuillez saisir le compte rendu'); return; }
    try {
      await updateImagingRequest.mutateAsync({
        id: selectedRequest.id, status: 'termine', report: reportText,
        performed_by: user?.id, completed_at: new Date().toISOString(),
      });
      setIsReportDialogOpen(false);
      setSelectedRequest(null);
      setReportText('');
      toast.success('Compte rendu enregistré');
    } catch { toast.error("Erreur lors de l'enregistrement"); }
  };

  const statusConfig: Record<string, { label: string; className: string; icon: any }> = {
    demande: { label: 'Nouveau', className: 'bg-warning/10 text-warning-foreground border-warning/30', icon: Clock },
    en_cours: { label: 'En cours', className: 'bg-info/10 text-info border-info/30', icon: Camera },
    termine: { label: 'Terminé', className: 'bg-success/10 text-success border-success/30', icon: Check },
    annule: { label: 'Annulé', className: 'bg-muted text-muted-foreground', icon: AlertTriangle },
  };

  const examTypeIcons: Record<string, string> = { radio: '🦴', echo: '🔊', scanner: '🔬', irm: '🧲' };

  if (isLoading) {
    return (<AppLayout><div className="p-6 lg:p-8"><div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div></div></AppLayout>);
  }

  return (
    <AppLayout>
      <div className="p-6 lg:p-8">
        <PageHeader title="Imagerie Médicale" description="Radiographie, Échographie, Scanner">
          <Button variant="outline" size="default" className="gap-2">
            <FileText className="h-4 w-4" />
            Rapport journalier
          </Button>
        </PageHeader>

        {/* Patient Search */}
        <Card className="mb-6">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Search className="h-4 w-4" />
              Rechercher un patient
            </CardTitle>
            <CardDescription>Sélectionnez un patient pour voir ses examens d'imagerie</CardDescription>
          </CardHeader>
          <CardContent>
            <PatientSearchSelect selectedPatient={selectedPatient} onSelect={setSelectedPatient} />
            {selectedPatient && (
              <div className="mt-3">
                <Button variant="link" size="sm" asChild className="p-0 h-auto">
                  <Link to={`/patients/${selectedPatient.id}`}>Voir le dossier complet →</Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Stats */}
        <div className="grid gap-4 sm:grid-cols-3 mb-6">
          <Card><CardContent className="pt-4"><div className="flex items-center justify-between"><div><p className="text-sm text-muted-foreground">En attente</p><p className="text-2xl font-bold text-warning">{(patientPendingRequests || []).filter(r => r.status === 'demande').length}</p></div><Clock className="h-8 w-8 text-warning" /></div></CardContent></Card>
          <Card><CardContent className="pt-4"><div className="flex items-center justify-between"><div><p className="text-sm text-muted-foreground">En cours</p><p className="text-2xl font-bold text-info">{(patientPendingRequests || []).filter(r => r.status === 'en_cours').length}</p></div><Camera className="h-8 w-8 text-info" /></div></CardContent></Card>
          <Card><CardContent className="pt-4"><div className="flex items-center justify-between"><div><p className="text-sm text-muted-foreground">Terminés</p><p className="text-2xl font-bold text-success">{patientCompletedRequests.length}</p></div><Check className="h-8 w-8 text-success" /></div></CardContent></Card>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-4">
            <TabsTrigger value="pending" className="gap-2">
              <ImageIcon className="h-4 w-4" />
              À réaliser
              {(patientPendingRequests?.length || 0) > 0 && (
                <Badge variant="destructive" className="ml-1 text-[10px]">{patientPendingRequests?.length}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="completed" className="gap-2">
              <Check className="h-4 w-4" />
              Comptes rendus
            </TabsTrigger>
          </TabsList>

          <TabsContent value="pending">
            <Card>
              <CardHeader>
                <CardTitle>Examens en attente</CardTitle>
                <CardDescription>
                  {selectedPatient ? `Examens pour ${selectedPatient.first_name} ${selectedPatient.last_name}` : 'Demandes à réaliser par ordre de priorité'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {(patientPendingRequests?.length || 0) === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <Check className="h-12 w-12 mx-auto mb-3 text-success" />
                    <p className="font-medium">{selectedPatient ? 'Aucun examen en attente pour ce patient' : 'Tous les examens ont été réalisés'}</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {patientPendingRequests?.sort((a, b) => {
                      if (a.priority === 'urgente' && b.priority !== 'urgente') return -1;
                      if (a.priority !== 'urgente' && b.priority === 'urgente') return 1;
                      return new Date(a.requested_at).getTime() - new Date(b.requested_at).getTime();
                    }).map(request => {
                      const StatusIcon = statusConfig[request.status]?.icon || Clock;
                      const patient = request.patients;
                      return (
                        <div key={request.id} className={cn('flex items-center gap-4 p-4 border rounded-lg bg-card', request.priority === 'urgente' && 'border-destructive/30 bg-destructive/5')}>
                          <div className={cn('h-14 w-14 rounded-lg flex items-center justify-center text-2xl', request.priority === 'urgente' ? 'bg-destructive/10' : 'bg-primary/10')}>
                            {examTypeIcons[request.exam_type] || '📷'}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <p className="font-semibold">{getExamTypeName(request.exam_type)}</p>
                              <Badge variant="outline" className="text-xs">{request.body_part}</Badge>
                              {request.priority === 'urgente' && <Badge variant="destructive" className="text-[10px]">URGENT</Badge>}
                            </div>
                            <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
                              <div className="flex items-center gap-1"><User className="h-3 w-3" /><span>{patient ? `${patient.first_name} ${patient.last_name}` : 'Patient inconnu'}</span></div>
                              <span>•</span>
                              <span className="font-mono text-xs">{patient?.code || ''}</span>
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">Demandé le {formatDateTime(request.requested_at)}</p>
                          </div>
                          <Badge variant="outline" className={cn('text-xs', statusConfig[request.status]?.className)}>
                            <StatusIcon className="h-3 w-3 mr-1" />{statusConfig[request.status]?.label || request.status}
                          </Badge>
                          <div className="flex gap-2">
                            {request.status === 'demande' && (
                              <Button size="sm" variant="outline" onClick={() => handleStartExam(request.id)} disabled={updateImagingRequest.isPending} className="gap-1.5">
                                <Camera className="h-4 w-4" />Démarrer
                              </Button>
                            )}
                            {request.status === 'en_cours' && (
                              <Button size="sm" onClick={() => handleOpenReportDialog(request)} className="gap-1.5">
                                <FileText className="h-4 w-4" />Compte rendu
                              </Button>
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

          <TabsContent value="completed">
            <Card>
              <CardHeader>
                <CardTitle>Comptes rendus d'imagerie</CardTitle>
                <CardDescription>
                  {selectedPatient ? `Résultats pour ${selectedPatient.first_name} ${selectedPatient.last_name}` : 'Examens réalisés avec rapports'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {patientCompletedRequests.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <ImageIcon className="h-12 w-12 mx-auto mb-3 opacity-20" />
                    <p>Aucun compte rendu disponible</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {patientCompletedRequests.map(request => {
                      const patient = request.patients;
                      return (
                        <div key={request.id} className="p-4 border rounded-lg bg-success/5 border-success/20">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex items-start gap-3">
                              <div className="h-12 w-12 rounded-lg bg-muted flex items-center justify-center text-xl">{examTypeIcons[request.exam_type] || '📷'}</div>
                              <div>
                                <div className="flex items-center gap-2">
                                  <p className="font-semibold">{getExamTypeName(request.exam_type)}</p>
                                  <Badge variant="outline" className="text-xs">{request.body_part}</Badge>
                                  <Badge className="bg-success text-success-foreground text-[10px]">Terminé</Badge>
                                </div>
                                <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
                                  <div className="flex items-center gap-1"><User className="h-3 w-3" /><span>{patient ? `${patient.first_name} ${patient.last_name}` : 'Patient inconnu'}</span></div>
                                  <span>•</span>
                                  <span className="font-mono text-xs">{patient?.code || ''}</span>
                                </div>
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <Button size="sm" variant="outline" className="gap-1.5"><Eye className="h-4 w-4" />Voir image</Button>
                              <Button size="sm" variant="outline" className="gap-1.5" onClick={() => {
                                const p = request.patients;
                                printResultDocument({
                                  clinic: clinicData,
                                  patientName: p ? `${p.first_name} ${p.last_name}` : 'Patient inconnu',
                                  patientCode: p?.code || '',
                                  title: 'Résultats d\'Imagerie Médicale',
                                  subtitle: `${getExamTypeName(request.exam_type)} — ${request.body_part}`,
                                  date: request.completed_at ? new Date(request.completed_at).toLocaleDateString('fr-FR') : '',
                                  content: request.report || 'Aucun compte rendu',
                                });
                              }}><Printer className="h-4 w-4" />Imprimer</Button>
                            </div>
                          </div>
                          {request.report && (
                            <div className="p-3 bg-background rounded border text-sm">
                              <p className="text-xs font-medium text-muted-foreground mb-1">Compte rendu :</p>
                              <p className="whitespace-pre-wrap">{request.report}</p>
                            </div>
                          )}
                          <p className="text-xs text-muted-foreground mt-2">Réalisé le {request.completed_at && formatDateTime(request.completed_at)}</p>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <Dialog open={isReportDialogOpen} onOpenChange={setIsReportDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Compte rendu d'imagerie</DialogTitle>
              <DialogDescription>
                {selectedRequest && getExamTypeName(selectedRequest.exam_type)} - {selectedRequest?.body_part}
                <br />Patient : {selectedRequest?.patients && `${selectedRequest.patients.first_name} ${selectedRequest.patients.last_name}`}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="p-4 border-2 border-dashed rounded-lg text-center">
                <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">Télécharger les images (fonctionnalité à venir)</p>
              </div>
              <div>
                <Label>Compte rendu</Label>
                <Textarea placeholder="Saisissez le compte rendu..." className="min-h-[200px] mt-2" value={reportText} onChange={(e) => setReportText(e.target.value)} />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsReportDialogOpen(false)}>Annuler</Button>
              <Button onClick={handleSaveReport} disabled={updateImagingRequest.isPending} className="gap-1.5">
                <Check className="h-4 w-4" />Valider et enregistrer
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
};

export default Imaging;
