import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Loader2, Save, Thermometer, Heart, Activity } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useUpdateConsultation, Consultation } from '@/hooks/useConsultations';
import { toast } from 'sonner';

interface EditConsultationDialogProps {
  consultation: Consultation | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditConsultationDialog({ consultation, open, onOpenChange }: EditConsultationDialogProps) {
  const updateConsultation = useUpdateConsultation();
  const [isSaving, setIsSaving] = useState(false);

  const [symptoms, setSymptoms] = useState('');
  const [diagnosis, setDiagnosis] = useState('');
  const [notes, setNotes] = useState('');
  const [temperature, setTemperature] = useState('');
  const [bloodPressure, setBloodPressure] = useState('');
  const [heartRate, setHeartRate] = useState('');
  const [weight, setWeight] = useState('');
  const [height, setHeight] = useState('');

  useEffect(() => {
    if (consultation && open) {
      setSymptoms(consultation.symptoms || '');
      setDiagnosis(consultation.diagnosis || '');
      setNotes(consultation.notes || '');
      setTemperature(consultation.temperature ? String(consultation.temperature) : '');
      setBloodPressure(consultation.blood_pressure || '');
      setHeartRate(consultation.heart_rate ? String(consultation.heart_rate) : '');
      setWeight(consultation.weight ? String(consultation.weight) : '');
      setHeight(consultation.height ? String(consultation.height) : '');
    }
  }, [consultation, open]);

  const handleSave = async () => {
    if (!consultation) return;
    if (!symptoms || !diagnosis) {
      toast.error('Les symptômes et le diagnostic sont obligatoires');
      return;
    }

    setIsSaving(true);
    try {
      await updateConsultation.mutateAsync({
        id: consultation.id,
        symptoms,
        diagnosis,
        notes: notes || null,
        temperature: temperature ? parseFloat(temperature) : null,
        blood_pressure: bloodPressure || null,
        heart_rate: heartRate ? parseInt(heartRate) : null,
        weight: weight ? parseFloat(weight) : null,
        height: height ? parseFloat(height) : null,
      });
      toast.success('Consultation modifiée avec succès');
      onOpenChange(false);
    } catch (e: any) {
      toast.error('Erreur: ' + e.message);
    } finally {
      setIsSaving(false);
    }
  };

  if (!consultation) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Modifier la consultation</DialogTitle>
          <DialogDescription>
            Consultation du {new Date(consultation.date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Vital Signs */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Activity className="h-4 w-4 text-primary" />Signes vitaux
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3 sm:grid-cols-5">
              <div className="space-y-1">
                <Label className="text-xs flex items-center gap-1"><Thermometer className="h-3 w-3" />Temp. (°C)</Label>
                <Input type="number" step="0.1" placeholder="37.0" value={temperature} onChange={e => setTemperature(e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs flex items-center gap-1"><Heart className="h-3 w-3" />TA (mmHg)</Label>
                <Input placeholder="120/80" value={bloodPressure} onChange={e => setBloodPressure(e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Pouls (bpm)</Label>
                <Input type="number" placeholder="80" value={heartRate} onChange={e => setHeartRate(e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Poids (kg)</Label>
                <Input type="number" step="0.1" placeholder="70" value={weight} onChange={e => setWeight(e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Taille (cm)</Label>
                <Input type="number" placeholder="170" value={height} onChange={e => setHeight(e.target.value)} />
              </div>
            </CardContent>
          </Card>

          {/* Symptoms */}
          <div className="space-y-1.5">
            <Label className="text-sm font-medium">Motif & Symptômes *</Label>
            <Textarea placeholder="Décrivez les symptômes..." className="min-h-[100px]" value={symptoms} onChange={e => setSymptoms(e.target.value)} />
          </div>

          {/* Diagnosis */}
          <div className="space-y-1.5">
            <Label className="text-sm font-medium">Diagnostic *</Label>
            <Textarea placeholder="Diagnostic établi..." className="min-h-[100px]" value={diagnosis} onChange={e => setDiagnosis(e.target.value)} />
          </div>

          {/* Notes */}
          <div className="space-y-1.5">
            <Label className="text-sm font-medium">Notes additionnelles</Label>
            <Textarea placeholder="Observations, recommandations..." value={notes} onChange={e => setNotes(e.target.value)} />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Annuler</Button>
          <Button onClick={handleSave} disabled={isSaving} className="gap-2">
            {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {isSaving ? 'Enregistrement...' : 'Enregistrer'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
