import { AppLayout, PageHeader } from '@/components/layout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/hooks/useAuth';
import { AdminOverview } from '@/components/admin/AdminOverview';
import { UserManagement } from '@/components/admin/UserManagement';
import { ConventionManagement } from '@/components/admin/ConventionManagement';
import { MedicalActsManagement } from '@/components/admin/MedicalActsManagement';
import { RoomManagement } from '@/components/admin/RoomManagement';
import { BarChart3, Users, Handshake, Receipt, BedDouble } from 'lucide-react';

export default function Settings() {
  const { role } = useAuth();

  if (role !== 'admin') {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-full">
          <p className="text-muted-foreground">Accès réservé aux administrateurs.</p>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <PageHeader title="Administration" description="Vue d'ensemble et gestion de la clinique" />

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Vue d'ensemble
          </TabsTrigger>
          <TabsTrigger value="users" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Utilisateurs
          </TabsTrigger>
          <TabsTrigger value="conventions" className="flex items-center gap-2">
            <Handshake className="h-4 w-4" />
            Conventions
          </TabsTrigger>
          <TabsTrigger value="tarifs" className="flex items-center gap-2">
            <Receipt className="h-4 w-4" />
            Tarifs & Actes
          </TabsTrigger>
          <TabsTrigger value="chambres" className="flex items-center gap-2">
            <BedDouble className="h-4 w-4" />
            Chambres
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <AdminOverview />
        </TabsContent>

        <TabsContent value="users">
          <UserManagement />
        </TabsContent>

        <TabsContent value="conventions">
          <ConventionManagement />
        </TabsContent>

        <TabsContent value="tarifs">
          <MedicalActsManagement />
        </TabsContent>

        <TabsContent value="chambres">
          <RoomManagement />
        </TabsContent>
      </Tabs>
    </AppLayout>
  );
}
