import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { FileDown, Loader2, CalendarIcon, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Patient } from '@/hooks/usePatients';
import { useClinicSettings } from '@/hooks/useClinicSettings';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format, isAfter, isBefore, startOfDay, endOfDay } from 'date-fns';
import { fr } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';

interface PatientPDFExportProps {
  patient: Patient;
  consultations: any[];
  prescriptions: any[];
  labRequests: any[];
  imagingRequests: any[];
  visits: any[];
}

const formatDate = (d: string) => new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' });
const formatDateTime = (d: string) => new Date(d).toLocaleString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

function calculateAge(dateOfBirth: string) {
  const today = new Date();
  const birth = new Date(dateOfBirth);
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age;
}

type FilterMode = 'all' | 'period' | 'visits';

export function PatientPDFExport({ patient, consultations, prescriptions, labRequests, imagingRequests, visits }: PatientPDFExportProps) {
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [filterMode, setFilterMode] = useState<FilterMode>('all');
  const [dateFrom, setDateFrom] = useState<Date | undefined>();
  const [dateTo, setDateTo] = useState<Date | undefined>();
  const [selectedVisitIds, setSelectedVisitIds] = useState<string[]>([]);
  const { toast } = useToast();
  const { data: clinic } = useClinicSettings();

  const sortedVisits = useMemo(
    () => [...(visits || [])].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
    [visits]
  );

  const toggleVisit = (id: string) => {
    setSelectedVisitIds(prev => prev.includes(id) ? prev.filter(v => v !== id) : [...prev, id]);
  };

  const applyFilters = () => {
    let v = visits || [];
    let c = consultations || [];
    let p = prescriptions || [];
    let l = labRequests || [];
    let i = imagingRequests || [];

    if (filterMode === 'period') {
      const inRange = (d: string) => {
        const date = new Date(d);
        if (dateFrom && isBefore(date, startOfDay(dateFrom))) return false;
        if (dateTo && isAfter(date, endOfDay(dateTo))) return false;
        return true;
      };
      v = v.filter(x => inRange(x.date));
      c = c.filter(x => inRange(x.date));
      p = p.filter(x => inRange(x.created_at));
      l = l.filter(x => inRange(x.requested_at));
      i = i.filter(x => inRange(x.requested_at));
    } else if (filterMode === 'visits') {
      const ids = new Set(selectedVisitIds);
      v = v.filter(x => ids.has(x.id));
      c = c.filter(x => ids.has(x.visit_id));
      const consultationIds = new Set(c.map(x => x.id));
      p = p.filter(x => consultationIds.has(x.consultation_id));
      l = l.filter(x => ids.has(x.visit_id) || consultationIds.has(x.consultation_id));
      i = i.filter(x => ids.has(x.visit_id) || consultationIds.has(x.consultation_id));
    }

    return { v, c, p, l, i };
  };

  const handleExport = async () => {
    if (filterMode === 'period' && !dateFrom && !dateTo) {
      toast({ title: 'Sélectionnez une période', variant: 'destructive' });
      return;
    }
    if (filterMode === 'visits' && selectedVisitIds.length === 0) {
      toast({ title: 'Sélectionnez au moins une visite', variant: 'destructive' });
      return;
    }
    setLoading(true);
    try {
      const { v, c, p, l, i } = applyFilters();
      const periodLabel =
        filterMode === 'period'
          ? `Période : ${dateFrom ? format(dateFrom, 'dd/MM/yyyy', { locale: fr }) : '...'} → ${dateTo ? format(dateTo, 'dd/MM/yyyy', { locale: fr }) : '...'}`
          : filterMode === 'visits'
          ? `${selectedVisitIds.length} visite(s) sélectionnée(s)`
          : 'Dossier complet';

      const html = buildReportHTML(patient, c, p, l, i, v, clinic, periodLabel);

      const printWindow = window.open('', '_blank');
      if (!printWindow) {
        toast({ title: 'Erreur', description: 'Autorisez les popups pour exporter le PDF', variant: 'destructive' });
        return;
      }
      printWindow.document.write(html);
      printWindow.document.close();

      printWindow.onload = () => printWindow.print();
      setTimeout(() => printWindow.print(), 500);

      setOpen(false);
      toast({ title: 'Rapport généré', description: 'Utilisez "Enregistrer en PDF" dans la boîte d\'impression' });
    } catch (error: any) {
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full gap-2">
          <FileDown className="h-4 w-4" />
          Exporter PDF
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Exporter le dossier médical</DialogTitle>
          <DialogDescription>
            Choisissez ce que vous souhaitez inclure dans le document imprimé.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <RadioGroup value={filterMode} onValueChange={(v) => setFilterMode(v as FilterMode)}>
            <div className="flex items-start gap-2 p-3 rounded-md border hover:bg-muted/40">
              <RadioGroupItem value="all" id="opt-all" className="mt-1" />
              <Label htmlFor="opt-all" className="cursor-pointer flex-1">
                <div className="font-medium">Dossier complet</div>
                <div className="text-xs text-muted-foreground">Tout l'historique du patient</div>
              </Label>
            </div>
            <div className="flex items-start gap-2 p-3 rounded-md border hover:bg-muted/40">
              <RadioGroupItem value="period" id="opt-period" className="mt-1" />
              <Label htmlFor="opt-period" className="cursor-pointer flex-1">
                <div className="font-medium">Filtrer par période</div>
                <div className="text-xs text-muted-foreground">Choisir une plage de dates</div>
              </Label>
            </div>
            <div className="flex items-start gap-2 p-3 rounded-md border hover:bg-muted/40">
              <RadioGroupItem value="visits" id="opt-visits" className="mt-1" />
              <Label htmlFor="opt-visits" className="cursor-pointer flex-1">
                <div className="font-medium">Sélectionner des visites</div>
                <div className="text-xs text-muted-foreground">{visits?.length || 0} visite(s) disponible(s)</div>
              </Label>
            </div>
          </RadioGroup>

          {filterMode === 'period' && (
            <div className="flex items-center gap-2 flex-wrap p-3 rounded-md bg-muted/30">
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm" className={cn("gap-1.5", !dateFrom && "text-muted-foreground")}>
                    <CalendarIcon className="h-3.5 w-3.5" />
                    {dateFrom ? format(dateFrom, 'dd MMM yyyy', { locale: fr }) : 'Du'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar mode="single" selected={dateFrom} onSelect={setDateFrom} initialFocus className="p-3 pointer-events-auto" />
                </PopoverContent>
              </Popover>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm" className={cn("gap-1.5", !dateTo && "text-muted-foreground")}>
                    <CalendarIcon className="h-3.5 w-3.5" />
                    {dateTo ? format(dateTo, 'dd MMM yyyy', { locale: fr }) : 'Au'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar mode="single" selected={dateTo} onSelect={setDateTo} initialFocus className="p-3 pointer-events-auto" />
                </PopoverContent>
              </Popover>
              {(dateFrom || dateTo) && (
                <Button variant="ghost" size="sm" className="h-8 px-2" onClick={() => { setDateFrom(undefined); setDateTo(undefined); }}>
                  <X className="h-3.5 w-3.5" />
                </Button>
              )}
            </div>
          )}

          {filterMode === 'visits' && (
            <div className="border rounded-md">
              <div className="flex items-center justify-between p-2 border-b bg-muted/30">
                <span className="text-xs font-medium">{selectedVisitIds.length} sélectionnée(s) sur {sortedVisits.length}</span>
                <Button variant="ghost" size="sm" className="h-7 text-xs"
                  onClick={() => setSelectedVisitIds(selectedVisitIds.length === sortedVisits.length ? [] : sortedVisits.map(v => v.id))}>
                  {selectedVisitIds.length === sortedVisits.length ? 'Tout désélectionner' : 'Tout sélectionner'}
                </Button>
              </div>
              <ScrollArea className="h-56">
                <div className="p-2 space-y-1">
                  {sortedVisits.length === 0 ? (
                    <p className="text-center text-xs text-muted-foreground py-4">Aucune visite</p>
                  ) : sortedVisits.map(v => (
                    <label key={v.id} className="flex items-center gap-2 p-2 rounded hover:bg-muted/50 cursor-pointer">
                      <Checkbox
                        checked={selectedVisitIds.includes(v.id)}
                        onCheckedChange={() => toggleVisit(v.id)}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium capitalize">{v.type || 'Visite'}</div>
                        <div className="text-xs text-muted-foreground">{formatDateTime(v.date)}</div>
                      </div>
                      <span className="text-[10px] text-muted-foreground">{v.status}</span>
                    </label>
                  ))}
                </div>
              </ScrollArea>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Annuler</Button>
          <Button onClick={handleExport} disabled={loading} className="gap-2">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileDown className="h-4 w-4" />}
            Générer le PDF
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function buildReportHTML(
  patient: Patient,
  consultations: any[],
  prescriptions: any[],
  labRequests: any[],
  imagingRequests: any[],
  visits: any[],
  clinic?: any,
  periodLabel?: string
): string {
  const age = calculateAge(patient.date_of_birth);
  const today = formatDate(new Date().toISOString());
  const clinicName = clinic?.name || 'Ma Clinique';
  const clinicSubtitle = [clinic?.slogan, clinic?.city].filter(Boolean).join(' — ') || '';
  const clinicAddress = [clinic?.address, clinic?.city, clinic?.country].filter(Boolean).join(', ');
  const clinicPhone = clinic?.phone || '';
  const clinicEmail = clinic?.email || '';
  const clinicColor = clinic?.primary_color || '#2563eb';
  const logoHtml = clinic?.logo_url ? `<img src="${clinic.logo_url}" style="height:40px;object-fit:contain;margin-right:10px;" />` : '';

  const consultationRows = (consultations || [])
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .map(c => {
      const vitals = [
        c.temperature ? `Temp: ${c.temperature}°C` : '',
        c.heart_rate ? `FC: ${c.heart_rate} bpm` : '',
        c.blood_pressure ? `TA: ${c.blood_pressure}` : '',
        c.weight ? `Poids: ${c.weight} kg` : '',
        c.height ? `Taille: ${c.height} cm` : '',
      ].filter(Boolean).join(' | ');

      return `
        <div class="section-item">
          <div class="item-header">
            <strong>${c.diagnosis || 'Diagnostic non renseigné'}</strong>
            <span class="date">${formatDateTime(c.date)}</span>
          </div>
          ${vitals ? `<div class="vitals">${vitals}</div>` : ''}
          ${c.symptoms ? `<div class="field"><span class="field-label">Symptômes:</span> ${c.symptoms}</div>` : ''}
          ${c.notes ? `<div class="field"><span class="field-label">Notes:</span> ${c.notes}</div>` : ''}
        </div>`;
    }).join('');

  const prescriptionRows = (prescriptions || [])
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .map(p => `
      <tr>
        <td>${p.medications?.name || p.medication_name || 'Médicament'}</td>
        <td>${p.dosage}</td>
        <td>${p.frequency}</td>
        <td>${p.duration}</td>
        <td>${p.dispensed ? '✓ Délivré' : 'En attente'}</td>
        <td>${formatDate(p.created_at)}</td>
      </tr>
    `).join('');

  const labRows = (labRequests || [])
    .sort((a, b) => new Date(b.requested_at).getTime() - new Date(a.requested_at).getTime())
    .map(l => `
      <div class="section-item">
        <div class="item-header">
          <strong>${l.test_type}</strong>
          <span class="badge ${l.status === 'termine' ? 'badge-success' : ''}">${l.status === 'termine' ? 'Terminé' : l.status === 'en_cours' ? 'En cours' : 'Demandé'}</span>
        </div>
        ${l.results ? `<div class="results">${l.results}</div>` : ''}
        <div class="date">Demandé le ${formatDateTime(l.requested_at)}${l.completed_at ? ` — Terminé le ${formatDateTime(l.completed_at)}` : ''}</div>
      </div>
    `).join('');

  const imagingRows = (imagingRequests || [])
    .sort((a, b) => new Date(b.requested_at).getTime() - new Date(a.requested_at).getTime())
    .map(i => `
      <div class="section-item">
        <div class="item-header">
          <strong>${i.exam_type} — ${i.body_part}</strong>
          <span class="badge ${i.status === 'termine' ? 'badge-success' : ''}">${i.status === 'termine' ? 'Terminé' : i.status === 'en_cours' ? 'En cours' : 'Demandé'}</span>
        </div>
        ${i.report ? `<div class="results">${i.report}</div>` : ''}
        <div class="date">Demandé le ${formatDateTime(i.requested_at)}${i.completed_at ? ` — Réalisé le ${formatDateTime(i.completed_at)}` : ''}</div>
      </div>
    `).join('');

  return `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<title>Rapport Médical — ${patient.first_name} ${patient.last_name}</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; font-size: 11px; color: #1a1a1a; padding: 20mm 15mm; }
  .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 3px solid ${clinicColor}; padding-bottom: 12px; margin-bottom: 20px; }
  .header h1 { font-size: 20px; color: ${clinicColor}; }
  .header .clinic-info { font-size: 10px; color: #666; }
  .header .report-date { text-align: right; font-size: 10px; color: #666; }
  .filter-banner { background: ${clinicColor}11; border-left: 3px solid ${clinicColor}; padding: 8px 12px; border-radius: 4px; margin-bottom: 16px; font-size: 11px; color: #444; }
  .patient-info { background: #f0f4ff; padding: 14px; border-radius: 6px; margin-bottom: 20px; display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
  .patient-info .patient-name { font-size: 16px; font-weight: bold; grid-column: 1/-1; margin-bottom: 4px; }
  .patient-info .info-item { font-size: 11px; }
  .patient-info .info-label { color: #666; font-weight: 600; }
  .section { margin-bottom: 18px; page-break-inside: avoid; }
  .section h2 { font-size: 14px; color: ${clinicColor}; border-bottom: 1px solid #ddd; padding-bottom: 4px; margin-bottom: 10px; }
  .section-item { border: 1px solid #e5e7eb; border-radius: 4px; padding: 10px; margin-bottom: 8px; }
  .item-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px; }
  .vitals { font-size: 10px; color: #555; background: #fafafa; padding: 4px 8px; border-radius: 3px; margin-bottom: 6px; }
  .field { font-size: 11px; margin-bottom: 3px; }
  .field-label { font-weight: 600; color: #555; }
  .date { font-size: 10px; color: #888; }
  .results { font-size: 11px; background: #fafafa; padding: 8px; border-radius: 3px; margin: 6px 0; white-space: pre-wrap; }
  .badge { font-size: 9px; padding: 2px 6px; border-radius: 3px; background: #e5e7eb; }
  .badge-success { background: #d1fae5; color: #065f46; }
  table { width: 100%; border-collapse: collapse; font-size: 10px; }
  th, td { padding: 6px 8px; border: 1px solid #e5e7eb; text-align: left; }
  th { background: #f9fafb; font-weight: 600; }
  .footer { margin-top: 30px; border-top: 1px solid #ddd; padding-top: 10px; text-align: center; font-size: 9px; color: #999; }
  .stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; margin-bottom: 18px; }
  .stat { text-align: center; background: #f9fafb; padding: 8px; border-radius: 4px; border: 1px solid #e5e7eb; }
  .stat-value { font-size: 18px; font-weight: bold; color: ${clinicColor}; }
  .stat-label { font-size: 9px; color: #666; }
  @media print { body { padding: 10mm; } }
</style>
</head>
<body>
  <div class="header">
    <div style="display:flex;align-items:center">
      ${logoHtml}
      <div>
        <h1>${clinicName}</h1>
        <div class="clinic-info">${clinicSubtitle ? clinicSubtitle + ' — ' : ''}Rapport Médical</div>
        ${clinicAddress ? `<div class="clinic-info">${clinicAddress}</div>` : ''}
        ${clinicPhone ? `<div class="clinic-info">Tél: ${clinicPhone}${clinicEmail ? ' — ' + clinicEmail : ''}</div>` : ''}
      </div>
    </div>
    <div class="report-date">Généré le ${today}</div>
  </div>

  ${periodLabel ? `<div class="filter-banner"><strong>Filtre :</strong> ${periodLabel}</div>` : ''}

  <div class="patient-info">
    <div class="patient-name">${patient.first_name} ${patient.last_name}</div>
    <div class="info-item"><span class="info-label">Code:</span> ${patient.code}</div>
    <div class="info-item"><span class="info-label">Âge:</span> ${age} ans</div>
    <div class="info-item"><span class="info-label">Sexe:</span> ${patient.gender === 'F' ? 'Féminin' : 'Masculin'}</div>
    <div class="info-item"><span class="info-label">Groupe sanguin:</span> ${patient.blood_type || 'Non renseigné'}</div>
    <div class="info-item"><span class="info-label">Téléphone:</span> ${patient.phone}</div>
    <div class="info-item"><span class="info-label">Né(e) le:</span> ${formatDate(patient.date_of_birth)}</div>
    ${patient.allergies && patient.allergies.length > 0 ? `<div class="info-item" style="grid-column:1/-1;color:#dc2626"><span class="info-label">⚠ Allergies:</span> ${patient.allergies.join(', ')}</div>` : ''}
  </div>

  <div class="stats">
    <div class="stat"><div class="stat-value">${visits.length}</div><div class="stat-label">Visites</div></div>
    <div class="stat"><div class="stat-value">${consultations.length}</div><div class="stat-label">Consultations</div></div>
    <div class="stat"><div class="stat-value">${labRequests.length}</div><div class="stat-label">Analyses</div></div>
    <div class="stat"><div class="stat-value">${imagingRequests.length}</div><div class="stat-label">Imageries</div></div>
  </div>

  ${consultations.length > 0 ? `
  <div class="section">
    <h2>Consultations (${consultations.length})</h2>
    ${consultationRows}
  </div>` : ''}

  ${prescriptions.length > 0 ? `
  <div class="section">
    <h2>Ordonnances (${prescriptions.length})</h2>
    <table>
      <thead><tr><th>Médicament</th><th>Dosage</th><th>Fréquence</th><th>Durée</th><th>Statut</th><th>Date</th></tr></thead>
      <tbody>${prescriptionRows}</tbody>
    </table>
  </div>` : ''}

  ${labRequests.length > 0 ? `
  <div class="section">
    <h2>Analyses de laboratoire (${labRequests.length})</h2>
    ${labRows}
  </div>` : ''}

  ${imagingRequests.length > 0 ? `
  <div class="section">
    <h2>Examens d'imagerie (${imagingRequests.length})</h2>
    ${imagingRows}
  </div>` : ''}

  <div class="footer">
    <p>Document confidentiel — Rapport médical de ${patient.first_name} ${patient.last_name} (${patient.code})</p>
    <p>${clinicName}${clinicSubtitle ? ' — ' + clinicSubtitle : ''}${clinicAddress ? ' — ' + clinicAddress : ''} — Généré le ${today}</p>
  </div>
</body>
</html>`;
}
