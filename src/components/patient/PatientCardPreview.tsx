import { Button } from '@/components/ui/button';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog';
import { QRCodeSVG } from 'qrcode.react';
import { Printer, User, Hospital } from 'lucide-react';
import { Patient } from '@/hooks/usePatients';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface PatientCardPreviewProps {
  patient: Patient | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const HOSPITAL = {
  name: 'ATSanté',
  subtitle: 'Centre Médical Polyvalent',
  address: 'Lomé, Togo',
  phone: '+228 90 00 00 00',
};

export function PatientCardPreview({ patient, open, onOpenChange }: PatientCardPreviewProps) {
  if (!patient) return null;

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
      ? `<img src="${patient.photo_url}" style="width:18mm;height:18mm;border-radius:4px;object-fit:cover;border:1px solid #d1d5db;" />`
      : `<div style="width:18mm;height:18mm;border-radius:4px;background:#e5e7eb;display:flex;align-items:center;justify-content:center;font-size:14px;font-weight:bold;color:#6b7280;">${patient.first_name[0]}${patient.last_name[0]}</div>`;

    const companyHtml = companyName
      ? `<div class="company">
           <p class="company-label">Entreprise: <strong>${companyName}</strong></p>
           ${conventionName ? `<p class="company-label">Convention: ${conventionName}</p>` : ''}
           ${employeeId ? `<p class="company-label">Matricule: ${employeeId}</p>` : ''}
         </div>`
      : '';

    printWindow.document.write(`<!DOCTYPE html><html><head><title>Carte Patient</title>
      <style>
        @page { size: 85.6mm 54mm; margin: 0; }
        body { margin: 0; font-family: system-ui, -apple-system, sans-serif; }
        .card {
          width: 85.6mm; height: 54mm; box-sizing: border-box;
          display: flex; flex-direction: column;
          background: white; overflow: hidden;
        }
        .header {
          background: linear-gradient(135deg, #0d7377 0%, #14919b 100%);
          color: white; padding: 2mm 3mm; display: flex; align-items: center; gap: 2mm;
        }
        .header-icon { width: 6mm; height: 6mm; }
        .hospital-name { font-weight: 800; font-size: 10px; margin: 0; letter-spacing: 0.5px; }
        .hospital-sub { font-size: 6.5px; margin: 0; opacity: 0.9; }
        .hospital-addr { font-size: 5.5px; margin: 0; opacity: 0.75; }
        .body { display: flex; flex: 1; padding: 2mm 3mm 1.5mm; gap: 2mm; }
        .left { flex: 1; display: flex; flex-direction: column; justify-content: flex-start; gap: 1mm; }
        .right { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 1mm; }
        .patient-row { display: flex; align-items: center; gap: 2mm; }
        .name { font-weight: 700; font-size: 9px; margin: 0; color: #1a1a1a; }
        .detail { font-size: 7px; color: #4b5563; margin: 0; line-height: 1.4; }
        .detail strong { color: #1f2937; }
        .company { margin-top: 0.5mm; padding-top: 0.5mm; border-top: 0.3px solid #e5e7eb; }
        .company-label { font-size: 6.5px; color: #6b7280; margin: 0; line-height: 1.4; }
        .company-label strong { color: #1f2937; }
        .code { font-size: 8px; font-family: monospace; font-weight: 700; color: #0d7377; margin: 0; text-align: center; }
      </style>
    </head><body>
      <div class="card">
        <div class="header">
          <svg class="header-icon" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2"><path d="M3 21h18M9 8h1M9 12h1M9 16h1M14 8h1M14 12h1M14 16h1"/><rect x="5" y="2" width="14" height="19" rx="2"/></svg>
          <div>
            <p class="hospital-name">${HOSPITAL.name}</p>
            <p class="hospital-sub">${HOSPITAL.subtitle}</p>
            <p class="hospital-addr">${HOSPITAL.address} • ${HOSPITAL.phone}</p>
          </div>
        </div>
        <div class="body">
          <div class="left">
            <div class="patient-row">
              ${photoHtml}
              <div>
                <p class="name">${patient.last_name} ${patient.first_name}</p>
                <p class="detail">Sexe: <strong>${genderLabel}</strong> • Âge: <strong>${age} ans</strong></p>
                <p class="detail">Groupe: <strong>${patient.blood_type || 'N/R'}</strong></p>
              </div>
            </div>
            ${companyHtml}
          </div>
          <div class="right">
            <div id="qr"></div>
            <p class="code">${patient.code}</p>
          </div>
        </div>
      </div>
      <script src="https://cdn.jsdelivr.net/npm/qrcode@1.5.3/build/qrcode.min.js"><\/script>
      <script>
        QRCode.toCanvas(document.createElement('canvas'), '${patient.code}', { width: 80, margin: 0 }, function(err, canvas) {
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
          <div className="w-full max-w-[340px] rounded-xl border-2 border-dashed overflow-hidden bg-card" style={{ aspectRatio: '85.6/54' }}>
            {/* Header - Hospital */}
            <div className="bg-primary text-primary-foreground px-3 py-1.5 flex items-center gap-2">
              <Hospital className="h-4 w-4 shrink-0" />
              <div className="min-w-0">
                <p className="font-extrabold text-[11px] leading-tight tracking-wide">{HOSPITAL.name}</p>
                <p className="text-[7px] opacity-90 leading-tight">{HOSPITAL.subtitle}</p>
                <p className="text-[6px] opacity-75 leading-tight">{HOSPITAL.address} • {HOSPITAL.phone}</p>
              </div>
            </div>

            {/* Body */}
            <div className="flex flex-1 px-3 py-1.5 gap-2" style={{ height: 'calc(100% - 36px)' }}>
              {/* Left - Patient info */}
              <div className="flex-1 flex flex-col gap-0.5">
                <div className="flex items-center gap-2">
                  {patient.photo_url ? (
                    <img src={patient.photo_url} alt="" className="h-[46px] w-[46px] rounded object-cover border border-border shrink-0" />
                  ) : (
                    <div className="h-[46px] w-[46px] rounded bg-muted flex items-center justify-center border border-dashed border-muted-foreground/30 shrink-0">
                      <User className="h-5 w-5 text-muted-foreground" />
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="font-bold text-[10px] leading-tight truncate">{patient.last_name} {patient.first_name}</p>
                    <p className="text-[8px] text-muted-foreground leading-snug">
                      Sexe: <span className="font-medium text-foreground">{genderLabel}</span> • Âge: <span className="font-medium text-foreground">{age} ans</span>
                    </p>
                    <p className="text-[8px] text-muted-foreground leading-snug">
                      Groupe: <span className="font-medium text-foreground">{patient.blood_type || 'N/R'}</span>
                    </p>
                  </div>
                </div>

                {companyName && (
                  <div className="border-t border-border/50 pt-0.5 mt-auto">
                    <p className="text-[7px] text-muted-foreground leading-snug">
                      Entreprise: <span className="font-semibold text-foreground">{companyName}</span>
                    </p>
                    {conventionName && (
                      <p className="text-[7px] text-muted-foreground leading-snug">Convention: {conventionName}</p>
                    )}
                    {employeeId && (
                      <p className="text-[7px] text-muted-foreground leading-snug">Matricule: {employeeId}</p>
                    )}
                  </div>
                )}
              </div>

              {/* Right - QR Code */}
              <div className="flex flex-col items-center justify-center gap-0.5 shrink-0">
                <QRCodeSVG value={patient.code} size={60} level="H" />
                <p className="font-mono text-[9px] font-bold text-primary">{patient.code}</p>
              </div>
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
