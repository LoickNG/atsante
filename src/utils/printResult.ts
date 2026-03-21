import { ClinicSettings } from '@/hooks/useClinicSettings';

interface PrintResultOptions {
  clinic: ClinicSettings | undefined;
  patientName: string;
  patientCode: string;
  title: string;
  subtitle?: string;
  date: string;
  content: string;
  validatedBy?: string;
}

export function printResultDocument(opts: PrintResultOptions) {
  const {
    clinic,
    patientName,
    patientCode,
    title,
    subtitle,
    date,
    content,
    validatedBy,
  } = opts;

  const clinicName = clinic?.name || 'Ma Clinique';
  const clinicSlogan = clinic?.slogan || '';
  const clinicAddress = [clinic?.address, clinic?.city, clinic?.country].filter(Boolean).join(', ');
  const clinicPhone = [clinic?.phone, clinic?.phone2].filter(Boolean).join(' / ');
  const clinicEmail = clinic?.email || '';
  const clinicColor = clinic?.primary_color || '#1e40af';
  const logoHtml = clinic?.logo_url
    ? `<img src="${clinic.logo_url}" style="height:40px;object-fit:contain;" />`
    : '';

  const printWindow = window.open('', '_blank');
  if (!printWindow) return;

  printWindow.document.write(`<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<title>${title}</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Segoe UI', Tahoma, sans-serif; font-size: 12px; color: #1a1a1a; padding: 15mm; }
  .header {
    display: flex; align-items: center; gap: 16px;
    border-bottom: 3px solid ${clinicColor}; padding-bottom: 12px; margin-bottom: 20px;
  }
  .header-info h1 { font-size: 20px; color: ${clinicColor}; margin-bottom: 2px; }
  .header-info .slogan { font-size: 10px; color: #666; font-style: italic; }
  .header-info .contact { font-size: 9px; color: #888; margin-top: 4px; }
  .doc-title {
    text-align: center; margin-bottom: 20px; padding: 10px;
    background: ${clinicColor}11; border-radius: 6px;
  }
  .doc-title h2 { font-size: 16px; color: ${clinicColor}; text-transform: uppercase; letter-spacing: 1px; }
  .doc-title .sub { font-size: 11px; color: #666; margin-top: 4px; }
  .patient-box {
    display: flex; justify-content: space-between;
    background: #f8fafc; padding: 12px; border-radius: 6px;
    margin-bottom: 20px; border: 1px solid #e2e8f0;
  }
  .patient-box .name { font-size: 14px; font-weight: bold; }
  .patient-box .detail { font-size: 11px; color: #555; margin-top: 2px; }
  .results {
    padding: 16px; border: 1px solid #e2e8f0; border-radius: 6px;
    margin-bottom: 20px; white-space: pre-wrap; line-height: 1.7; font-size: 12px;
  }
  .validation { font-size: 10px; color: #666; text-align: right; margin-top: 10px; }
  .footer {
    margin-top: 40px; border-top: 1px solid #e2e8f0; padding-top: 10px;
    text-align: center; font-size: 8px; color: #aaa;
  }
  @media print { body { padding: 10mm; } }
</style>
</head>
<body>
  <div class="header">
    ${logoHtml}
    <div class="header-info">
      <h1>${clinicName}</h1>
      ${clinicSlogan ? `<div class="slogan">${clinicSlogan}</div>` : ''}
      <div class="contact">
        ${clinicAddress ? clinicAddress + '<br/>' : ''}
        ${clinicPhone ? 'Tél: ' + clinicPhone : ''}
        ${clinicEmail ? ' | ' + clinicEmail : ''}
      </div>
    </div>
  </div>

  <div class="doc-title">
    <h2>${title}</h2>
    ${subtitle ? `<div class="sub">${subtitle}</div>` : ''}
  </div>

  <div class="patient-box">
    <div>
      <div class="name">${patientName}</div>
      <div class="detail">Code: ${patientCode}</div>
    </div>
    <div style="text-align:right">
      <div class="detail">Date: ${date}</div>
    </div>
  </div>

  <div class="results">${content}</div>

  ${validatedBy ? `<div class="validation">Validé par: ${validatedBy}</div>` : ''}

  <div class="footer">
    ${clinicName} — ${clinicAddress || ''} ${clinicPhone ? '— Tél: ' + clinicPhone : ''}
  </div>

  <script>setTimeout(function() { window.print(); window.close(); }, 300);<\/script>
</body>
</html>`);
  printWindow.document.close();
}
