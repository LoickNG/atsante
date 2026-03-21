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
  Eye,
  Loader2,
  Search,
} from 'lucide-react';
import { cn } from '@/lib/utils';
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
                    : 'Analyses terminées et validées'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {patientCompletedRequests.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <FlaskConical className="h-12 w-12 mx-auto mb-3 opacity-20" />
                    <p>Aucun résultat disponible</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {patientCompletedRequests.map(request => {
                      const patient = request.patients;
                      return (
                        <div key={request.id} className="p-4 border rounded-lg bg-success/5 border-success/20">
                          <div className="flex items-start justify-between mb-3">
                            <div>
                              <div className="flex items-center gap-2">
                                <p className="font-semibold">{request.test_type}</p>
                                <Badge className="bg-success text-success-foreground text-[10px]">Validé</Badge>
                              </div>
                              <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
                                <div className="flex items-center gap-1">
                                  <User className="h-3 w-3" />
                                  <span>{patient ? `${patient.first_name} ${patient.last_name}` : 'Patient inconnu'}</span>
                                </div>
                                <span>•</span>
                                <span className="font-mono text-xs">{patient?.code || ''}</span>
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <Button size="sm" variant="outline" className="gap-1.5">
                                <Eye className="h-4 w-4" />
                                Voir
                              </Button>
                              <Button size="sm" variant="outline" className="gap-1.5" onClick={() => {
                                const p = request.patients;
                                printResultDocument({
                                  clinic: clinicData,
                                  patientName: p ? `${p.first_name} ${p.last_name}` : 'Patient inconnu',
                                  patientCode: p?.code || '',
                                  title: 'Résultats d\'Analyse de Laboratoire',
                                  subtitle: request.test_type,
                                  date: request.completed_at ? new Date(request.completed_at).toLocaleDateString('fr-FR') : '',
                                  content: request.results || 'Aucun résultat',
                                });
                              }}>
                                <Printer className="h-4 w-4" />
                                Imprimer
                              </Button>
                            </div>
                          </div>
                          {request.results && (
                            <div className="p-3 bg-background rounded border text-sm">
                              <p className="whitespace-pre-wrap">{request.results}</p>
                            </div>
                          )}
                          <p className="text-xs text-muted-foreground mt-2">
                            Validé le {request.completed_at && formatDateTime(request.completed_at)}
                          </p>
                        </div>
                      );
                    })}
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
