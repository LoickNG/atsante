import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { Save, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useUpdatePatient, Patient } from '@/hooks/usePatients';
import { WebcamCapture } from '@/components/patient/WebcamCapture';

interface EditPatientDialogProps {
  patient: Patient;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditPatientDialog({ patient, open, onOpenChange }: EditPatientDialogProps) {
  const updatePatient = useUpdatePatient();
  const [photoBlob, setPhotoBlob] = useState<Blob | null>(null);
  const [photoPreviewUrl, setPhotoPreviewUrl] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    first_name: '',
    last_name: '',
    phone: '',
    address: '',
    blood_type: '',
    allergies: '',
    emergency_contact_name: '',
    emergency_contact_phone: '',
    emergency_contact_relationship: '',
  });

  useEffect(() => {
    if (open && patient) {
      setForm({
        first_name: patient.first_name,
        last_name: patient.last_name,
        phone: patient.phone,
        address: patient.address || '',
        blood_type: patient.blood_type || '',
        allergies: patient.allergies?.join(', ') || '',
        emergency_contact_name: patient.emergency_contact_name || '',
        emergency_contact_phone: patient.emergency_contact_phone || '',
        emergency_contact_relationship: patient.emergency_contact_relationship || '',
      });
      setPhotoPreviewUrl((patient as any).photo_url || null);
      setPhotoBlob(null);
    }
  }, [open, patient]);

  const handlePhotoCapture = useCallback((blob: Blob) => {
    setPhotoBlob(blob);
    setPhotoPreviewUrl(URL.createObjectURL(blob));
  }, []);

  const handlePhotoClear = useCallback(() => {
    setPhotoBlob(null);
    setPhotoPreviewUrl(null);
  }, []);

  const handleChange = (field: string, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    if (!form.first_name || !form.last_name || !form.phone) {
      toast.error('Nom, prénom et téléphone sont obligatoires');
      return;
    }

    setSaving(true);
    try {
      let photoUrl = (patient as any).photo_url || null;

      if (photoBlob) {
        const filePath = `${patient.id}.jpg`;
        const { error: uploadErr } = await supabase.storage
          .from('patient-photos')
          .upload(filePath, photoBlob, { contentType: 'image/jpeg', upsert: true });
        if (uploadErr) throw uploadErr;
        const { data } = supabase.storage.from('patient-photos').getPublicUrl(filePath);
        photoUrl = data.publicUrl;
      } else if (!photoPreviewUrl && (patient as any).photo_url) {
        // Photo was cleared
        photoUrl = null;
      }

      const allergiesArray = form.allergies
        ? form.allergies.split(',').map(a => a.trim()).filter(a => a)
        : null;

      await updatePatient.mutateAsync({
        id: patient.id,
        first_name: form.first_name,
        last_name: form.last_name,
        phone: form.phone,
        address: form.address || null,
        blood_type: form.blood_type || null,
        allergies: allergiesArray,
        emergency_contact_name: form.emergency_contact_name || null,
        emergency_contact_phone: form.emergency_contact_phone || null,
        emergency_contact_relationship: form.emergency_contact_relationship || null,
        photo_url: photoUrl,
      } as any);

      toast.success('Patient mis à jour avec succès');
      onOpenChange(false);
    } catch (err: any) {
      console.error(err);
      toast.error('Erreur: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Modifier le patient</DialogTitle>
          <DialogDescription>Modifiez les informations du patient {patient.first_name} {patient.last_name}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Photo */}
          <div className="flex justify-center">
            <WebcamCapture onCapture={handlePhotoCapture} capturedUrl={photoPreviewUrl} onClear={handlePhotoClear} />
          </div>

          <Separator />

          {/* Identity */}
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Nom *</Label>
              <Input value={form.last_name} onChange={e => handleChange('last_name', e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Prénom *</Label>
              <Input value={form.first_name} onChange={e => handleChange('first_name', e.target.value)} />
            </div>
          </div>

          {/* Contact */}
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Téléphone *</Label>
              <Input type="tel" value={form.phone} onChange={e => handleChange('phone', e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Groupe sanguin</Label>
              <Select value={form.blood_type || 'none'} onValueChange={v => handleChange('blood_type', v === 'none' ? '' : v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Non renseigné</SelectItem>
                  <SelectItem value="A+">A+</SelectItem><SelectItem value="A-">A-</SelectItem>
                  <SelectItem value="B+">B+</SelectItem><SelectItem value="B-">B-</SelectItem>
                  <SelectItem value="AB+">AB+</SelectItem><SelectItem value="AB-">AB-</SelectItem>
                  <SelectItem value="O+">O+</SelectItem><SelectItem value="O-">O-</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Adresse</Label>
            <Textarea value={form.address} onChange={e => handleChange('address', e.target.value)} className="min-h-[60px]" />
          </div>

          <div className="space-y-1.5">
            <Label>Allergies (séparées par des virgules)</Label>
            <Input value={form.allergies} onChange={e => handleChange('allergies', e.target.value)} placeholder="Ex: Pénicilline, Aspirine" />
          </div>

          <Separator />

          {/* Emergency contact */}
          <p className="text-sm font-medium">Contact d'urgence</p>
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="space-y-1.5">
              <Label>Nom</Label>
              <Input value={form.emergency_contact_name} onChange={e => handleChange('emergency_contact_name', e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Téléphone</Label>
              <Input type="tel" value={form.emergency_contact_phone} onChange={e => handleChange('emergency_contact_phone', e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Lien</Label>
              <Select value={form.emergency_contact_relationship || 'none'} onValueChange={v => handleChange('emergency_contact_relationship', v === 'none' ? '' : v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">—</SelectItem>
                  <SelectItem value="epoux">Époux/Épouse</SelectItem>
                  <SelectItem value="parent">Parent</SelectItem>
                  <SelectItem value="enfant">Enfant</SelectItem>
                  <SelectItem value="frere_soeur">Frère/Sœur</SelectItem>
                  <SelectItem value="autre">Autre</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Annuler</Button>
          <Button onClick={handleSave} disabled={saving} className="gap-1.5">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Enregistrer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
