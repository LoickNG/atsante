import { AppLayout, PageHeader } from '@/components/layout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/hooks/useAuth';

import { UserManagement } from '@/components/admin/UserManagement';
import { ConventionManagement } from '@/components/admin/ConventionManagement';
import { MedicalActsManagement } from '@/components/admin/MedicalActsManagement';
import { RoomManagement } from '@/components/admin/RoomManagement';
import { ClinicSettingsManagement } from '@/components/admin/ClinicSettingsManagement';
import { LicenseManagement } from '@/components/admin/LicenseManagement';
import { LicenseActivation } from '@/components/admin/LicenseActivation';
import { ServiceManagement } from '@/components/admin/ServiceManagement';
import { Users, Handshake, Receipt, BedDouble, Stethoscope, Building2, Key } from 'lucide-react';
import { SpecialtyManagement } from '@/components/admin/SpecialtyManagement';

export default function Settings() {
  const { role } = useAuth();

  if (role !== 'admin' && role !== 'super_admin' && role !== 'demo') {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-full">
          <p className="text-muted-foreground">Accès réservé aux administrateurs.</p>
        </div>
      </AppLayout>
    );
  }

  // Super admin sees only the license management panel
  if (role === 'super_admin') {
    return (
      <AppLayout>
        <PageHeader title="Administration Super Admin" description="Gestion des licences multi-cliniques" />
        <LicenseManagement />
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <PageHeader title="Administration" description="Vue d'ensemble et gestion de la clinique" />

      <Tabs defaultValue="clinique" className="space-y-6">
        <TabsList className="flex-wrap">
          <TabsTrigger value="clinique" className="flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            Clinique
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
          <TabsTrigger value="specialites" className="flex items-center gap-2">
            <Stethoscope className="h-4 w-4" />
            Spécialités
          </TabsTrigger>
          <TabsTrigger value="chambres" className="flex items-center gap-2">
            <BedDouble className="h-4 w-4" />
            Chambres
          </TabsTrigger>
          <TabsTrigger value="services" className="flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            Services
          </TabsTrigger>
          <TabsTrigger value="licence" className="flex items-center gap-2">
            <Key className="h-4 w-4" />
            Licence
          </TabsTrigger>
        </TabsList>

        <TabsContent value="clinique">
          <ClinicSettingsManagement />
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

        <TabsContent value="specialites">
          <SpecialtyManagement />
        </TabsContent>

        <TabsContent value="chambres">
          <RoomManagement />
        </TabsContent>

        <TabsContent value="licence">
          <LicenseActivation />
        </TabsContent>

        <TabsContent value="services">
          <ServiceManagement />
        </TabsContent>
      </Tabs>
    </AppLayout>
  );
}