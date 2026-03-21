import { useState } from 'react';
import { AppLayout, PageHeader } from '@/components/layout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  FlaskConical,
  Clock,
  Check,
  AlertTriangle,
  User,
  FileText,
  Printer,
  Loader2,
  Search,
  CalendarIcon,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { format, isAfter, isBefore, startOfDay, endOfDay } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { toast } from 'sonner';
import { useLabRequests, usePendingLabRequests, useUpdateLabRequest, LabRequestWithPatient } from '@/hooks/useLabRequests';
import { useAuth } from '@/hooks/useAuth';
import { PatientSearchSelect } from '@/components/PatientSearchSelect';
import { Patient } from '@/hooks/usePatients';
import { useClinicSettings } from '@/hooks/useClinicSettings';
import { printMultiResultDocument } from '@/utils/printResult';
import { Link } from 'react-router-dom';

const Laboratory = () => {
  const [activeTab, setActiveTab] = useState('pending');
  const [selectedRequest, setSelectedRequest] = useState<LabRequestWithPatient | null>(null);
  const [isResultDialogOpen, setIsResultDialogOpen] = useState(false);
  const [resultText, setResultText] = useState('');
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [dateFrom, setDateFrom] = useState<Date | undefined>();
  const [dateTo, setDateTo] = useState<Date | undefined>();
  const { user } = useAuth();
  const { data: clinicData } = useClinicSettings();

  const { data: allRequests, isLoading } = useLabRequests();
  const { data: pendingRequests } = usePendingLabRequests();
  const updateLabRequest = useUpdateLabRequest();

  const completedRequests = allRequests?.filter(r => r.status === 'termine') || [];

  // Filter by selected patient
  const patientPendingRequests = selectedPatient
    ? (pendingRequests || []).filter(r => r.patient_id === selectedPatient.id)
    : pendingRequests;

  const patientCompletedRequests = selectedPatient
    ? completedRequests.filter(r => r.patient_id === selectedPatient.id)
    : completedRequests;

  // Apply date filter on completed results
  const filteredCompletedRequests = patientCompletedRequests.filter(r => {
    if (!r.completed_at) return true;
    const completedDate = new Date(r.completed_at);
    if (dateFrom && isBefore(completedDate, startOfDay(dateFrom))) return false;
    if (dateTo && isAfter(completedDate, endOfDay(dateTo))) return false;
    return true;
  });

  const formatDateTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('fr-FR', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleStartAnalysis = async (requestId: string) => {
    try {
      await updateLabRequest.mutateAsync({ id: requestId, status: 'en_cours' });
      toast.info('Analyse démarrée');
    } catch {
      toast.error('Erreur lors du démarrage');
    }
  };

  const handleOpenResultDialog = (request: LabRequestWithPatient) => {
    setSelectedRequest(request);
    setResultText(request.results || '');
    setIsResultDialogOpen(true);
  };

  const handleSaveResults = async () => {
    if (!selectedRequest || !resultText.trim()) {
      toast.error('Veuillez saisir les résultats');
      return;
    }
    try {
      await updateLabRequest.mutateAsync({
        id: selectedRequest.id,
        status: 'termine',
        results: resultText,
        validated_by: user?.id,
        validated_at: new Date().toISOString(),
        completed_at: new Date().toISOString(),
      });
      setIsResultDialogOpen(false);
      setSelectedRequest(null);
      setResultText('');
      toast.success('Résultats enregistrés et validés');
    } catch {
      toast.error("Erreur lors de l'enregistrement");
    }
  };

  const statusConfig: Record<string, { label: string; className: string; icon: any }> = {
    demande: { label: 'Nouveau', className: 'bg-warning/10 text-warning-foreground border-warning/30', icon: Clock },
    en_cours: { label: 'En cours', className: 'bg-info/10 text-info border-info/30', icon: FlaskConical },
    termine: { label: 'Terminé', className: 'bg-success/10 text-success border-success/30', icon: Check },
    annule: { label: 'Annulé', className: 'bg-muted text-muted-foreground', icon: AlertTriangle },
  };

  if (isLoading) {
    return (
      <AppLayout>
        <div className="p-6 lg:p-8">
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="p-6 lg:p-8">
        <PageHeader title="Laboratoire" description="Gestion des analyses et résultats">
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
            <CardDescription>Sélectionnez un patient pour voir ses analyses</CardDescription>
          </CardHeader>
          <CardContent>
            <PatientSearchSelect selectedPatient={selectedPatient} onSelect={setSelectedPatient} />
            {selectedPatient && (
              <div className="mt-3">
                <Button variant="link" size="sm" asChild className="p-0 h-auto">
                  <Link to={`/patients/${selectedPatient.id}`}>
                    Voir le dossier complet →
                  </Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Stats */}
        <div className="grid gap-4 sm:grid-cols-3 mb-6">
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">En attente</p>
                  <p className="text-2xl font-bold text-warning">
                    {(patientPendingRequests || []).filter(r => r.status === 'demande').length}
                  </p>
                </div>
                <Clock className="h-8 w-8 text-warning" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">En cours</p>
                  <p className="text-2xl font-bold text-info">
                    {(patientPendingRequests || []).filter(r => r.status === 'en_cours').length}
                  </p>
                </div>
                <FlaskConical className="h-8 w-8 text-info" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Terminées</p>
                  <p className="text-2xl font-bold text-success">{patientCompletedRequests.length}</p>
                </div>
                <Check className="h-8 w-8 text-success" />
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-4">
            <TabsTrigger value="pending" className="gap-2">
              <FlaskConical className="h-4 w-4" />
              À traiter
              {(patientPendingRequests?.length || 0) > 0 && (
                <Badge variant="destructive" className="ml-1 text-[10px]">
                  {patientPendingRequests?.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="completed" className="gap-2">
              <Check className="h-4 w-4" />
              Résultats
            </TabsTrigger>
          </TabsList>

          <TabsContent value="pending">
            <Card>
              <CardHeader>
                <CardTitle>Analyses en attente</CardTitle>
                <CardDescription>
                  {selectedPatient
                    ? `Analyses pour ${selectedPatient.first_name} ${selectedPatient.last_name}`
                    : 'Demandes à traiter par ordre de priorité'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {(patientPendingRequests?.length || 0) === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <Check className="h-12 w-12 mx-auto mb-3 text-success" />
                    <p className="font-medium">
                      {selectedPatient ? 'Aucune analyse en attente pour ce patient' : 'Toutes les analyses ont été traitées'}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {patientPendingRequests
                      ?.sort((a, b) => {
                        if (a.priority === 'urgente' && b.priority !== 'urgente') return -1;
                        if (a.priority !== 'urgente' && b.priority === 'urgente') return 1;
                        return new Date(a.requested_at).getTime() - new Date(b.requested_at).getTime();
                      })
                      .map(request => {
                        const StatusIcon = statusConfig[request.status]?.icon || Clock;
                        const patient = request.patients;
                        return (
                          <div
                            key={request.id}
                            className={cn(
                              'flex items-center gap-4 p-4 border rounded-lg bg-card',
                              request.priority === 'urgente' && 'border-destructive/30 bg-destructive/5'
                            )}
                          >
                            <div className={cn(
                              'h-12 w-12 rounded-lg flex items-center justify-center',
                              request.priority === 'urgente' ? 'bg-destructive/10' : 'bg-primary/10'
                            )}>
                              {request.priority === 'urgente' ? (
                                <AlertTriangle className="h-6 w-6 text-destructive animate-pulse" />
                              ) : (
                                <FlaskConical className="h-6 w-6 text-primary" />
                              )}
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <p className="font-semibold">{request.test_type}</p>
                                {request.priority === 'urgente' && (
                                  <Badge variant="destructive" className="text-[10px]">URGENT</Badge>
                                )}
                              </div>
                              <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
                                <div className="flex items-center gap-1">
                                  <User className="h-3 w-3" />
                                  <span>{patient ? `${patient.first_name} ${patient.last_name}` : 'Patient inconnu'}</span>
                                </div>
                                <span>•</span>
                                <span className="font-mono text-xs">{patient?.code || ''}</span>
                              </div>
                              <p className="text-xs text-muted-foreground mt-1">
                                Demandé le {formatDateTime(request.requested_at)}
                              </p>
                            </div>
                            <Badge variant="outline" className={cn('text-xs', statusConfig[request.status]?.className)}>
                              <StatusIcon className="h-3 w-3 mr-1" />
                              {statusConfig[request.status]?.label || request.status}
                            </Badge>
                            <div className="flex gap-2">
                              {request.status === 'demande' && (
                                <Button size="sm" variant="outline" onClick={() => handleStartAnalysis(request.id)} disabled={updateLabRequest.isPending}>
                                  Démarrer
                                </Button>
                              )}
                              {request.status === 'en_cours' && (
                                <Button size="sm" onClick={() => handleOpenResultDialog(request)}>
                                  Saisir résultats
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
                <CardTitle>Résultats d'analyses</CardTitle>
                <CardDescription>
                  {selectedPatient
                    ? `Résultats pour ${selectedPatient.first_name} ${selectedPatient.last_name}`
                    : 'Analyses terminées, regroupées par patient et consultation'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {patientCompletedRequests.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <FlaskConical className="h-12 w-12 mx-auto mb-3 opacity-20" />
                    <p>Aucun résultat disponible</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {(() => {
                      // Group by patient
                      const byPatient = patientCompletedRequests.reduce<Record<string, LabRequestWithPatient[]>>((acc, r) => {
                        if (!acc[r.patient_id]) acc[r.patient_id] = [];
                        acc[r.patient_id].push(r);
                        return acc;
                      }, {});

                      return Object.entries(byPatient).map(([patientId, patientRequests]) => {
                        const patient = patientRequests[0].patients;
                        const patientName = patient ? `${patient.first_name} ${patient.last_name}` : 'Patient inconnu';
                        const patientCode = patient?.code || '';

                        // Sub-group by consultation_id (null = sans consultation)
                        const byConsultation = patientRequests.reduce<Record<string, LabRequestWithPatient[]>>((acc, r) => {
                          const key = r.consultation_id || 'sans_consultation';
                          if (!acc[key]) acc[key] = [];
                          acc[key].push(r);
                          return acc;
                        }, {});

                        const consultationGroups = Object.entries(byConsultation);

                        return (
                          <Card key={patientId} className="border-success/20">
                            <CardHeader className="pb-3">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                                    <User className="h-5 w-5 text-primary" />
                                  </div>
                                  <div>
                                    <CardTitle className="text-base">{patientName}</CardTitle>
                                    <CardDescription className="font-mono text-xs">
                                      {patientCode} • {patientRequests.length} analyse(s) • {consultationGroups.length} consultation(s)
                                    </CardDescription>
                                  </div>
                                </div>
                                <Button size="sm" className="gap-1.5" onClick={() => {
                                  printMultiResultDocument({
                                    clinic: clinicData,
                                    patientName,
                                    patientCode,
                                    documentTitle: 'Résultats d\'Analyses de Laboratoire',
                                    items: patientRequests.map(r => ({
                                      title: r.test_type,
                                      date: r.completed_at ? new Date(r.completed_at).toLocaleDateString('fr-FR') : '',
                                      content: r.results || 'Aucun résultat',
                                    })),
                                  });
                                }}>
                                  <Printer className="h-4 w-4" />
                                  Imprimer tout ({patientRequests.length})
                                </Button>
                              </div>
                            </CardHeader>
                            <CardContent>
                              <div className="space-y-4">
                                {consultationGroups.map(([consultationId, requests], idx) => (
                                  <div key={consultationId} className="space-y-2">
                                    <div className="flex items-center justify-between">
                                      <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                                        <FileText className="h-3.5 w-3.5" />
                                        {consultationId === 'sans_consultation'
                                          ? 'Demandes directes'
                                          : `Consultation du ${requests[0].requested_at ? formatDateTime(requests[0].requested_at) : ''}`}
                                        <Badge variant="outline" className="text-[10px]">{requests.length} examen(s)</Badge>
                                      </div>
                                      {requests.length > 1 && (
                                        <Button size="sm" variant="outline" className="gap-1.5 h-7 text-xs" onClick={() => {
                                          printMultiResultDocument({
                                            clinic: clinicData,
                                            patientName,
                                            patientCode,
                                            documentTitle: 'Résultats d\'Analyses de Laboratoire',
                                            items: requests.map(r => ({
                                              title: r.test_type,
                                              date: r.completed_at ? new Date(r.completed_at).toLocaleDateString('fr-FR') : '',
                                              content: r.results || 'Aucun résultat',
                                            })),
                                          });
                                        }}>
                                          <Printer className="h-3 w-3" />
                                          Imprimer cette consultation
                                        </Button>
                                      )}
                                    </div>
                                    <div className="space-y-2 pl-5 border-l-2 border-muted">
                                      {requests.map(request => (
                                        <div key={request.id} className="p-3 border rounded-lg bg-success/5 border-success/20">
                                          <div className="flex items-center justify-between mb-2">
                                            <div className="flex items-center gap-2">
                                              <FlaskConical className="h-4 w-4 text-success" />
                                              <p className="font-medium text-sm">{request.test_type}</p>
                                              <Badge className="bg-success text-success-foreground text-[10px]">Validé</Badge>
                                            </div>
                                            <span className="text-xs text-muted-foreground">
                                              {request.completed_at && formatDateTime(request.completed_at)}
                                            </span>
                                          </div>
                                          {request.results && (
                                            <div className="p-2 bg-background rounded border text-sm">
                                              <p className="whitespace-pre-wrap">{request.results}</p>
                                            </div>
                                          )}
                                        </div>
                                      ))}
                                    </div>
                                    {idx < consultationGroups.length - 1 && <hr className="border-muted" />}
                                  </div>
                                ))}
                              </div>
                            </CardContent>
                          </Card>
                        );
                      });
                    })()}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <Dialog open={isResultDialogOpen} onOpenChange={setIsResultDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Saisie des résultats</DialogTitle>
              <DialogDescription>
                {selectedRequest?.test_type} - {selectedRequest?.patients && `${selectedRequest.patients.first_name} ${selectedRequest.patients.last_name}`}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Résultats de l'analyse</Label>
                <Textarea
                  placeholder="Saisissez les résultats de l'analyse..."
                  className="min-h-[200px] mt-2"
                  value={resultText}
                  onChange={(e) => setResultText(e.target.value)}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsResultDialogOpen(false)}>Annuler</Button>
              <Button onClick={handleSaveResults} disabled={updateLabRequest.isPending} className="gap-1.5">
                <Check className="h-4 w-4" />
                Valider et enregistrer
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
};

export default Laboratory;
