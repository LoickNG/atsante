import { useState } from 'react';
import { AppLayout, PageHeader } from '@/components/layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { 
  Search, UserPlus, QrCode, MoreHorizontal, Eye, Edit, FileText, Phone, Calendar, Printer, Archive, Skull,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { usePatients, Patient } from '@/hooks/usePatients';
import { EditPatientDialog } from '@/components/patient/EditPatientDialog';
import { PatientCardPreview } from '@/components/patient/PatientCardPreview';
import { PatientHistoryDialog } from '@/components/patient/PatientHistoryDialog';
import { DeclareDeceasedDialog } from '@/components/patient/DeclareDeceasedDialog';
import { DeceasedPatientActions } from '@/components/patient/DeceasedPatientActions';
import { QRScannerDialog } from '@/components/patient/QRScannerDialog';
import { DropdownMenuSeparator } from '@/components/ui/dropdown-menu';

const PatientsList = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const { data: patients, isLoading, error } = usePatients();
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [cardOpen, setCardOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [deceasedOpen, setDeceasedOpen] = useState(false);
  const [deceasedActionsOpen, setDeceasedActionsOpen] = useState(false);
  const [showArchived, setShowArchived] = useState(false);
  const [qrScannerOpen, setQrScannerOpen] = useState(false);

  const filteredPatients = (patients || []).filter(patient => {
    const p = patient as any;
    // Filter by alive/deceased
    if (showArchived) {
      if (!p.is_deceased) return false;
    } else {
      if (p.is_deceased) return false;
    }
    const searchLower = searchQuery.toLowerCase();
    return (
      patient.first_name.toLowerCase().includes(searchLower) ||
      patient.last_name.toLowerCase().includes(searchLower) ||
      patient.code.toLowerCase().includes(searchLower) ||
      patient.phone.includes(searchQuery)
    );
  });

  const deceasedCount = (patients || []).filter((p: any) => p.is_deceased).length;

  const calculateAge = (dateOfBirth: string) => {
    const today = new Date();
    const birth = new Date(dateOfBirth);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  if (error) {
    return (
      <AppLayout>
        <div className="p-6 lg:p-8">
          <div className="text-center text-destructive">
            Erreur lors du chargement des patients
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="p-6 lg:p-8">
        <PageHeader
          title="Patients"
          description={`${patients?.length || 0} patient(s) enregistré(s)`}
        >
          <Button variant="outline" size="default" className="gap-2" onClick={() => setQrScannerOpen(true)}>
            <QrCode className="h-4 w-4" />
            Scanner QR
          </Button>
          <Button size="default" className="gap-2" asChild>
            <Link to="/patients/nouveau">
              <UserPlus className="h-4 w-4" />
              Nouveau Patient
            </Link>
          </Button>
        </PageHeader>

        {/* Search + Filter */}
        <div className="mb-6 flex items-center gap-3 flex-wrap">
          <div className="relative max-w-md flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Rechercher par nom, code ou téléphone..."
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          {deceasedCount > 0 && (
            <Button
              variant={showArchived ? 'default' : 'outline'}
              size="sm"
              className="gap-1.5"
              onClick={() => setShowArchived(!showArchived)}
            >
              <Archive className="h-4 w-4" />
              {showArchived ? 'Voir patients actifs' : `Archivés (${deceasedCount})`}
            </Button>
          )}
        </div>

        {showArchived && (
          <div className="mb-4 p-3 rounded-lg bg-muted/50 border border-muted text-sm text-muted-foreground">
            Vous consultez les fiches des patients décédés. Ces dossiers sont archivés.
          </div>
        )}

        {/* Table */}
        <div className="rounded-xl border bg-card overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="w-[280px]">Patient</TableHead>
                <TableHead>Code</TableHead>
                <TableHead>Genre</TableHead>
                <TableHead>Âge</TableHead>
                <TableHead>Téléphone</TableHead>
                <TableHead>Inscrit le</TableHead>
                <TableHead className="w-[80px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                [...Array(5)].map((_, i) => (
                  <TableRow key={i}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Skeleton className="h-10 w-10 rounded-full" />
                        <Skeleton className="h-4 w-32" />
                      </div>
                    </TableCell>
                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-12" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-28" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                    <TableCell></TableCell>
                  </TableRow>
                ))
              ) : filteredPatients.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-32 text-center text-muted-foreground">
                    {searchQuery ? 'Aucun patient trouvé' : 'Aucun patient enregistré'}
                  </TableCell>
                </TableRow>
              ) : (
                filteredPatients.map((patient) => (
                  <TableRow key={patient.id} className="group">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          {(patient as any).photo_url && (
                            <AvatarImage src={(patient as any).photo_url} alt={`${patient.first_name} ${patient.last_name}`} />
                          )}
                          <AvatarFallback className={cn(
                            'text-sm font-medium',
                            patient.gender === 'F' 
                              ? 'bg-pink-100 text-pink-700' 
                              : 'bg-blue-100 text-blue-700'
                          )}>
                            {patient.first_name[0]}{patient.last_name[0]}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">
                            {patient.first_name} {patient.last_name}
                          </p>
                          {patient.blood_type && (
                            <Badge variant="outline" className="text-[10px] mt-0.5">
                              {patient.blood_type}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <QrCode className="h-4 w-4 text-muted-foreground" />
                        <span className="font-mono text-sm">{patient.code}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant="secondary" 
                        className={cn(
                          'text-xs',
                          patient.gender === 'F' 
                            ? 'bg-pink-100 text-pink-700' 
                            : 'bg-blue-100 text-blue-700'
                        )}
                      >
                        {patient.gender === 'F' ? 'Féminin' : 'Masculin'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5 text-sm">
                        <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                        {calculateAge(patient.date_of_birth)} ans
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5 text-sm">
                        <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                        {patient.phone}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDate(patient.created_at)}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button 
                            variant="ghost" 
                            size="icon"
                            className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <Link to={`/patients/${patient.id}`}>
                              <Eye className="mr-2 h-4 w-4" />
                              Voir le dossier
                            </Link>
                          </DropdownMenuItem>
                          {!showArchived && (
                            <>
                              <DropdownMenuItem onClick={() => { setSelectedPatient(patient); setEditOpen(true); }}>
                                <Edit className="mr-2 h-4 w-4" />
                                Modifier
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => { setSelectedPatient(patient); setCardOpen(true); }}>
                                <Printer className="mr-2 h-4 w-4" />
                                Imprimer carte
                              </DropdownMenuItem>
                            </>
                          )}
                          <DropdownMenuItem onClick={() => { setSelectedPatient(patient); setHistoryOpen(true); }}>
                            <FileText className="mr-2 h-4 w-4" />
                            Historique
                          </DropdownMenuItem>
                          {showArchived ? (
                            <>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => { setSelectedPatient(patient); setDeceasedActionsOpen(true); }}>
                                <FileText className="mr-2 h-4 w-4" />
                                Certificats de décès
                              </DropdownMenuItem>
                            </>
                          ) : (
                            <>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                className="text-destructive focus:text-destructive"
                                onClick={() => { setSelectedPatient(patient); setDeceasedOpen(true); }}
                              >
                                <Skull className="mr-2 h-4 w-4" />
                                Déclarer décédé
                              </DropdownMenuItem>
                            </>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Dialogs */}
        {selectedPatient && (
          <>
            <EditPatientDialog patient={selectedPatient} open={editOpen} onOpenChange={setEditOpen} />
            <PatientCardPreview patient={selectedPatient} open={cardOpen} onOpenChange={setCardOpen} />
            <PatientHistoryDialog patient={selectedPatient} open={historyOpen} onOpenChange={setHistoryOpen} />
            <DeclareDeceasedDialog patient={selectedPatient} open={deceasedOpen} onOpenChange={setDeceasedOpen} />
            <DeceasedPatientActions patient={selectedPatient} open={deceasedActionsOpen} onOpenChange={setDeceasedActionsOpen} />
          </>
        )}
      </div>
    </AppLayout>
  );
};

export default PatientsList;
