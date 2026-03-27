import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { FileDown, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Patient } from '@/hooks/usePatients';
import { useClinicSettings } from '@/hooks/useClinicSettings';

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

export function PatientPDFExport({ patient, consultations, prescriptions, labRequests, imagingRequests, visits }: PatientPDFExportProps) {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { data: clinic } = useClinicSettings();

  const handleExport = async () => {
    setLoading(true);
    try {
      const html = buildReportHTML(patient, consultations, prescriptions, labRequests, imagingRequests, visits, clinic);
      
      // Open in a new window for printing as PDF
      const printWindow = window.open('', '_blank');
      if (!printWindow) {
        toast({ title: 'Erreur', description: 'Autorisez les popups pour exporter le PDF', variant: 'destructive' });
        return;
      }
      printWindow.document.write(html);
      printWindow.document.close();
      
      // Wait for content to load then trigger print
      printWindow.onload = () => {
        printWindow.print();
      };
      // Fallback if onload doesn't fire
      setTimeout(() => {
        printWindow.print();
      }, 500);

      toast({ title: 'Rapport généré', description: 'Utilisez "Enregistrer en PDF" dans la boîte d\'impression' });
    } catch (error: any) {
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button variant="outline" className="gap-2" onClick={handleExport} disabled={loading}>
      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileDown className="h-4 w-4" />}
      Exporter PDF
    </Button>
  );
}

function buildReportHTML(
  patient: Patient,
  consultations: any[],
  prescriptions: any[],
  labRequests: any[],
  imagingRequests: any[],
  visits: any[],
  clinic?: any
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
        <td>${p.medications?.name || 'Médicament'}</td>
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
  .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 3px solid #2563eb; padding-bottom: 12px; margin-bottom: 20px; }
  .header h1 { font-size: 20px; color: #2563eb; }
  .header .clinic-info { font-size: 10px; color: #666; }
  .header .report-date { text-align: right; font-size: 10px; color: #666; }
  .patient-info { background: #f0f4ff; padding: 14px; border-radius: 6px; margin-bottom: 20px; display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
  .patient-info .patient-name { font-size: 16px; font-weight: bold; grid-column: 1/-1; margin-bottom: 4px; }
  .patient-info .info-item { font-size: 11px; }
  .patient-info .info-label { color: #666; font-weight: 600; }
  .section { margin-bottom: 18px; page-break-inside: avoid; }
  .section h2 { font-size: 14px; color: #2563eb; border-bottom: 1px solid #ddd; padding-bottom: 4px; margin-bottom: 10px; }
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
  .stat-value { font-size: 18px; font-weight: bold; color: #2563eb; }
  .stat-label { font-size: 9px; color: #666; }
  @media print { body { padding: 10mm; } }
</style>
</head>
<body>
  <div class="header">
    <div>
      <h1>SantéPro</h1>
      <div class="clinic-info">Clinique Médicale — Rapport Médical Complet</div>
    </div>
    <div class="report-date">Généré le ${today}</div>
  </div>

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
    <p>SantéPro — Clinique Médicale — Généré le ${today}</p>
  </div>
</body>
</html>`;
}
