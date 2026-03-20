import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from '@/components/ui/dialog';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Separator } from '@/components/ui/separator';
import { Loader2, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { useUpdatePatient, Patient } from '@/hooks/usePatients';
import { useAuth } from '@/hooks/useAuth';

interface DeclareDeceasedDialogProps {
  patient: Patient | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DeclareDeceasedDialog({ patient, open, onOpenChange }: DeclareDeceasedDialogProps) {
  const updatePatient = useUpdatePatient();
  const { user } = useAuth();
  const [saving, setSaving] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const [form, setForm] = useState({
    deceased_at: new Date().toISOString().slice(0, 16),
    cause_of_death: '',
    place_of_death: '',
    death_notes: '',
  });

  const handleChange = (field: string, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleConfirm = async () => {
    if (!patient || !user) return;
    setSaving(true);
    try {
      await updatePatient.mutateAsync({
        id: patient.id,
        is_deceased: true,
        deceased_at: form.deceased_at ? new Date(form.deceased_at).toISOString() : new Date().toISOString(),
        cause_of_death: form.cause_of_death || null,
        place_of_death: form.place_of_death || null,
        death_notes: form.death_notes || null,
        death_declared_by: user.id,
      } as any);

      toast.success('Patient déclaré décédé. La fiche a été archivée.');
      setConfirmOpen(false);
      onOpenChange(false);
    } catch (err: any) {
      toast.error('Erreur: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  if (!patient) return null;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              Déclarer un décès
            </DialogTitle>
            <DialogDescription>
              Patient: <strong>{patient.first_name} {patient.last_name}</strong> ({patient.code})
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-sm text-destructive">
              <strong>Attention :</strong> Cette action est irréversible. La fiche du patient sera archivée et retirée de la liste active.
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>Date et heure du décès *</Label>
                <Input
                  type="datetime-local"
                  value={form.deceased_at}
                  onChange={e => handleChange('deceased_at', e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Lieu du décès</Label>
                <Input
                  placeholder="Ex: Hôpital, domicile..."
                  value={form.place_of_death}
                  onChange={e => handleChange('place_of_death', e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Cause du décès *</Label>
              <Textarea
                placeholder="Indiquer la cause principale du décès..."
                className="min-h-[80px]"
                value={form.cause_of_death}
                onChange={e => handleChange('cause_of_death', e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label>Notes complémentaires</Label>
              <Textarea
                placeholder="Circonstances, observations additionnelles..."
                className="min-h-[60px]"
                value={form.death_notes}
                onChange={e => handleChange('death_notes', e.target.value)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)}>Annuler</Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (!form.cause_of_death.trim()) {
                  toast.error('La cause du décès est obligatoire');
                  return;
                }
                setConfirmOpen(true);
              }}
            >
              Déclarer le décès
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmer la déclaration de décès</AlertDialogTitle>
            <AlertDialogDescription>
              Vous êtes sur le point de déclarer <strong>{patient.first_name} {patient.last_name}</strong> comme décédé.
              Cette action archivera définitivement la fiche du patient. Êtes-vous sûr ?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={saving}>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirm} disabled={saving} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Confirmer le décès
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
