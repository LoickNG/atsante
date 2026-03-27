import { Button } from '@/components/ui/button';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog';
import { QRCodeSVG } from 'qrcode.react';
import { Printer, User, Phone, MapPin, Building2, Shield } from 'lucide-react';
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
    color: clinicSettings?.primary_color || '#2a9d8f',
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
  const genderShort = patient.gender === 'F' ? 'F' : 'M';
  const companyName = company?.name || null;
  const conventionName = convention?.name || null;
  const employeeId = patient.employee_id || null;

  // Lighter version of the primary color for accents
  const colorToRgba = (hex: string, alpha: number) => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r},${g},${b},${alpha})`;
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const photoHtml = patient.photo_url
      ? `<img src="${patient.photo_url}" style="width:100%;height:100%;object-fit:cover;" />`
      : `<div style="width:100%;height:100%;background:linear-gradient(135deg, #e0e7ee, #c5d5e0);display:flex;align-items:center;justify-content:center;font-size:22px;font-weight:900;color:#64748b;letter-spacing:1px;">${patient.first_name[0]}${patient.last_name[0]}</div>`;

    const conventionHtml = companyName
      ? `<div class="convention-badge"><span class="conv-icon">🏢</span><span><strong>${companyName}</strong>${conventionName ? ` · ${conventionName}` : ''}${employeeId ? ` · Mat: ${employeeId}` : ''}</span></div>`
      : '';

    printWindow.document.write(`<!DOCTYPE html><html><head><title>Carte Patient</title>
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
        @page { size: 85.6mm 54mm; margin: 0; }
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Inter', system-ui, sans-serif; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        .card {
          width: 85.6mm; height: 54mm;
          display: flex; flex-direction: column;
          background: white; overflow: hidden;
          position: relative;
        }
        .card::before {
          content: ''; position: absolute; top: 0; left: 0; right: 0; bottom: 0;
          background: url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='0.015'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E") repeat;
          opacity: 0.5; z-index: 0; pointer-events: none;
        }
        .header {
          background: linear-gradient(135deg, ${HOSPITAL.color}, ${HOSPITAL.color}dd);
          color: white; padding: 2.5mm 3mm 2mm;
          display: flex; align-items: center; gap: 2mm;
          position: relative; z-index: 1;
        }
        .header::after {
          content: ''; position: absolute; bottom: -2mm; left: 0; right: 0;
          height: 4mm;
          background: linear-gradient(to bottom, ${colorToRgba(HOSPITAL.color, 0.15)}, transparent);
        }
        .logo {
          width: 9mm; height: 9mm; border-radius: 2mm;
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0; overflow: hidden;
          background: rgba(255,255,255,0.2); backdrop-filter: blur(4px);
        }
        .logo img { width: 100%; height: 100%; object-fit: contain; }
        .logo svg { width: 5mm; height: 5mm; }
        .hospital-name { font-weight: 900; font-size: 11px; letter-spacing: 0.3px; line-height: 1.2; }
        .hospital-addr { font-size: 6.5px; font-weight: 500; opacity: 0.92; margin-top: 0.5mm; }
        .hospital-phone { font-size: 6px; opacity: 0.8; margin-top: 0.3mm; }
        .body {
          flex: 1; display: flex; padding: 2.5mm 3mm 1.5mm; gap: 2.5mm;
          position: relative; z-index: 1;
        }
        .photo {
          width: 19mm; height: 24mm; flex-shrink: 0;
          overflow: hidden; border-radius: 1.5mm;
          border: 0.4mm solid #e2e8f0;
          box-shadow: 0 1px 3px rgba(0,0,0,0.08);
        }
        .info {
          flex: 1; display: flex; flex-direction: column; justify-content: flex-start; gap: 0.8mm;
          padding: 0.5mm 0;
        }
        .name { font-weight: 900; font-size: 10.5px; color: #0f172a; text-transform: uppercase; letter-spacing: 0.3px; line-height: 1.3; }
        .info-row { display: flex; align-items: center; gap: 1mm; }
        .info-pill {
          display: inline-flex; align-items: center; gap: 0.5mm;
          background: #f1f5f9; border-radius: 1mm; padding: 0.5mm 1.5mm;
          font-size: 7px; color: #475569; font-weight: 600;
        }
        .info-pill.gender-f { background: #fce7f3; color: #9d174d; }
        .info-pill.gender-m { background: #dbeafe; color: #1e40af; }
        .info-pill.blood { background: #fee2e2; color: #991b1b; font-weight: 800; }
        .convention-badge {
          display: flex; align-items: center; gap: 1mm;
          background: linear-gradient(90deg, ${colorToRgba(HOSPITAL.color, 0.08)}, transparent);
          border-left: 0.5mm solid ${HOSPITAL.color};
          border-radius: 0 1mm 1mm 0;
          padding: 0.8mm 1.5mm;
          font-size: 6.5px; color: #334155;
          margin-top: 0.5mm;
        }
        .conv-icon { font-size: 7px; }
        .qr-section {
          width: 22mm; flex-shrink: 0;
          display: flex; flex-direction: column;
          align-items: center; justify-content: center; gap: 0.8mm;
          background: #f8fafc;
          border-radius: 1.5mm;
          padding: 1mm;
          border: 0.3mm solid #e2e8f0;
        }
        .code {
          font-size: 6px; font-family: 'Courier New', monospace;
          font-weight: 800; color: ${HOSPITAL.color};
          text-align: center; letter-spacing: 0.3px;
          background: white; padding: 0.3mm 1mm;
          border-radius: 0.5mm; border: 0.2mm solid #e2e8f0;
        }
        .footer {
          font-size: 5px; color: #94a3b8; padding: 0.8mm 3mm 1.2mm;
          position: relative; z-index: 1;
          display: flex; justify-content: space-between; align-items: center;
          border-top: 0.3mm solid #f1f5f9;
        }
        .footer-left { flex: 1; }
        .footer-brand { font-weight: 700; color: ${HOSPITAL.color}; opacity: 0.6; font-size: 5px; }
      </style>
    </head><body>
      <div class="card">
        <div class="header">
          <div class="logo">
            ${HOSPITAL.logo_url ? `<img src="${HOSPITAL.logo_url}" />` : `<svg viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5"><path d="M12 5v14M5 12h14"/></svg>`}
          </div>
          <div>
            <p class="hospital-name">${HOSPITAL.name}</p>
            <p class="hospital-addr">${HOSPITAL.subtitle}${HOSPITAL.subtitle && HOSPITAL.address ? ' · ' : ''}${HOSPITAL.address}</p>
            <p class="hospital-phone">${HOSPITAL.phone}</p>
          </div>
        </div>
        <div class="body">
          <div class="photo">${photoHtml}</div>
          <div class="info">
            <p class="name">${patient.last_name} ${patient.first_name}</p>
            <div class="info-row">
              <span class="info-pill">${age} ans</span>
              <span class="info-pill gender-${patient.gender === 'F' ? 'f' : 'm'}">${genderShort}</span>
              ${patient.blood_type ? `<span class="info-pill blood">${patient.blood_type}</span>` : ''}
            </div>
            ${conventionHtml}
          </div>
          <div class="qr-section">
            <div id="qr"></div>
            <p class="code">${patient.code}</p>
          </div>
        </div>
        <div class="footer">
          <span class="footer-left">Carte d'identification patient · En cas de perte, retourner à l'accueil</span>
          <span class="footer-brand">${HOSPITAL.name}</span>
        </div>
      </div>
      <script src="https://cdn.jsdelivr.net/npm/qrcode@1.5.3/build/qrcode.min.js"><\/script>
      <script>
        QRCode.toCanvas(document.createElement('canvas'), '${patient.code}', { width: 88, margin: 0, color: { dark: '#0f172a' } }, function(err, canvas) {
          if (!err) document.getElementById('qr').appendChild(canvas);
          setTimeout(function() { window.print(); window.close(); }, 500);
        });
      <\/script>
    </body></html>`);
    printWindow.document.close();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            Carte Patient PVC
          </DialogTitle>
          <DialogDescription>Prévisualisation haute fidélité de la carte à imprimer</DialogDescription>
        </DialogHeader>

        <div className="flex justify-center py-6">
          {/* Card preview with shadow and 3D effect */}
          <div
            className="w-full max-w-[420px] rounded-2xl overflow-hidden relative"
            style={{
              aspectRatio: '85.6/54',
              boxShadow: `0 20px 60px -12px ${colorToRgba(HOSPITAL.color, 0.25)}, 0 8px 20px -8px rgba(0,0,0,0.12)`,
            }}
          >
            {/* Subtle pattern background */}
            <div className="absolute inset-0 opacity-[0.03]" style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23000' fill-opacity='1'%3E%3Cpath d='M20 18v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4z'/%3E%3C/g%3E%3C/svg%3E")`,
            }} />

            {/* Header - Gradient band */}
            <div
              className="text-white px-4 py-2.5 flex items-center gap-2.5 relative"
              style={{
                background: `linear-gradient(135deg, ${HOSPITAL.color}, ${HOSPITAL.color}dd)`,
              }}
            >
              {/* Decorative glow */}
              <div className="absolute -bottom-3 left-0 right-0 h-6" style={{
                background: `linear-gradient(to bottom, ${colorToRgba(HOSPITAL.color, 0.12)}, transparent)`
              }} />

              {HOSPITAL.logo_url ? (
                <div className="h-10 w-10 rounded-lg overflow-hidden shrink-0 bg-white/20 backdrop-blur-sm flex items-center justify-center">
                  <img src={HOSPITAL.logo_url} alt="" className="h-full w-full object-contain" />
                </div>
              ) : (
                <div className="h-10 w-10 rounded-lg bg-white/20 backdrop-blur-sm flex items-center justify-center shrink-0">
                  <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" className="h-5 w-5">
                    <path d="M12 5v14M5 12h14" />
                  </svg>
                </div>
              )}
              <div className="min-w-0 relative z-10">
                <p className="font-black text-[13px] leading-tight tracking-wide drop-shadow-sm">{HOSPITAL.name}</p>
                <p className="text-[7.5px] font-medium leading-tight mt-0.5 opacity-95">
                  {HOSPITAL.subtitle}{HOSPITAL.subtitle && HOSPITAL.address ? ' · ' : ''}{HOSPITAL.address}
                </p>
                {HOSPITAL.phone && (
                  <p className="text-[6.5px] opacity-80 leading-tight mt-0.5 flex items-center gap-0.5">
                    <Phone className="h-[7px] w-[7px] inline" />
                    {HOSPITAL.phone}
                  </p>
                )}
              </div>
            </div>

            {/* Body */}
            <div className="flex flex-1 px-3 py-2 gap-3 bg-card relative" style={{ height: 'calc(100% - 56px)' }}>
              
              {/* Left: Photo + Name underneath */}
              <div className="shrink-0 flex flex-col items-center gap-1">
                <div className="w-[110px]">
                  {patient.photo_url ? (
                    <img
                      src={patient.photo_url}
                      alt=""
                      className="w-full h-[120px] object-cover rounded-lg border border-border"
                      style={{ boxShadow: '0 2px 8px -2px rgba(0,0,0,0.1)' }}
                    />
                  ) : (
                    <div
                      className="w-full h-[120px] rounded-lg border border-border flex items-center justify-center"
                      style={{ background: 'linear-gradient(135deg, hsl(210 20% 92%), hsl(210 20% 86%))' }}
                    >
                      <User className="h-12 w-12 text-muted-foreground/60" />
                    </div>
                  )}
                </div>
                {/* Name + details under photo */}
                <div className="w-[130px] text-center">
                  <p className="font-black text-[13px] leading-tight uppercase tracking-wide text-foreground whitespace-nowrap">
                    {patient.last_name} {patient.first_name}
                  </p>
                  <div className="flex items-center justify-center gap-1 flex-wrap mt-1">
                    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[7px] font-semibold bg-muted text-muted-foreground">
                      {age} ans
                    </span>
                    <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[7px] font-bold ${
                      patient.gender === 'F'
                        ? 'bg-[hsl(330,80%,95%)] text-[hsl(330,60%,35%)]'
                        : 'bg-[hsl(210,80%,95%)] text-[hsl(210,60%,35%)]'
                    }`}>
                      {genderShort}
                    </span>
                    {patient.blood_type && (
                      <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[7px] font-extrabold bg-destructive/10 text-destructive">
                        {patient.blood_type}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Middle: Convention info */}
              <div className="flex-1 flex flex-col justify-center gap-1 min-w-0">
                {companyName && (
                  <div
                    className="flex items-center gap-1 rounded-r px-1.5 py-0.5 text-[8px] text-muted-foreground"
                    style={{
                      background: `linear-gradient(90deg, ${colorToRgba(HOSPITAL.color, 0.08)}, transparent)`,
                      borderLeft: `2px solid ${HOSPITAL.color}`,
                    }}
                  >
                    <Building2 className="h-[9px] w-[9px] shrink-0" style={{ color: HOSPITAL.color }} />
                    <span className="font-bold text-foreground">{companyName}</span>
                    {conventionName && <span>· {conventionName}</span>}
                    {employeeId && <span>· Mat: {employeeId}</span>}
                  </div>
                )}
              </div>

              {/* QR Code Section */}
              <div className="flex flex-col items-center justify-center gap-1.5 shrink-0 rounded-xl p-2.5 bg-muted/50 border border-border/50">
                <div className="bg-card rounded-lg p-2">
                  <QRCodeSVG value={patient.code} size={96} level="H" fgColor="#0f172a" />
                </div>
                <div
                  className="px-2.5 py-1 rounded font-mono text-[10px] font-extrabold tracking-widest border border-border/60 bg-card"
                  style={{ color: HOSPITAL.color }}
                >
                  {patient.code}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="absolute bottom-0 left-0 right-0 px-3 py-1 flex items-center justify-between border-t border-border/50 bg-card/80 backdrop-blur-sm">
              <p className="text-[5.5px] text-muted-foreground">
                Carte d'identification patient · En cas de perte, retourner à l'accueil
              </p>
              <p className="text-[5.5px] font-bold opacity-40" style={{ color: HOSPITAL.color }}>
                {HOSPITAL.name}
              </p>
            </div>
          </div>
        </div>

        <div className="flex gap-2 justify-end">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Fermer</Button>
          <Button onClick={handlePrint} className="gap-1.5" style={{ background: HOSPITAL.color }}>
            <Printer className="h-4 w-4" />Imprimer la carte
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
