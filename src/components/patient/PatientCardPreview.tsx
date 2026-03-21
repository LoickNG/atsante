import { Button } from '@/components/ui/button';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog';
import { QRCodeSVG } from 'qrcode.react';
import { Printer, User, Cross } from 'lucide-react';
import { Patient } from '@/hooks/usePatients';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useClinicSettings } from '@/hooks/useClinicSettings';

interface PatientCardPreviewProps {
  patient: Patient | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PatientCardPreview({ patient, open, onOpenChange }: PatientCardPreviewProps) {
  const { data: clinicSettings } = useClinicSettings();
  
  if (!patient) return null;

  const HOSPITAL = {
    name: clinicSettings?.name || 'Ma Clinique',
    subtitle: clinicSettings?.slogan || '',
    address: [clinicSettings?.city, clinicSettings?.country].filter(Boolean).join(', ') || '',
    phone: clinicSettings?.phone || '',
    logo_url: clinicSettings?.logo_url || '',
    color: clinicSettings?.primary_color || '#7fb3c8',
  };

  const { data: company } = useQuery({
    queryKey: ['partner_company', patient.company_id],
    queryFn: async () => {
      if (!patient.company_id) return null;
      const { data } = await supabase
        .from('partner_companies')
        .select('name, code')
        .eq('id', patient.company_id)
        .single();
      return data;
    },
    enabled: !!patient.company_id,
  });

  const { data: convention } = useQuery({
    queryKey: ['convention', patient.convention_id],
    queryFn: async () => {
      if (!patient.convention_id) return null;
      const { data } = await supabase
        .from('conventions')
        .select('name')
        .eq('id', patient.convention_id)
        .single();
      return data;
    },
    enabled: !!patient.convention_id,
  });

  const calculateAge = (dob: string) => {
    const today = new Date();
    const birth = new Date(dob);
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
    return age;
  };

  const age = calculateAge(patient.date_of_birth);
  const genderLabel = patient.gender === 'F' ? 'Féminin' : 'Masculin';
  const companyName = company?.name || null;
  const conventionName = convention?.name || null;
  const employeeId = patient.employee_id || null;

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const photoHtml = patient.photo_url
      ? `<img src="${patient.photo_url}" style="width:100%;height:100%;object-fit:cover;" />`
      : `<div style="width:100%;height:100%;background:#e5c6c6;display:flex;align-items:center;justify-content:center;font-size:20px;font-weight:bold;color:#6b7280;">${patient.first_name[0]}${patient.last_name[0]}</div>`;

    const conventionHtml = companyName
      ? `<p class="convention"><strong>${companyName}</strong>${conventionName ? ` — ${conventionName}` : ''}${employeeId ? `<br/>Mat: ${employeeId}` : ''}</p>`
      : '';

    printWindow.document.write(`<!DOCTYPE html><html><head><title>Carte Patient</title>
      <style>
        @page { size: 85.6mm 54mm; margin: 0; }
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: system-ui, -apple-system, sans-serif; }
        .card {
          width: 85.6mm; height: 54mm;
          display: flex; flex-direction: column;
          background: white; overflow: hidden;
        }
        .header {
          background: ${HOSPITAL.color};
          color: white; padding: 2mm 3mm;
          display: flex; align-items: center; gap: 2mm;
          border-bottom: 0.8mm solid #c0392b;
        }
        .logo {
          width: 8mm; height: 8mm;
          background: #1a1a1a; border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0;
        }
        .logo svg { width: 5mm; height: 5mm; }
        .hospital-name { font-weight: 900; font-size: 11px; letter-spacing: 0.5px; }
        .hospital-addr { font-size: 7px; font-weight: 600; }
        .hospital-phone { font-size: 6px; opacity: 0.9; }
        .body {
          flex: 1; display: flex; padding: 2mm; gap: 2mm;
        }
        .photo {
          width: 18mm; height: 22mm; flex-shrink: 0;
          overflow: hidden; background: #e5c6c6;
        }
        .info {
          flex: 1; display: flex; flex-direction: column; justify-content: center; gap: 1mm;
          padding: 0 1mm;
        }
        .name { font-weight: 800; font-size: 10px; color: #1a1a1a; text-transform: uppercase; }
        .details { font-size: 8px; color: #444; }
        .convention { font-weight: 700; font-size: 8px; color: #1a1a1a; margin-top: 1mm; }
        .qr-section {
          width: 22mm; flex-shrink: 0;
          display: flex; flex-direction: column;
          align-items: center; justify-content: center; gap: 1mm;
        }
        .code { font-size: 6.5px; font-family: monospace; font-weight: 800; color: #1a1a1a; text-align: center; }
        .footer {
          font-size: 5px; color: #888; padding: 0.5mm 3mm 1mm;
          border-top: 0.3px solid #ddd;
          line-height: 1.3;
        }
      </style>
    </head><body>
      <div class="card">
        <div class="header">
          <div class="logo">
            <svg viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5"><path d="M12 5v14M5 12h14"/></svg>
          </div>
          <div>
            <p class="hospital-name">${HOSPITAL.name}</p>
            <p class="hospital-addr">${HOSPITAL.subtitle} — ${HOSPITAL.address}</p>
            <p class="hospital-phone">${HOSPITAL.phone}</p>
          </div>
        </div>
        <div class="body">
          <div class="photo">${photoHtml}</div>
          <div class="info">
            <p class="name">${patient.last_name} ${patient.first_name}</p>
            <p class="details">${age} ans — ${genderLabel} — ${patient.blood_type || 'N/R'}</p>
            ${conventionHtml}
          </div>
          <div class="qr-section">
            <div id="qr"></div>
            <p class="code">Code: ${patient.code}</p>
          </div>
        </div>
        <div class="footer">
          Carte d'identification patient — ${HOSPITAL.name} — En cas de perte, merci de retourner à l'accueil.
        </div>
      </div>
      <script src="https://cdn.jsdelivr.net/npm/qrcode@1.5.3/build/qrcode.min.js"><\/script>
      <script>
        QRCode.toCanvas(document.createElement('canvas'), '${patient.code}', { width: 90, margin: 0 }, function(err, canvas) {
          if (!err) document.getElementById('qr').appendChild(canvas);
          setTimeout(function() { window.print(); window.close(); }, 500);
        });
      <\/script>
    </body></html>`);
    printWindow.document.close();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Carte Patient PVC</DialogTitle>
          <DialogDescription>Prévisualisation de la carte à imprimer</DialogDescription>
        </DialogHeader>

        <div className="flex justify-center py-4">
          {/* Card preview - ratio 85.6:54 */}
          <div className="w-full max-w-[380px] rounded-xl border-2 border-dashed overflow-hidden bg-card" style={{ aspectRatio: '85.6/54' }}>
            
            {/* Header - Blue band with logo */}
            <div className="bg-[hsl(200,40%,62%)] text-white px-3 py-2 flex items-center gap-2 border-b-[3px] border-destructive">
              <div className="h-8 w-8 rounded-full bg-foreground flex items-center justify-center shrink-0">
                <Cross className="h-4 w-4 text-white" fill="white" />
              </div>
              <div className="min-w-0">
                <p className="font-black text-[12px] leading-tight tracking-wide">{HOSPITAL.name}</p>
                <p className="text-[8px] font-semibold leading-tight">{HOSPITAL.subtitle} — {HOSPITAL.address}</p>
                <p className="text-[7px] opacity-90 leading-tight">{HOSPITAL.phone}</p>
              </div>
            </div>

            {/* Body - Photo + Info + QR */}
            <div className="flex flex-1 px-2 py-1.5 gap-2" style={{ height: 'calc(100% - 52px)' }}>
              
              {/* Photo */}
              <div className="w-[72px] shrink-0 self-start">
                {patient.photo_url ? (
                  <img src={patient.photo_url} alt="" className="w-full h-[88px] object-cover" />
                ) : (
                  <div className="w-full h-[88px] bg-[hsl(0,30%,85%)] flex items-center justify-center">
                    <User className="h-8 w-8 text-muted-foreground" />
                  </div>
                )}
              </div>

              {/* Patient info */}
              <div className="flex-1 flex flex-col justify-center gap-0.5 min-w-0">
                <p className="font-extrabold text-[11px] leading-tight uppercase truncate">
                  {patient.last_name} {patient.first_name}
                </p>
                <p className="text-[9px] text-muted-foreground">
                  {age} ans — {genderLabel} — {patient.blood_type || 'N/R'}
                </p>
                {companyName && (
                  <p className="font-bold text-[9px] mt-1">
                    {companyName}
                    {conventionName && <span className="font-normal text-muted-foreground"> — {conventionName}</span>}
                  </p>
                )}
                {employeeId && (
                  <p className="text-[7px] text-muted-foreground">Mat: {employeeId}</p>
                )}
              </div>

              {/* QR Code */}
              <div className="flex flex-col items-center justify-center gap-0.5 shrink-0">
                <QRCodeSVG value={patient.code} size={70} level="H" />
                <p className="font-mono text-[7px] font-extrabold text-foreground">Code: {patient.code}</p>
              </div>
            </div>

            {/* Footer */}
            <div className="px-2 pb-1">
              <p className="text-[6px] text-muted-foreground border-t border-border pt-0.5 leading-snug">
                Carte d'identification patient — {HOSPITAL.name} — En cas de perte, merci de retourner à l'accueil.
              </p>
            </div>
          </div>
        </div>

        <div className="flex gap-2 justify-end">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Fermer</Button>
          <Button onClick={handlePrint} className="gap-1.5">
            <Printer className="h-4 w-4" />Imprimer
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
