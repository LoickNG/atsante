import { useState } from 'react';
import { AppLayout, PageHeader } from '@/components/layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
  Search, 
  FlaskConical,
  Clock,
  Check,
  AlertTriangle,
  User,
  FileText,
  Printer,
  Eye,
} from 'lucide-react';
import { mockLabRequests, mockPatients } from '@/data/mockData';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { LabRequest } from '@/types';

const Laboratory = () => {
  const [activeTab, setActiveTab] = useState('pending');
  const [labRequests, setLabRequests] = useState(mockLabRequests);
  const [selectedRequest, setSelectedRequest] = useState<LabRequest | null>(null);
  const [isResultDialogOpen, setIsResultDialogOpen] = useState(false);
  const [resultText, setResultText] = useState('');

  const pendingRequests = labRequests.filter(r => r.status === 'demande' || r.status === 'en_cours');
  const completedRequests = labRequests.filter(r => r.status === 'termine');

  const getPatientName = (patientId: string) => {
    const patient = mockPatients.find(p => p.id === patientId);
    return patient ? `${patient.firstName} ${patient.lastName}` : 'Patient inconnu';
  };

  const getPatientCode = (patientId: string) => {
    const patient = mockPatients.find(p => p.id === patientId);
    return patient?.code || '';
  };

  const formatDateTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('fr-FR', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleStartAnalysis = (requestId: string) => {
    setLabRequests(prev => prev.map(r =>
      r.id === requestId ? { ...r, status: 'en_cours' as const } : r
    ));
    toast.info('Analyse démarrée');
  };

  const handleOpenResultDialog = (request: LabRequest) => {
    setSelectedRequest(request);
    setResultText(request.results || '');
    setIsResultDialogOpen(true);
  };

  const handleSaveResults = () => {
    if (!selectedRequest || !resultText.trim()) {
      toast.error('Veuillez saisir les résultats');
      return;
    }

    setLabRequests(prev => prev.map(r =>
      r.id === selectedRequest.id
        ? {
            ...r,
            status: 'termine' as const,
            results: resultText,
            validatedBy: 'usr-002',
            validatedAt: new Date().toISOString(),
            completedAt: new Date().toISOString(),
          }
        : r
    ));

    setIsResultDialogOpen(false);
    setSelectedRequest(null);
    setResultText('');
    toast.success('Résultats enregistrés et validés');
  };

  const statusConfig = {
    demande: {
      label: 'Nouveau',
      className: 'bg-warning/10 text-warning-foreground border-warning/30',
      icon: Clock,
    },
    en_cours: {
      label: 'En cours',
      className: 'bg-info/10 text-info border-info/30',
      icon: FlaskConical,
    },
    termine: {
      label: 'Terminé',
      className: 'bg-success/10 text-success border-success/30',
      icon: Check,
    },
    annule: {
      label: 'Annulé',
      className: 'bg-muted text-muted-foreground',
      icon: AlertTriangle,
    },
  };

  return (
    <AppLayout>
      <div className="p-6 lg:p-8">
        <PageHeader
          title="Laboratoire"
          description="Gestion des analyses et résultats"
        >
          <Button variant="outline" size="default" className="gap-2">
            <FileText className="h-4 w-4" />
            Rapport journalier
          </Button>
        </PageHeader>

        {/* Stats */}
        <div className="grid gap-4 sm:grid-cols-3 mb-6">
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">En attente</p>
                  <p className="text-2xl font-bold text-warning">
                    {labRequests.filter(r => r.status === 'demande').length}
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
                    {labRequests.filter(r => r.status === 'en_cours').length}
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
                  <p className="text-2xl font-bold text-success">
                    {completedRequests.length}
                  </p>
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
              {pendingRequests.length > 0 && (
                <Badge variant="destructive" className="ml-1 text-[10px]">
                  {pendingRequests.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="completed" className="gap-2">
              <Check className="h-4 w-4" />
              Résultats
            </TabsTrigger>
          </TabsList>

          {/* Pending Tab */}
          <TabsContent value="pending">
            <Card>
              <CardHeader>
                <CardTitle>Analyses en attente</CardTitle>
                <CardDescription>
                  Demandes à traiter par ordre de priorité
                </CardDescription>
              </CardHeader>
              <CardContent>
                {pendingRequests.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <Check className="h-12 w-12 mx-auto mb-3 text-success" />
                    <p className="font-medium">Toutes les analyses ont été traitées</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Urgent requests first */}
                    {pendingRequests
                      .sort((a, b) => {
                        if (a.priority === 'urgente' && b.priority !== 'urgente') return -1;
                        if (a.priority !== 'urgente' && b.priority === 'urgente') return 1;
                        return new Date(a.requestedAt).getTime() - new Date(b.requestedAt).getTime();
                      })
                      .map(request => {
                        const StatusIcon = statusConfig[request.status].icon;
                        
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
                              request.priority === 'urgente' 
                                ? 'bg-destructive/10' 
                                : 'bg-primary/10'
                            )}>
                              {request.priority === 'urgente' ? (
                                <AlertTriangle className="h-6 w-6 text-destructive animate-pulse" />
                              ) : (
                                <FlaskConical className="h-6 w-6 text-primary" />
                              )}
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <p className="font-semibold">{request.testType}</p>
                                {request.priority === 'urgente' && (
                                  <Badge variant="destructive" className="text-[10px]">
                                    URGENT
                                  </Badge>
                                )}
                              </div>
                              <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
                                <div className="flex items-center gap-1">
                                  <User className="h-3 w-3" />
                                  <span>{getPatientName(request.patientId)}</span>
                                </div>
                                <span>•</span>
                                <span className="font-mono text-xs">{getPatientCode(request.patientId)}</span>
                              </div>
                              <p className="text-xs text-muted-foreground mt-1">
                                Demandé le {formatDateTime(request.requestedAt)}
                              </p>
                            </div>
                            <Badge 
                              variant="outline" 
                              className={cn('text-xs', statusConfig[request.status].className)}
                            >
                              <StatusIcon className="h-3 w-3 mr-1" />
                              {statusConfig[request.status].label}
                            </Badge>
                            <div className="flex gap-2">
                              {request.status === 'demande' && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleStartAnalysis(request.id)}
                                >
                                  Démarrer
                                </Button>
                              )}
                              {request.status === 'en_cours' && (
                                <Button
                                  size="sm"
                                  onClick={() => handleOpenResultDialog(request)}
                                >
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

          {/* Completed Tab */}
          <TabsContent value="completed">
            <Card>
              <CardHeader>
                <CardTitle>Résultats d'analyses</CardTitle>
                <CardDescription>
                  Analyses terminées et validées
                </CardDescription>
              </CardHeader>
              <CardContent>
                {completedRequests.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <FlaskConical className="h-12 w-12 mx-auto mb-3 opacity-20" />
                    <p>Aucun résultat disponible</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {completedRequests.map(request => (
                      <div
                        key={request.id}
                        className="p-4 border rounded-lg bg-success/5 border-success/20"
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-semibold">{request.testType}</p>
                              <Badge className="bg-success text-success-foreground text-[10px]">
                                Validé
                              </Badge>
                            </div>
                            <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
                              <div className="flex items-center gap-1">
                                <User className="h-3 w-3" />
                                <span>{getPatientName(request.patientId)}</span>
                              </div>
                              <span>•</span>
                              <span className="font-mono text-xs">{getPatientCode(request.patientId)}</span>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button size="sm" variant="outline" className="gap-1.5">
                              <Eye className="h-4 w-4" />
                              Voir
                            </Button>
                            <Button size="sm" variant="outline" className="gap-1.5">
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
                          Validé le {request.completedAt && formatDateTime(request.completedAt)}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Result Input Dialog */}
        <Dialog open={isResultDialogOpen} onOpenChange={setIsResultDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Saisie des résultats</DialogTitle>
              <DialogDescription>
                {selectedRequest?.testType} - {selectedRequest && getPatientName(selectedRequest.patientId)}
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
              <Button variant="outline" onClick={() => setIsResultDialogOpen(false)}>
                Annuler
              </Button>
              <Button onClick={handleSaveResults} className="gap-1.5">
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
