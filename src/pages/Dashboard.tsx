import { AppLayout, PageHeader } from '@/components/layout';
import { StatCard, DashboardWaitingList, DashboardPendingLabs, DashboardLowStock, DashboardPendingImaging, DashboardRecentPayments, DashboardRecentInvoices, DashboardUsersList } from '@/components/dashboard';
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
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useState } from 'react';

const Dashboard = () => {
  const { user, role } = useAuth();
  const isDemo = role === 'demo';
  const { data: stats, isLoading: statsLoading } = useDashboardStats();
  const { data: waitingVisits, isLoading: visitsLoading } = useWaitingQueue();
  const { data: pendingLabs, isLoading: labsLoading } = usePendingLabRequests();
  const { data: medications, isLoading: medsLoading } = useMedications();

  // Super admin license stats
  const { data: licenses } = useQuery({
    queryKey: ['licenses-dashboard'],
    queryFn: async () => {
      const { data, error } = await supabase.from('licenses').select('*').neq('license_key', 'DEMO-ATSANTE-UNLIMITED').order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: role === 'super_admin',
  });

  // Admin stats: user count, license info
  const { data: adminUserCount } = useQuery({
    queryKey: ['admin-user-count'],
    queryFn: async () => {
      const { count, error } = await supabase.from('profiles').select('*', { count: 'exact', head: true });
      if (error) throw error;
      return count || 0;
    },
    enabled: role === 'admin' || role === 'demo',
  });

  const { data: adminLicense } = useQuery({
    queryKey: ['admin-license-info'],
    queryFn: async () => {
      const { data: cs } = await supabase.from('clinic_settings').select('activated_license_key').limit(1).single();
      if (!cs?.activated_license_key) return null;
      const { data: lic } = await supabase.from('licenses').select('*').eq('license_key', cs.activated_license_key).single();
      return lic;
    },
    enabled: role === 'admin' || role === 'demo',
  });

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

        

        {/* ===== DEMO - ALL FEATURES ===== */}
        {isDemo && (
          <>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
              <StatCard title="Patients aujourd'hui" value={stats?.patientsToday || 0} icon={Users} variant="primary" />
              <StatCard title="Consultations" value={stats?.consultationsToday || 0} icon={Stethoscope} variant="success" />
              <StatCard title="Recettes du jour" value={formatCurrency(stats?.revenueToday || 0)} icon={Banknote} variant="default" />
              <StatCard title="Stock faible" value={stats?.lowStockMedications || 0} icon={AlertTriangle} variant={(stats?.lowStockMedications || 0) > 0 ? 'danger' : 'default'} />
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
              <StatCard title="Analyses en attente" value={stats?.pendingLabs || 0} icon={FlaskConical} variant={(stats?.pendingLabs || 0) > 5 ? 'warning' : 'default'} />
              <StatCard title="Imagerie en attente" value={stats?.pendingImaging || 0} icon={ImageIcon} variant="default" />
              <StatCard title="Médicaments" value={medications?.length || 0} icon={Pill} variant="primary" />
              <StatCard title="En attente" value={waitingVisits?.length || 0} icon={Calendar} variant="warning" />
            </div>
            <div className="grid gap-6 lg:grid-cols-2">
              <DashboardWaitingList visits={waitingVisits || []} isLoading={visitsLoading} />
              <DashboardPendingLabs requests={pendingLabs || []} isLoading={labsLoading} />
              <DashboardLowStock medications={lowStockMeds} isLoading={medsLoading} />
            </div>
          </>
        )}

        {/* ===== MÉDECIN ===== */}
        {!isDemo && role === 'medecin' && (
          <>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
              <StatCard title="Patients aujourd'hui" value={stats?.patientsToday || 0} icon={Users} variant="primary" />
              <StatCard title="Consultations" value={stats?.consultationsToday || 0} icon={Stethoscope} variant="success" />
              <StatCard title="Analyses en attente" value={stats?.pendingLabs || 0} icon={FlaskConical} variant={(stats?.pendingLabs || 0) > 5 ? 'warning' : 'default'} />
              <StatCard title="Imagerie en attente" value={stats?.pendingImaging || 0} icon={ImageIcon} variant="default" />
            </div>
            <div className="grid gap-6 lg:grid-cols-2">
              <DashboardWaitingList visits={waitingVisits || []} isLoading={visitsLoading} />
              <DashboardPendingLabs requests={pendingLabs || []} isLoading={labsLoading} />
            </div>
          </>
        )}

        {/* ===== INFIRMIER ===== */}
        {!isDemo && role === 'infirmier' && (
          <>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mb-8">
              <StatCard title="Patients aujourd'hui" value={stats?.patientsToday || 0} icon={Users} variant="primary" />
              <StatCard title="Stock faible" value={stats?.lowStockMedications || 0} icon={AlertTriangle} variant={(stats?.lowStockMedications || 0) > 0 ? 'danger' : 'default'} />
              <StatCard title="Analyses en attente" value={stats?.pendingLabs || 0} icon={FlaskConical} variant="default" />
            </div>
            <div className="grid gap-6 lg:grid-cols-2">
              <DashboardWaitingList visits={waitingVisits || []} isLoading={visitsLoading} />
              <DashboardLowStock medications={lowStockMeds} isLoading={medsLoading} />
            </div>
          </>
        )}

        {/* ===== ACCUEIL ===== */}
        {!isDemo && role === 'accueil' && (
          <>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-2 mb-8">
              <StatCard title="Patients aujourd'hui" value={stats?.patientsToday || 0} icon={Users} variant="primary" />
              <StatCard title="En attente" value={waitingVisits?.length || 0} icon={Calendar} variant="warning" />
            </div>
            <DashboardWaitingList visits={waitingVisits || []} isLoading={visitsLoading} />
          </>
        )}

        {/* ===== PHARMACIEN ===== */}
        {!isDemo && role === 'pharmacien' && (
          <>
            <div className="grid gap-4 sm:grid-cols-2 mb-8">
              <StatCard title="Stock faible" value={stats?.lowStockMedications || 0} icon={AlertTriangle} variant={(stats?.lowStockMedications || 0) > 0 ? 'danger' : 'default'} />
              <StatCard title="Médicaments" value={medications?.length || 0} icon={Pill} variant="primary" />
            </div>
            <DashboardLowStock medications={lowStockMeds} isLoading={medsLoading} />
          </>
        )}

        {/* ===== LABORANTIN ===== */}
        {!isDemo && role === 'laborantin' && (
          <>
            <div className="grid gap-4 sm:grid-cols-2 mb-8">
              <StatCard title="Analyses en attente" value={stats?.pendingLabs || 0} icon={FlaskConical} variant={(stats?.pendingLabs || 0) > 5 ? 'warning' : 'default'} />
              <StatCard title="Patients aujourd'hui" value={stats?.patientsToday || 0} icon={Users} variant="primary" />
            </div>
            <DashboardPendingLabs requests={pendingLabs || []} isLoading={labsLoading} />
          </>
        )}

        {/* ===== IMAGERIE ===== */}
        {!isDemo && role === 'imagerie' && (
          <>
            <div className="grid gap-4 sm:grid-cols-2 mb-8">
              <StatCard title="Imagerie en attente" value={stats?.pendingImaging || 0} icon={ImageIcon} variant={(stats?.pendingImaging || 0) > 5 ? 'warning' : 'default'} />
              <StatCard title="Patients aujourd'hui" value={stats?.patientsToday || 0} icon={Users} variant="primary" />
            </div>
            <DashboardPendingImaging />
          </>
        )}

        {/* ===== CAISSIER ===== */}
        {!isDemo && role === 'caissier' && (
          <>
            <div className="grid gap-4 sm:grid-cols-2 mb-8">
              <StatCard title="Recettes du jour" value={formatCurrency(stats?.revenueToday || 0)} icon={Banknote} variant="success" />
              <StatCard title="Patients aujourd'hui" value={stats?.patientsToday || 0} icon={Users} variant="primary" />
            </div>
            <DashboardRecentPayments />
          </>
        )}

        {/* ===== DAF ===== */}
        {!isDemo && role === 'daf' && (
          <>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mb-8">
              <StatCard title="Recettes du jour" value={formatCurrency(stats?.revenueToday || 0)} icon={Banknote} variant="success" />
              <StatCard title="Patients aujourd'hui" value={stats?.patientsToday || 0} icon={Users} variant="primary" />
              <StatCard title="Consultations" value={stats?.consultationsToday || 0} icon={Stethoscope} variant="default" />
            </div>
            <div className="grid gap-6 lg:grid-cols-2">
              <DashboardRecentInvoices />
              <DashboardRecentPayments />
            </div>
          </>
        )}

        {/* ===== ADMIN ===== */}
        {!isDemo && role === 'admin' && (
          <>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
              <StatCard title="Comptes utilisateurs" value={adminUserCount || 0} icon={Users} variant="primary" />
              <StatCard title="Max utilisateurs" value={adminLicense?.max_users || 0} icon={Shield} variant="default" />
              <StatCard title="Recettes du jour" value={formatCurrency(stats?.revenueToday || 0)} icon={Banknote} variant="success" />
              <StatCard title="Licence" value={adminLicense ? (adminLicense.is_active && new Date(adminLicense.expiry_date) >= new Date() ? 'Active' : 'Expirée') : 'N/A'} icon={KeyRound} variant={adminLicense?.is_active && new Date(adminLicense?.expiry_date) >= new Date() ? 'success' : 'danger'} />
            </div>
            {adminLicense && (
              <Card className="mb-8">
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <KeyRound className="h-4 w-4" />
                    Informations licence
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Clinique</p>
                      <p className="font-medium">{adminLicense.clinic_name}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Utilisateurs</p>
                      <p className="font-medium">{adminLicense.current_users} / {adminLicense.max_users}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Expiration</p>
                      <p className="font-medium">{new Date(adminLicense.expiry_date).toLocaleDateString('fr-FR')}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Modules activés</p>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {adminLicense.enabled_modules.map((m: string) => (
                          <Badge key={m} variant="outline" className="text-[10px]">{m}</Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
            <DashboardUsersList />
          </>
        )}

        {/* ===== SUPER ADMIN ===== */}
        {role === 'super_admin' && (
          <>
            {(() => {
              const totalLicenses = licenses?.length || 0;
              const activeLicenses = licenses?.filter(l => l.is_active && new Date(l.expiry_date) >= new Date()).length || 0;
              const expiredLicenses = licenses?.filter(l => new Date(l.expiry_date) < new Date()).length || 0;
              const totalUsers = licenses?.reduce((s, l) => s + l.current_users, 0) || 0;

              return (
                <>
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
                    <StatCard title="Total licences" value={totalLicenses} icon={KeyRound} variant="primary" />
                    <StatCard title="Licences actives" value={activeLicenses} icon={CheckCircle2} variant="success" />
                    <StatCard title="Licences expirées" value={expiredLicenses} icon={XCircle} variant={expiredLicenses > 0 ? 'danger' : 'default'} />
                    <StatCard title="Utilisateurs totaux" value={totalUsers} icon={Users} variant="default" />
                  </div>


                  {/* License table */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <KeyRound className="h-5 w-5" />
                        Licences récentes
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {!licenses || licenses.length === 0 ? (
                        <p className="text-muted-foreground text-center py-6">Aucune licence créée</p>
                      ) : (
                        <div className="overflow-x-auto">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Clinique</TableHead>
                                <TableHead>Clé</TableHead>
                                <TableHead>Utilisateurs</TableHead>
                                <TableHead>Expiration</TableHead>
                                <TableHead>Modules</TableHead>
                                <TableHead>Statut</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {licenses.slice(0, 10).map(lic => {
                                const isExpired = new Date(lic.expiry_date) < new Date();
                                const daysLeft = Math.ceil((new Date(lic.expiry_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
                                return (
                                  <TableRow key={lic.id}>
                                    <TableCell className="font-medium">{lic.clinic_name}</TableCell>
                                    <TableCell className="font-mono text-xs">{lic.license_key}</TableCell>
                                    <TableCell>
                                      <span className={lic.current_users >= lic.max_users ? 'text-destructive font-semibold' : ''}>
                                        {lic.current_users}/{lic.max_users}
                                      </span>
                                    </TableCell>
                                    <TableCell>
                                      <div className="flex items-center gap-1.5">
                                        <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                                        <span className="text-sm">{new Date(lic.expiry_date).toLocaleDateString('fr-FR')}</span>
                                        {!isExpired && daysLeft <= 30 && (
                                          <Badge variant="outline" className="text-warning border-warning/30 text-[10px]">{daysLeft}j</Badge>
                                        )}
                                      </div>
                                    </TableCell>
                                    <TableCell>
                                      <div className="flex flex-wrap gap-1">
                                        {lic.enabled_modules.slice(0, 3).map(m => (
                                          <Badge key={m} variant="outline" className="text-[10px]">{m}</Badge>
                                        ))}
                                        {lic.enabled_modules.length > 3 && (
                                          <Badge variant="outline" className="text-[10px]">+{lic.enabled_modules.length - 3}</Badge>
                                        )}
                                      </div>
                                    </TableCell>
                                    <TableCell>
                                      {isExpired ? (
                                        <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/30">Expirée</Badge>
                                      ) : !lic.is_active ? (
                                        <Badge variant="outline" className="bg-warning/10 text-warning border-warning/30">Suspendue</Badge>
                                      ) : (
                                        <Badge variant="outline" className="bg-success/10 text-success border-success/30">Active</Badge>
                                      )}
                                    </TableCell>
                                  </TableRow>
                                );
                              })}
                            </TableBody>
                          </Table>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </>
              );
            })()}
          </>
        )}
      </div>
    </AppLayout>
  );
};

export default Dashboard;
