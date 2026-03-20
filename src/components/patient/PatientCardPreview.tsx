import { Button } from '@/components/ui/button';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog';
import { QRCodeSVG } from 'qrcode.react';
import { Printer, User } from 'lucide-react';
import { Patient } from '@/hooks/usePatients';

interface PatientCardPreviewProps {
  patient: Patient | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PatientCardPreview({ patient, open, onOpenChange }: PatientCardPreviewProps) {
  if (!patient) return null;

  const calculateAge = (dob: string) => {
    const today = new Date();
    const birth = new Date(dob);
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
    return age;
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const photoHtml = (patient as any).photo_url
      ? `<img src="${(patient as any).photo_url}" style="width:20mm;height:20mm;border-radius:50%;object-fit:cover;border:1.5px solid #ccc;" />`
      : `<div style="width:20mm;height:20mm;border-radius:50%;background:#e5e7eb;display:flex;align-items:center;justify-content:center;font-size:16px;font-weight:bold;color:#6b7280;">${patient.first_name[0]}${patient.last_name[0]}</div>`;

    printWindow.document.write(`<!DOCTYPE html><html><head><title>Carte Patient</title>
      <style>
        @page { size: 85.6mm 54mm; margin: 0; }
        body { margin: 0; font-family: system-ui, sans-serif; }
        .card { width: 85.6mm; height: 54mm; padding: 4mm 5mm; box-sizing: border-box; display: flex; flex-direction: column; justify-content: space-between; }
        .top { display: flex; align-items: flex-start; justify-content: space-between; }
        .info { display: flex; align-items: center; gap: 3mm; }
        .name { font-weight: bold; font-size: 11px; margin: 0; }
        .meta { font-size: 9px; color: #6b7280; margin: 1mm 0 0 0; }
        .bottom { display: flex; justify-content: space-between; align-items: flex-end; }
        .brand { font-weight: bold; font-size: 12px; margin: 0; color: #0d9488; }
        .sub { font-size: 8px; color: #6b7280; margin: 0; }
        .code { font-size: 10px; font-family: monospace; font-weight: bold; margin: 0; }
      </style>
    </head><body>
      <div class="card">
        <div class="top">
          <div class="info">
            ${photoHtml}
            <div>
              <p class="name">${patient.first_name} ${patient.last_name}</p>
              <p class="meta">${calculateAge(patient.date_of_birth)} ans • ${patient.gender === 'F' ? 'F' : 'M'}${patient.blood_type ? ` • ${patient.blood_type}` : ''}</p>
            </div>
          </div>
          <div id="qr"></div>
        </div>
        <div class="bottom">
          <div><p class="brand">ATSanté</p><p class="sub">Centre Médical</p></div>
          <p class="code">${patient.code}</p>
        </div>
      </div>
      <script src="https://cdn.jsdelivr.net/npm/qrcode@1.5.3/build/qrcode.min.js"><\/script>
      <script>
        QRCode.toCanvas(document.createElement('canvas'), '${patient.code}', { width: 60, margin: 0 }, function(err, canvas) {
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
          <div className="w-full max-w-[320px] rounded-xl border-2 border-dashed p-4 bg-card" style={{ aspectRatio: '85.6/54' }}>
            <div className="flex items-start justify-between h-full flex-col">
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-3">
                  {(patient as any).photo_url ? (
                    <img src={(patient as any).photo_url} alt="" className="h-16 w-16 rounded-full object-cover border-2 border-muted" />
                  ) : (
                    <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center border-2 border-dashed border-muted-foreground/30">
                      <User className="h-6 w-6 text-muted-foreground" />
                    </div>
                  )}
                  <div>
                    <p className="font-bold text-sm">{patient.first_name} {patient.last_name}</p>
                    <p className="text-xs text-muted-foreground">
                      {calculateAge(patient.date_of_birth)} ans • {patient.gender === 'F' ? 'F' : 'M'}
                      {patient.blood_type && ` • ${patient.blood_type}`}
                    </p>
                  </div>
                </div>
                <QRCodeSVG value={patient.code} size={50} level="H" />
              </div>
              <div className="flex items-end justify-between w-full mt-auto">
                <div>
                  <p className="font-bold text-sm text-primary">ATSanté</p>
                  <p className="text-[10px] text-muted-foreground">Centre Médical</p>
                </div>
                <p className="font-mono text-xs font-bold">{patient.code}</p>
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
