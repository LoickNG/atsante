import { AppLayout, PageHeader } from '@/components/layout';
import { StatCard } from '@/components/dashboard';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  Users, 
  Stethoscope, 
  Banknote, 
  FlaskConical, 
  ImageIcon,
  AlertTriangle,
  UserPlus,
  QrCode,
  Calendar,
  Loader2,
  BedDouble,
  Pill,
  Heart,
  Scissors,
  Receipt,
  Settings,
  Ambulance,
  Baby,
  FileText,
  Shield,
  KeyRound,
  Building2,
  CheckCircle2,
  XCircle,
  Clock,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { getRoleLabel } from '@/config/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useDashboardStats } from '@/hooks/useDashboardStats';
import { useWaitingQueue } from '@/hooks/useVisits';
import { usePendingLabRequests } from '@/hooks/useLabRequests';
import { useMedications } from '@/hooks/useMedications';
import { DashboardWaitingList } from '@/components/dashboard/DashboardWaitingList';
import { DashboardPendingLabs } from '@/components/dashboard/DashboardPendingLabs';
import { DashboardLowStock } from '@/components/dashboard/DashboardLowStock';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

const Dashboard = () => {
  const { user, role } = useAuth();
  const { data: stats, isLoading: statsLoading } = useDashboardStats();
  const { data: waitingVisits, isLoading: visitsLoading } = useWaitingQueue();
  const { data: pendingLabs, isLoading: labsLoading } = usePendingLabRequests();
  const { data: medications, isLoading: medsLoading } = useMedications();

  const lowStockMeds = medications?.filter(m => m.stock_quantity <= m.alert_threshold) || [];

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('fr-FR', { style: 'decimal', minimumFractionDigits: 0 }).format(amount) + ' FCFA';

  const today = new Date().toLocaleDateString('fr-FR', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });

  const userName = user?.email?.split('@')[0] || 'Utilisateur';

  if (statsLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-full">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="p-6 lg:p-8">
        <PageHeader
          title={`Bonjour, ${userName} 👋`}
          description={`${role ? getRoleLabel(role) : ''} • ${today}`}
        >
          {role === 'accueil' && (
            <>
              <Button variant="outline" size="default" className="gap-2" asChild>
                <Link to="/patients"><QrCode className="h-4 w-4" />Scanner QR</Link>
              </Button>
              <Button size="default" className="gap-2 bg-primary hover:bg-primary/90" asChild>
                <Link to="/patients/nouveau"><UserPlus className="h-4 w-4" />Nouveau Patient</Link>
              </Button>
            </>
          )}
        </PageHeader>

        {/* ===== MÉDECIN ===== */}
        {role === 'medecin' && (
          <>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
              <StatCard title="Patients aujourd'hui" value={stats?.patientsToday || 0} icon={Users} variant="primary" />
              <StatCard title="Consultations" value={stats?.consultationsToday || 0} icon={Stethoscope} variant="success" />
              <StatCard title="Analyses en attente" value={stats?.pendingLabs || 0} icon={FlaskConical} variant={(stats?.pendingLabs || 0) > 5 ? 'warning' : 'default'} />
              <StatCard title="Imagerie en attente" value={stats?.pendingImaging || 0} icon={ImageIcon} variant="default" />
            </div>
            <div className="mb-8">
              <h2 className="text-lg font-semibold mb-4">Actions rapides</h2>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <Button variant="outline" className="h-auto py-4 flex-col gap-2 hover:bg-success/5 hover:border-success/30" asChild>
                  <Link to="/consultations">
                    <Stethoscope className="h-6 w-6 text-success" />
                    <span className="font-medium">Nouvelle consultation</span>
                    <span className="text-xs text-muted-foreground">Démarrer un examen</span>
                  </Link>
                </Button>
                <Button variant="outline" className="h-auto py-4 flex-col gap-2 hover:bg-info/5 hover:border-info/30" asChild>
                  <Link to="/file-attente">
                    <Calendar className="h-6 w-6 text-info" />
                    <span className="font-medium">File d'attente</span>
                    <span className="text-xs text-muted-foreground">Patients en attente</span>
                  </Link>
                </Button>
                <Button variant="outline" className="h-auto py-4 flex-col gap-2 hover:bg-primary/5 hover:border-primary/30" asChild>
                  <Link to="/hospitalisations">
                    <BedDouble className="h-6 w-6 text-primary" />
                    <span className="font-medium">Hospitalisations</span>
                    <span className="text-xs text-muted-foreground">Patients hospitalisés</span>
                  </Link>
                </Button>
                <Button variant="outline" className="h-auto py-4 flex-col gap-2 hover:bg-warning/5 hover:border-warning/30" asChild>
                  <Link to="/bloc-operatoire">
                    <Scissors className="h-6 w-6 text-warning" />
                    <span className="font-medium">Bloc opératoire</span>
                    <span className="text-xs text-muted-foreground">Interventions planifiées</span>
                  </Link>
                </Button>
              </div>
            </div>
            <div className="grid gap-6 lg:grid-cols-2">
              <DashboardWaitingList visits={waitingVisits || []} isLoading={visitsLoading} />
              <DashboardPendingLabs requests={pendingLabs || []} isLoading={labsLoading} />
            </div>
          </>
        )}

        {/* ===== INFIRMIER ===== */}
        {role === 'infirmier' && (
          <>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mb-8">
              <StatCard title="Patients aujourd'hui" value={stats?.patientsToday || 0} icon={Users} variant="primary" />
              <StatCard title="Stock faible" value={stats?.lowStockMedications || 0} icon={AlertTriangle} variant={(stats?.lowStockMedications || 0) > 0 ? 'danger' : 'default'} />
              <StatCard title="Analyses en attente" value={stats?.pendingLabs || 0} icon={FlaskConical} variant="default" />
            </div>
            <div className="mb-8">
              <h2 className="text-lg font-semibold mb-4">Actions rapides</h2>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                <Button variant="outline" className="h-auto py-4 flex-col gap-2 hover:bg-info/5 hover:border-info/30" asChild>
                  <Link to="/file-attente">
                    <Calendar className="h-6 w-6 text-info" />
                    <span className="font-medium">File d'attente</span>
                    <span className="text-xs text-muted-foreground">Constantes à saisir</span>
                  </Link>
                </Button>
                <Button variant="outline" className="h-auto py-4 flex-col gap-2 hover:bg-primary/5 hover:border-primary/30" asChild>
                  <Link to="/hospitalisations">
                    <BedDouble className="h-6 w-6 text-primary" />
                    <span className="font-medium">Hospitalisations</span>
                    <span className="text-xs text-muted-foreground">Soins à administrer</span>
                  </Link>
                </Button>
                <Button variant="outline" className="h-auto py-4 flex-col gap-2 hover:bg-destructive/5 hover:border-destructive/30" asChild>
                  <Link to="/urgences">
                    <Ambulance className="h-6 w-6 text-destructive" />
                    <span className="font-medium">Urgences</span>
                    <span className="text-xs text-muted-foreground">Prise en charge urgente</span>
                  </Link>
                </Button>
              </div>
            </div>
            <div className="grid gap-6 lg:grid-cols-2">
              <DashboardWaitingList visits={waitingVisits || []} isLoading={visitsLoading} />
              <DashboardLowStock medications={lowStockMeds} isLoading={medsLoading} />
            </div>
          </>
        )}

        {/* ===== ACCUEIL ===== */}
        {role === 'accueil' && (
          <>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-2 mb-8">
              <StatCard title="Patients aujourd'hui" value={stats?.patientsToday || 0} icon={Users} variant="primary" />
              <StatCard title="En attente" value={waitingVisits?.length || 0} icon={Calendar} variant="warning" />
            </div>
            <div className="mb-8">
              <h2 className="text-lg font-semibold mb-4">Actions rapides</h2>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <Button variant="outline" className="h-auto py-4 flex-col gap-2 hover:bg-primary/5 hover:border-primary/30" asChild>
                  <Link to="/patients/nouveau">
                    <UserPlus className="h-6 w-6 text-primary" />
                    <span className="font-medium">Nouveau patient</span>
                    <span className="text-xs text-muted-foreground">Créer une carte QR</span>
                  </Link>
                </Button>
                <Button variant="outline" className="h-auto py-4 flex-col gap-2 hover:bg-info/5 hover:border-info/30" asChild>
                  <Link to="/file-attente">
                    <Calendar className="h-6 w-6 text-info" />
                    <span className="font-medium">File d'attente</span>
                    <span className="text-xs text-muted-foreground">Gérer les rendez-vous</span>
                  </Link>
                </Button>
                <Button variant="outline" className="h-auto py-4 flex-col gap-2 hover:bg-destructive/5 hover:border-destructive/30" asChild>
                  <Link to="/urgences">
                    <Ambulance className="h-6 w-6 text-destructive" />
                    <span className="font-medium">Urgences</span>
                    <span className="text-xs text-muted-foreground">Admettre un patient</span>
                  </Link>
                </Button>
                <Button variant="outline" className="h-auto py-4 flex-col gap-2 hover:bg-accent/50 hover:border-accent" asChild>
                  <Link to="/maternite">
                    <Baby className="h-6 w-6 text-pink-500" />
                    <span className="font-medium">Maternité</span>
                    <span className="text-xs text-muted-foreground">Admissions maternité</span>
                  </Link>
                </Button>
              </div>
            </div>
            <DashboardWaitingList visits={waitingVisits || []} isLoading={visitsLoading} />
          </>
        )}

        {/* ===== PHARMACIEN ===== */}
        {role === 'pharmacien' && (
          <>
            <div className="grid gap-4 sm:grid-cols-2 mb-8">
              <StatCard title="Stock faible" value={stats?.lowStockMedications || 0} icon={AlertTriangle} variant={(stats?.lowStockMedications || 0) > 0 ? 'danger' : 'default'} />
              <StatCard title="Médicaments" value={medications?.length || 0} icon={Pill} variant="primary" />
            </div>
            <div className="mb-8">
              <h2 className="text-lg font-semibold mb-4">Actions rapides</h2>
              <div className="grid gap-3 sm:grid-cols-2">
                <Button variant="outline" className="h-auto py-4 flex-col gap-2 hover:bg-primary/5 hover:border-primary/30" asChild>
                  <Link to="/pharmacie">
                    <Pill className="h-6 w-6 text-primary" />
                    <span className="font-medium">Pharmacie</span>
                    <span className="text-xs text-muted-foreground">Gestion des stocks et dispensation</span>
                  </Link>
                </Button>
              </div>
            </div>
            <DashboardLowStock medications={lowStockMeds} isLoading={medsLoading} />
          </>
        )}

        {/* ===== LABORANTIN ===== */}
        {role === 'laborantin' && (
          <>
            <div className="grid gap-4 sm:grid-cols-2 mb-8">
              <StatCard title="Analyses en attente" value={stats?.pendingLabs || 0} icon={FlaskConical} variant={(stats?.pendingLabs || 0) > 5 ? 'warning' : 'default'} />
              <StatCard title="Patients aujourd'hui" value={stats?.patientsToday || 0} icon={Users} variant="primary" />
            </div>
            <div className="mb-8">
              <h2 className="text-lg font-semibold mb-4">Actions rapides</h2>
              <div className="grid gap-3 sm:grid-cols-2">
                <Button variant="outline" className="h-auto py-4 flex-col gap-2 hover:bg-primary/5 hover:border-primary/30" asChild>
                  <Link to="/laboratoire">
                    <FlaskConical className="h-6 w-6 text-primary" />
                    <span className="font-medium">Laboratoire</span>
                    <span className="text-xs text-muted-foreground">Résultats à saisir</span>
                  </Link>
                </Button>
              </div>
            </div>
            <DashboardPendingLabs requests={pendingLabs || []} isLoading={labsLoading} />
          </>
        )}

        {/* ===== IMAGERIE ===== */}
        {role === 'imagerie' && (
          <>
            <div className="grid gap-4 sm:grid-cols-2 mb-8">
              <StatCard title="Imagerie en attente" value={stats?.pendingImaging || 0} icon={ImageIcon} variant={(stats?.pendingImaging || 0) > 5 ? 'warning' : 'default'} />
              <StatCard title="Patients aujourd'hui" value={stats?.patientsToday || 0} icon={Users} variant="primary" />
            </div>
            <div className="mb-8">
              <h2 className="text-lg font-semibold mb-4">Actions rapides</h2>
              <div className="grid gap-3 sm:grid-cols-2">
                <Button variant="outline" className="h-auto py-4 flex-col gap-2 hover:bg-primary/5 hover:border-primary/30" asChild>
                  <Link to="/imagerie">
                    <ImageIcon className="h-6 w-6 text-primary" />
                    <span className="font-medium">Imagerie</span>
                    <span className="text-xs text-muted-foreground">Examens à réaliser</span>
                  </Link>
                </Button>
              </div>
            </div>
          </>
        )}

        {/* ===== CAISSIER ===== */}
        {role === 'caissier' && (
          <>
            <div className="grid gap-4 sm:grid-cols-2 mb-8">
              <StatCard title="Recettes du jour" value={formatCurrency(stats?.revenueToday || 0)} icon={Banknote} variant="success" />
              <StatCard title="Patients aujourd'hui" value={stats?.patientsToday || 0} icon={Users} variant="primary" />
            </div>
            <div className="mb-8">
              <h2 className="text-lg font-semibold mb-4">Actions rapides</h2>
              <div className="grid gap-3 sm:grid-cols-2">
                <Button variant="outline" className="h-auto py-4 flex-col gap-2 hover:bg-success/5 hover:border-success/30" asChild>
                  <Link to="/paiements">
                    <Receipt className="h-6 w-6 text-success" />
                    <span className="font-medium">Paiements</span>
                    <span className="text-xs text-muted-foreground">Encaisser un paiement</span>
                  </Link>
                </Button>
              </div>
            </div>
          </>
        )}

        {/* ===== DAF ===== */}
        {role === 'daf' && (
          <>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mb-8">
              <StatCard title="Recettes du jour" value={formatCurrency(stats?.revenueToday || 0)} icon={Banknote} variant="success" />
              <StatCard title="Patients aujourd'hui" value={stats?.patientsToday || 0} icon={Users} variant="primary" />
              <StatCard title="Consultations" value={stats?.consultationsToday || 0} icon={Stethoscope} variant="default" />
            </div>
            <div className="mb-8">
              <h2 className="text-lg font-semibold mb-4">Actions rapides</h2>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                <Button variant="outline" className="h-auto py-4 flex-col gap-2 hover:bg-success/5 hover:border-success/30" asChild>
                  <Link to="/facturation">
                    <Banknote className="h-6 w-6 text-success" />
                    <span className="font-medium">Facturation</span>
                    <span className="text-xs text-muted-foreground">Gérer les factures</span>
                  </Link>
                </Button>
                <Button variant="outline" className="h-auto py-4 flex-col gap-2 hover:bg-primary/5 hover:border-primary/30" asChild>
                  <Link to="/paiements">
                    <Receipt className="h-6 w-6 text-primary" />
                    <span className="font-medium">Paiements</span>
                    <span className="text-xs text-muted-foreground">Suivi des encaissements</span>
                  </Link>
                </Button>
                <Button variant="outline" className="h-auto py-4 flex-col gap-2 hover:bg-warning/5 hover:border-warning/30" asChild>
                  <Link to="/extraits">
                    <FileText className="h-6 w-6 text-warning" />
                    <span className="font-medium">Extraits & Rapports</span>
                    <span className="text-xs text-muted-foreground">Rapports financiers</span>
                  </Link>
                </Button>
              </div>
            </div>
          </>
        )}

        {/* ===== ADMIN ===== */}
        {(role === 'admin' || role === 'super_admin') && (
          <>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mb-8">
              <StatCard title="Patients aujourd'hui" value={stats?.patientsToday || 0} icon={Users} variant="primary" />
              <StatCard title="Recettes du jour" value={formatCurrency(stats?.revenueToday || 0)} icon={Banknote} variant="success" />
              <StatCard title="Consultations" value={stats?.consultationsToday || 0} icon={Stethoscope} variant="default" />
            </div>
            <div className="mb-8">
              <h2 className="text-lg font-semibold mb-4">Actions rapides</h2>
              <div className="grid gap-3 sm:grid-cols-2">
                <Button variant="outline" className="h-auto py-4 flex-col gap-2 hover:bg-primary/5 hover:border-primary/30" asChild>
                  <Link to="/parametres">
                    <Settings className="h-6 w-6 text-primary" />
                    <span className="font-medium">Paramètres</span>
                    <span className="text-xs text-muted-foreground">Gérer le système et les utilisateurs</span>
                  </Link>
                </Button>
              </div>
            </div>
          </>
        )}
      </div>
    </AppLayout>
  );
};

export default Dashboard;
