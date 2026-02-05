import { useState, useEffect } from 'react';
import { AppLayout, PageHeader } from '@/components/layout';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { UserPlus, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { QueueStats } from '@/components/waiting-queue/QueueStats';
import { QueueItem } from '@/components/waiting-queue/QueueItem';
import { AddPatientDialog } from '@/components/waiting-queue/AddPatientDialog';

interface Visit {
  id: string;
  patient_id: string;
  date: string;
  type: string;
  status: string;
  assigned_doctor_id: string | null;
}

interface Patient {
  id: string;
  code: string;
  first_name: string;
  last_name: string;
}

const WaitingQueue = () => {
  const { toast } = useToast();
  const { user, userRole } = useAuth();
  const [loading, setLoading] = useState(true);
  const [visits, setVisits] = useState<Visit[]>([]);
  const [patients, setPatients] = useState<Record<string, Patient>>({});
  const [doctors, setDoctors] = useState<Record<string, string>>({});
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [activeTab, setActiveTab] = useState('active');

  useEffect(() => {
    fetchData();
  }, [user, userRole]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Get today's start
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Fetch visits for today
      let query = supabase
        .from('visits')
        .select('*')
        .gte('date', today.toISOString())
        .order('date', { ascending: true });

      // If user is a doctor, only show unassigned or assigned to them
      if (userRole === 'medecin' && user) {
        query = query.or(`assigned_doctor_id.is.null,assigned_doctor_id.eq.${user.id}`);
      }

      const { data: visitsData, error } = await query;
      if (error) throw error;

      setVisits(visitsData || []);

      // Fetch patients for these visits
      if (visitsData && visitsData.length > 0) {
        const patientIds = [...new Set(visitsData.map(v => v.patient_id))];
        const { data: patientsData } = await supabase
          .from('patients')
          .select('id, code, first_name, last_name')
          .in('id', patientIds);

        if (patientsData) {
          const patientsMap: Record<string, Patient> = {};
          patientsData.forEach(p => { patientsMap[p.id] = p; });
          setPatients(patientsMap);
        }

        // Fetch doctor names
        const doctorIds = visitsData
          .filter(v => v.assigned_doctor_id)
          .map(v => v.assigned_doctor_id!);
        
        if (doctorIds.length > 0) {
          const { data: profilesData } = await supabase
            .from('profiles')
            .select('user_id, full_name')
            .in('user_id', doctorIds);

          if (profilesData) {
            const doctorsMap: Record<string, string> = {};
            profilesData.forEach(p => { doctorsMap[p.user_id] = p.full_name; });
            setDoctors(doctorsMap);
          }
        }
      }
    } catch (error: any) {
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleCall = async (visitId: string) => {
    try {
      const { error } = await supabase
        .from('visits')
        .update({ 
          status: 'en_cours',
          assigned_doctor_id: user?.id 
        })
        .eq('id', visitId);

      if (error) throw error;
      toast({ title: 'Patient appelé', description: 'Le patient est maintenant en consultation' });
      fetchData();
    } catch (error: any) {
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' });
    }
  };

  const handleComplete = async (visitId: string) => {
    try {
      const { error } = await supabase
        .from('visits')
        .update({ status: 'termine' })
        .eq('id', visitId);

      if (error) throw error;
      toast({ title: 'Consultation terminée', description: 'Le patient a été traité' });
      fetchData();
    } catch (error: any) {
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' });
    }
  };

  const handleCancel = async (visitId: string) => {
    try {
      const { error } = await supabase
        .from('visits')
        .update({ status: 'annule' })
        .eq('id', visitId);

      if (error) throw error;
      toast({ title: 'Visite annulée' });
      fetchData();
    } catch (error: any) {
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' });
    }
  };

  const activeVisits = visits.filter(v => v.status === 'en_attente' || v.status === 'en_cours');
  const completedVisits = visits.filter(v => v.status === 'termine' || v.status === 'annule');
  const waitingCount = visits.filter(v => v.status === 'en_attente').length;
  const inProgressCount = visits.filter(v => v.status === 'en_cours').length;
  const completedCount = visits.filter(v => v.status === 'termine').length;

  return (
    <AppLayout>
      <div className="p-6 lg:p-8">
        <div className="flex items-center justify-between mb-6">
          <PageHeader
            title="File d'attente"
            description={`${waitingCount} en attente • ${inProgressCount} en consultation`}
          />
          {(userRole === 'admin' || userRole === 'accueil') && (
            <Button onClick={() => setShowAddDialog(true)} className="gap-2">
              <UserPlus className="h-4 w-4" />
              Ajouter un patient
            </Button>
          )}
        </div>

        <QueueStats
          waitingCount={waitingCount}
          inProgressCount={inProgressCount}
          completedCount={completedCount}
        />

        <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-8">
          <TabsList>
            <TabsTrigger value="active">
              En cours ({activeVisits.length})
            </TabsTrigger>
            <TabsTrigger value="completed">
              Historique ({completedVisits.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="active" className="mt-4 space-y-4">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : activeVisits.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                Aucun patient dans la file d'attente
              </div>
            ) : (
              activeVisits.map((visit, index) => {
                const patient = patients[visit.patient_id];
                if (!patient) return null;

                return (
                  <QueueItem
                    key={visit.id}
                    visit={visit}
                    patient={patient}
                    doctorName={visit.assigned_doctor_id ? doctors[visit.assigned_doctor_id] : undefined}
                    index={index}
                    onCall={handleCall}
                    onComplete={handleComplete}
                    onCancel={handleCancel}
                  />
                );
              })
            )}
          </TabsContent>

          <TabsContent value="completed" className="mt-4 space-y-4">
            {completedVisits.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                Aucune consultation terminée aujourd'hui
              </div>
            ) : (
              completedVisits.map((visit, index) => {
                const patient = patients[visit.patient_id];
                if (!patient) return null;

                return (
                  <QueueItem
                    key={visit.id}
                    visit={visit}
                    patient={patient}
                    doctorName={visit.assigned_doctor_id ? doctors[visit.assigned_doctor_id] : undefined}
                    index={index}
                    onCall={() => {}}
                    onComplete={() => {}}
                    onCancel={() => {}}
                  />
                );
              })
            )}
          </TabsContent>
        </Tabs>

        <AddPatientDialog
          open={showAddDialog}
          onOpenChange={setShowAddDialog}
          onSuccess={fetchData}
        />
      </div>
    </AppLayout>
  );
};

export default WaitingQueue;
