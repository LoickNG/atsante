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

interface PrintResultItem {
  title: string;
  subtitle?: string;
  date: string;
  content: string;
  validatedBy?: string;
}

interface PrintMultiResultOptions {
  clinic: ClinicSettings | undefined;
  patientName: string;
  patientCode: string;
  documentTitle: string;
  items: PrintResultItem[];
}

export function buildClinicHeader(clinic: ClinicSettings | undefined) {
  const clinicName = clinic?.name || 'Ma Clinique';
  const clinicSlogan = clinic?.slogan || '';
  const clinicAddress = [clinic?.address, clinic?.city, clinic?.country].filter(Boolean).join(', ');
  const clinicPhone = [clinic?.phone, clinic?.phone2].filter(Boolean).join(' / ');
  const clinicEmail = clinic?.email || '';
  const clinicWebsite = (clinic as any)?.website || '';
  const clinicColor = clinic?.primary_color || '#1e40af';
  // Cache-buster sur le logo : empêche les anciennes versions stockées
  // par le Service Worker PWA d'apparaître dans les impressions.
  const logoSrc = clinic?.logo_url
    ? `${clinic.logo_url}${clinic.logo_url.includes('?') ? '&' : '?'}t=${Date.now()}`
    : '';
  const logoHtml = logoSrc
    ? `<img src="${logoSrc}" style="height:48px;object-fit:contain;" crossorigin="anonymous" />`
    : '';
  return { clinicName, clinicSlogan, clinicAddress, clinicPhone, clinicEmail, clinicWebsite, clinicColor, logoHtml };
}

/**
 * Bloc <meta> à insérer dans le <head> de chaque document imprimé pour
 * garantir que le navigateur (et le Service Worker PWA) n'utilisent jamais
 * une version mise en cache du HTML d'impression.
 */
export const NO_CACHE_META = `
<meta http-equiv="Cache-Control" content="no-cache, no-store, must-revalidate" />
<meta http-equiv="Pragma" content="no-cache" />
<meta http-equiv="Expires" content="0" />
<meta name="generated-at" content="${Date.now()}" />`;

/**
 * Reusable HTML <header> block for any printed clinic document.
 * Use the same look across prescriptions, lab/imaging results, certificates, etc.
 */
export function buildClinicHeaderHtml(clinic: ClinicSettings | undefined): string {
  const h = buildClinicHeader(clinic);
  return `
  <div style="display:flex;align-items:center;gap:16px;border-bottom:3px solid ${h.clinicColor};padding-bottom:12px;margin-bottom:20px;">
    ${h.logoHtml}
    <div style="flex:1;">
      <h1 style="font-size:20px;color:${h.clinicColor};margin:0 0 2px 0;">${h.clinicName}</h1>
      ${h.clinicSlogan ? `<div style="font-size:10px;color:#666;font-style:italic;">${h.clinicSlogan}</div>` : ''}
      <div style="font-size:9px;color:#888;margin-top:4px;line-height:1.4;">
        ${h.clinicAddress ? h.clinicAddress + '<br/>' : ''}
        ${h.clinicPhone ? 'Tél: ' + h.clinicPhone : ''}${h.clinicEmail ? ' | ' + h.clinicEmail : ''}${h.clinicWebsite ? ' | ' + h.clinicWebsite : ''}
      </div>
    </div>
  </div>`;
}

export function buildClinicFooterHtml(clinic: ClinicSettings | undefined): string {
  const h = buildClinicHeader(clinic);
  const today = new Date().toLocaleDateString('fr-FR');
  return `
  <div style="margin-top:40px;border-top:1px solid #e2e8f0;padding-top:10px;text-align:center;font-size:8px;color:#aaa;">
    ${h.clinicName}${h.clinicAddress ? ' — ' + h.clinicAddress : ''}${h.clinicPhone ? ' — Tél: ' + h.clinicPhone : ''} — Imprimé le ${today}
  </div>`;
}

