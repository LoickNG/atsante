import { AppLayout, PageHeader } from '@/components/layout';
import { StatCard, WaitingList, PendingLabs, LowStockAlerts } from '@/components/dashboard';
import { Button } from '@/components/ui/button';
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
} from 'lucide-react';
import { 
  mockDashboardStats, 
  mockVisits, 
  mockLabRequests, 
  mockMedications,
  currentUser,
} from '@/data/mockData';
import { Link } from 'react-router-dom';
import { getRoleLabel } from '@/config/navigation';

const Dashboard = () => {
  const stats = mockDashboardStats;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'decimal',
      minimumFractionDigits: 0,
    }).format(amount) + ' FCFA';
  };

  const today = new Date().toLocaleDateString('fr-FR', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <AppLayout>
      <div className="p-6 lg:p-8">
        {/* Header */}
        <PageHeader
          title={`Bonjour, ${currentUser.name.split(' ')[0]} 👋`}
          description={`${getRoleLabel(currentUser.role)} • ${today}`}
        >
          <Button variant="outline" size="default" className="gap-2" asChild>
            <Link to="/patients">
              <QrCode className="h-4 w-4" />
              Scanner QR
            </Link>
          </Button>
          <Button size="default" className="gap-2 bg-primary hover:bg-primary/90" asChild>
            <Link to="/patients/nouveau">
              <UserPlus className="h-4 w-4" />
              Nouveau Patient
            </Link>
          </Button>
        </PageHeader>

        {/* Stats Grid */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 mb-8">
          <StatCard
            title="Patients aujourd'hui"
            value={stats.patientsToday}
            icon={Users}
            variant="primary"
            trend={{ value: 12, isPositive: true }}
          />
          <StatCard
            title="Consultations"
            value={stats.consultationsToday}
            icon={Stethoscope}
            variant="success"
          />
          <StatCard
            title="Recettes du jour"
            value={formatCurrency(stats.revenueToday)}
            icon={Banknote}
            variant="default"
            trend={{ value: 8, isPositive: true }}
          />
          <StatCard
            title="Analyses en attente"
            value={stats.pendingLabs}
            icon={FlaskConical}
            variant={stats.pendingLabs > 5 ? 'warning' : 'default'}
          />
          <StatCard
            title="Imagerie en attente"
            value={stats.pendingImaging}
            icon={ImageIcon}
            variant="default"
          />
          <StatCard
            title="Stock faible"
            value={stats.lowStockMedications}
            icon={AlertTriangle}
            variant={stats.lowStockMedications > 0 ? 'danger' : 'default'}
          />
        </div>

        {/* Quick Actions */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold mb-4">Actions rapides</h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Button 
              variant="outline" 
              className="h-auto py-4 flex-col gap-2 hover:bg-primary/5 hover:border-primary/30"
              asChild
            >
              <Link to="/patients/nouveau">
                <UserPlus className="h-6 w-6 text-primary" />
                <span className="font-medium">Enregistrer un patient</span>
                <span className="text-xs text-muted-foreground">Créer une carte QR</span>
              </Link>
            </Button>
            <Button 
              variant="outline" 
              className="h-auto py-4 flex-col gap-2 hover:bg-success/5 hover:border-success/30"
              asChild
            >
              <Link to="/consultations">
                <Stethoscope className="h-6 w-6 text-success" />
                <span className="font-medium">Nouvelle consultation</span>
                <span className="text-xs text-muted-foreground">Démarrer un examen</span>
              </Link>
            </Button>
            <Button 
              variant="outline" 
              className="h-auto py-4 flex-col gap-2 hover:bg-info/5 hover:border-info/30"
              asChild
            >
              <Link to="/file-attente">
                <Calendar className="h-6 w-6 text-info" />
                <span className="font-medium">File d'attente</span>
                <span className="text-xs text-muted-foreground">Gérer les rendez-vous</span>
              </Link>
            </Button>
            <Button 
              variant="outline" 
              className="h-auto py-4 flex-col gap-2 hover:bg-warning/5 hover:border-warning/30"
              asChild
            >
              <Link to="/facturation">
                <Banknote className="h-6 w-6 text-warning" />
                <span className="font-medium">Facturation</span>
                <span className="text-xs text-muted-foreground">Encaisser un paiement</span>
              </Link>
            </Button>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Waiting List */}
          <WaitingList visits={mockVisits} />

          {/* Right Column */}
          <div className="space-y-6">
            {/* Pending Labs */}
            <PendingLabs requests={mockLabRequests} />

            {/* Low Stock Alerts */}
            <LowStockAlerts medications={mockMedications} />
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default Dashboard;