function buildStyles(clinicColor: string) {
  return `
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
  .result-item {
    margin-bottom: 24px; page-break-inside: avoid;
  }
  .result-item-header {
    display: flex; justify-content: space-between; align-items: center;
    padding: 8px 12px; background: ${clinicColor}11; border-radius: 6px 6px 0 0;
    border: 1px solid #e2e8f0; border-bottom: none;
  }
  .result-item-header h3 { font-size: 13px; font-weight: 600; color: ${clinicColor}; }
  .result-item-header .date { font-size: 10px; color: #888; }
  .result-item-body {
    padding: 16px; border: 1px solid #e2e8f0; border-radius: 0 0 6px 6px;
    white-space: pre-wrap; line-height: 1.7; font-size: 12px;
  }
  .validation { font-size: 10px; color: #666; text-align: right; margin-top: 10px; }
  .footer {
    margin-top: 40px; border-top: 1px solid #e2e8f0; padding-top: 10px;
    text-align: center; font-size: 8px; color: #aaa;
  }
  .separator { border: none; border-top: 1px dashed #d1d5db; margin: 16px 0; }
  @media print { body { padding: 10mm; } }
`;
}

function buildHeaderHtml(h: ReturnType<typeof buildClinicHeader>) {
  return `
  <div class="header">
    ${h.logoHtml}
    <div class="header-info">
      <h1>${h.clinicName}</h1>
      ${h.clinicSlogan ? `<div class="slogan">${h.clinicSlogan}</div>` : ''}
      <div class="contact">
        ${h.clinicAddress ? h.clinicAddress + '<br/>' : ''}
        ${h.clinicPhone ? 'Tél: ' + h.clinicPhone : ''}
        ${h.clinicEmail ? ' | ' + h.clinicEmail : ''}
      </div>
    </div>
  </div>`;
}

function buildFooterHtml(h: ReturnType<typeof buildClinicHeader>) {
  return `
  <div class="footer">
    ${h.clinicName} — ${h.clinicAddress || ''} ${h.clinicPhone ? '— Tél: ' + h.clinicPhone : ''}
  </div>`;
}

function openPrintWindow(html: string) {
  const printWindow = window.open('', '_blank');
  if (!printWindow) return;
  printWindow.document.write(html);
  printWindow.document.close();
}

export function printResultDocument(opts: PrintResultOptions) {
  const h = buildClinicHeader(opts.clinic);

  const html = `<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8">${NO_CACHE_META}<title>${opts.title}</title>
<style>${buildStyles(h.clinicColor)}</style>
</head>
<body>
  ${buildHeaderHtml(h)}
  <div class="doc-title">
    <h2>${opts.title}</h2>
    ${opts.subtitle ? `<div class="sub">${opts.subtitle}</div>` : ''}
  </div>
  <div class="patient-box">
    <div><div class="name">${opts.patientName}</div><div class="detail">Code: ${opts.patientCode}</div></div>
    <div style="text-align:right"><div class="detail">Date: ${opts.date}</div></div>
  </div>
  <div class="results">${opts.content}</div>
  ${opts.validatedBy ? `<div class="validation">Validé par: ${opts.validatedBy}</div>` : ''}
  ${buildFooterHtml(h)}
  <script>setTimeout(function() { window.print(); window.close(); }, 300);<\/script>
</body></html>`;

  openPrintWindow(html);
}

export function printMultiResultDocument(opts: PrintMultiResultOptions) {
  const h = buildClinicHeader(opts.clinic);

  const itemsHtml = opts.items.map((item, i) => `
    ${i > 0 ? '<hr class="separator" />' : ''}
    <div class="result-item">
      <div class="result-item-header">
        <h3>${item.title}${item.subtitle ? ` — ${item.subtitle}` : ''}</h3>
        <span class="date">${item.date}</span>
      </div>
      <div class="result-item-body">${item.content || 'Aucun résultat'}</div>
      ${item.validatedBy ? `<div class="validation">Validé par: ${item.validatedBy}</div>` : ''}
    </div>
  `).join('');

  const html = `<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8">${NO_CACHE_META}<title>${opts.documentTitle}</title>
<style>${buildStyles(h.clinicColor)}</style>
</head>
<body>
  ${buildHeaderHtml(h)}
  <div class="doc-title">
    <h2>${opts.documentTitle}</h2>
    <div class="sub">${opts.items.length} examen(s)</div>
  </div>
  <div class="patient-box">
    <div><div class="name">${opts.patientName}</div><div class="detail">Code: ${opts.patientCode}</div></div>
    <div style="text-align:right"><div class="detail">${opts.items.length} résultat(s)</div></div>
  </div>
  ${itemsHtml}
  ${buildFooterHtml(h)}
  <script>setTimeout(function() { window.print(); window.close(); }, 300);<\/script>
</body></html>`;

  openPrintWindow(html);
}
