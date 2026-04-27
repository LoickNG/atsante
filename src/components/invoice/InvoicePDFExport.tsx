import { Button } from '@/components/ui/button';
import { Printer } from 'lucide-react';
import { type InvoiceWithDetails } from '@/hooks/useBilling';
import { useClinicSettings } from '@/hooks/useClinicSettings';

interface InvoicePDFExportProps {
  invoice: InvoiceWithDetails;
}

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('fr-FR', { style: 'decimal', minimumFractionDigits: 0 }).format(amount) + ' FCFA';

const formatDate = (d: string) =>
  new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' });

export function InvoicePDFExport({ invoice }: InvoicePDFExportProps) {
  const { data: clinic } = useClinicSettings();
  const clinicName = clinic?.name || 'Ma Clinique';
  const clinicSubtitle = [clinic?.slogan, clinic?.city].filter(Boolean).join(' — ') || 'Clinique Médicale';
  const clinicPhone = clinic?.phone || '';
  const clinicAddress = [clinic?.address, clinic?.city, clinic?.country].filter(Boolean).join(', ');
  const clinicEmail = clinic?.email || '';
  const clinicColor = clinic?.primary_color || '#2563eb';
  const logoHtml = clinic?.logo_url ? `<img src="${clinic.logo_url}" style="height:40px;object-fit:contain;margin-right:10px;" />` : '';

  const handlePrint = () => {
    const patient = invoice.patient;
    const isProforma = (invoice as any).is_proforma;
    const discountPct = Number((invoice as any).discount_percent || 0);
    const discountAmt = Number((invoice as any).discount_amount || 0);
    const total = Number(invoice.total_amount);
    const paid = Number(invoice.paid_amount);
    const reste = total - paid;
    const companyAmt = Number(invoice.company_amount);
    const insuranceAmt = Number(invoice.insurance_amount);
    const patientAmt = Number(invoice.patient_amount);

    const itemRows = (invoice.items || []).map((item, idx) => `
      <tr>
        <td style="text-align:center">${idx + 1}</td>
        <td>${item.description}</td>
        <td style="text-align:center">${item.quantity}</td>
        <td style="text-align:right">${formatCurrency(Number(item.unit_price))}</td>
        <td style="text-align:right">${formatCurrency(Number(item.total_price))}</td>
      </tr>
    `).join('');

    const paymentRows = (invoice.payments || []).map(p => `
      <tr>
        <td>${new Date(p.created_at).toLocaleDateString('fr-FR')}</td>
        <td>${p.method}</td>
        <td>${p.reference || '—'}</td>
        <td style="text-align:right">${formatCurrency(Number(p.amount))}</td>
      </tr>
    `).join('');

    const html = `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<title>${isProforma ? 'PRO FORMA' : 'Facture'} ${invoice.invoice_number}</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Segoe UI', Tahoma, sans-serif; font-size: 12px; color: #1a1a1a; padding: 15mm; }
  .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 3px solid ${clinicColor}; padding-bottom: 15px; margin-bottom: 25px; }
  .header h1 { font-size: 22px; color: ${clinicColor}; }
  .header .subtitle { font-size: 10px; color: #666; }
  .invoice-info { text-align: right; }
  .invoice-info .inv-num { font-size: 16px; font-weight: bold; color: ${clinicColor}; }
  .invoice-info .inv-date { font-size: 11px; color: #666; }
  .patient-box { background: #f0f4ff; padding: 14px; border-radius: 6px; margin-bottom: 20px; }
  .patient-box .name { font-size: 15px; font-weight: bold; margin-bottom: 4px; }
  .patient-box .detail { font-size: 11px; color: #555; }
  table { width: 100%; border-collapse: collapse; margin-bottom: 18px; }
  th { background: #f1f5f9; font-weight: 600; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; }
  th, td { padding: 8px 10px; border: 1px solid #e2e8f0; text-align: left; }
  .totals { margin-left: auto; width: 280px; }
  .totals td { border: none; padding: 4px 10px; }
  .totals .total-row td { font-size: 14px; font-weight: bold; border-top: 2px solid ${clinicColor}; padding-top: 8px; }
  .totals .paid td { color: #16a34a; }
  .totals .reste td { color: #ea580c; font-weight: bold; }
  .convention-box { background: #fefce8; border: 1px solid #fde68a; padding: 12px; border-radius: 6px; margin-bottom: 18px; }
  .convention-box .title { font-weight: 600; margin-bottom: 6px; }
  .convention-row { display: flex; justify-content: space-between; font-size: 11px; padding: 2px 0; }
  .status-badge { display: inline-block; padding: 3px 10px; border-radius: 4px; font-size: 10px; font-weight: 600; }
  .status-paye { background: #d1fae5; color: #065f46; }
  .status-partiel { background: #dbeafe; color: #1e40af; }
  .status-en_attente { background: #fef3c7; color: #92400e; }
  .footer { margin-top: 40px; border-top: 1px solid #e2e8f0; padding-top: 12px; text-align: center; font-size: 9px; color: #999; }
  @media print { body { padding: 10mm; } }
</style>
</head>
<body>
  <div class="header">
    <div style="display:flex;align-items:center">
      ${logoHtml}
      <div>
        <h1>${clinicName}</h1>
        <div class="subtitle">${clinicSubtitle} — ${isProforma ? 'PRO FORMA' : 'Facture'}</div>
        ${clinicAddress ? `<div class="subtitle">${clinicAddress}</div>` : ''}
        ${clinicPhone ? `<div class="subtitle">Tél: ${clinicPhone}${clinicEmail ? ' — ' + clinicEmail : ''}</div>` : ''}
      </div>
    </div>
    <div class="invoice-info">
      <div class="inv-num">${invoice.invoice_number}</div>
      <div class="inv-date">Date : ${formatDate(invoice.created_at)}</div>
      <div style="margin-top:6px">
        ${isProforma ? '<span class="status-badge" style="background:#e5e7eb;color:#374151">PRO FORMA</span>' : `
        <span class="status-badge status-${invoice.status}">
          ${invoice.status === 'paye' ? 'PAYÉ' : invoice.status === 'partiel' ? 'PARTIEL' : 'EN ATTENTE'}
        </span>`}
      </div>
    </div>
  </div>

  <div class="patient-box">
    <div class="name">${patient?.first_name || ''} ${patient?.last_name || ''}</div>
    <div class="detail">Code : ${patient?.code || '—'} ${patient?.phone ? `• Tél : ${patient.phone}` : ''}</div>
  </div>

  <table>
    <thead>
      <tr>
        <th style="text-align:center;width:40px">N°</th>
        <th>Désignation</th>
        <th style="text-align:center;width:60px">Qté</th>
        <th style="text-align:right;width:120px">Prix unitaire</th>
        <th style="text-align:right;width:120px">Total</th>
      </tr>
    </thead>
    <tbody>
      ${itemRows}
      <tr style="background:#f0f4ff;font-weight:bold">
        <td colspan="4" style="text-align:right;border-top:2px solid ${clinicColor}">TOTAL</td>
        <td style="text-align:right;border-top:2px solid ${clinicColor}">${formatCurrency(total)}</td>
      </tr>
    </tbody>
  </table>

  ${(companyAmt > 0 || insuranceAmt > 0) ? `
  <div class="convention-box">
    <div class="title">Répartition convention</div>
    ${companyAmt > 0 ? `<div class="convention-row"><span>Part société</span><span>${formatCurrency(companyAmt)}</span></div>` : ''}
    ${insuranceAmt > 0 ? `<div class="convention-row"><span>Part assurance</span><span>${formatCurrency(insuranceAmt)}</span></div>` : ''}
    <div class="convention-row" style="font-weight:bold;border-top:1px solid #fde68a;padding-top:4px;margin-top:4px">
      <span>Part patient</span><span>${formatCurrency(patientAmt)}</span>
    </div>
  </div>` : ''}

  ${discountPct > 0 ? `
  <div style="background:#fef2f2;border:1px solid #fecaca;padding:10px;border-radius:6px;margin-bottom:18px">
    <div style="display:flex;justify-content:space-between;font-size:12px">
      <span>Sous-total avant remise</span><span>${formatCurrency(total + discountAmt)}</span>
    </div>
    <div style="display:flex;justify-content:space-between;font-size:12px;color:#dc2626;font-weight:bold">
      <span>Remise (${discountPct}%)</span><span>- ${formatCurrency(discountAmt)}</span>
    </div>
  </div>` : ''}

  <table class="totals">
    <tr><td>Total</td><td style="text-align:right">${formatCurrency(total)}</td></tr>
    ${!isProforma ? `<tr class="paid"><td>Payé</td><td style="text-align:right">${formatCurrency(paid)}</td></tr>
    <tr class="reste"><td>Reste à payer</td><td style="text-align:right">${formatCurrency(reste > 0 ? reste : 0)}</td></tr>` : ''}
  </table>

  ${paymentRows ? `
  <h3 style="font-size:13px;margin-bottom:8px;color:${clinicColor}">Historique des paiements</h3>
  <table>
    <thead>
      <tr><th>Date</th><th>Mode</th><th>Référence</th><th style="text-align:right">Montant</th></tr>
    </thead>
    <tbody>${paymentRows}</tbody>
  </table>` : ''}

  <div class="signatures" style="margin-top:50px;display:flex;justify-content:space-between;gap:40px;page-break-inside:avoid">
    <div style="flex:1">
      <div style="font-size:11px;color:#555;margin-bottom:4px;font-weight:600">Signature du client</div>
      <div style="border:1px solid #cbd5e1;border-radius:4px;height:90px;background:#fafafa"></div>
      <div style="font-size:9px;color:#888;margin-top:4px;text-align:center">Lu et approuvé — Date et signature</div>
    </div>
    <div style="flex:1">
      <div style="font-size:11px;color:#555;margin-bottom:4px;font-weight:600">Cachet et signature ${clinicName}</div>
      <div style="border:1px solid #cbd5e1;border-radius:4px;height:90px;background:#fafafa"></div>
      <div style="font-size:9px;color:#888;margin-top:4px;text-align:center">Caissier / Responsable</div>
    </div>
  </div>

  <div class="footer">
    ${isProforma ? '<p style="font-size:11px;font-weight:bold;color:#dc2626;margin-bottom:8px">⚠ Ce document est un devis estimatif (Pro Forma) et ne constitue pas une facture définitive.</p>' : ''}
    <p>Document confidentiel — ${isProforma ? 'Pro Forma' : 'Facture'} ${invoice.invoice_number}</p>
    <p>${clinicName} — ${clinicSubtitle} — Imprimé le ${formatDate(new Date().toISOString())}</p>
  </div>
</body>
</html>`;

    // Create a hidden iframe for printing without opening a new tab
    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.top = '-10000px';
    iframe.style.left = '-10000px';
    iframe.style.width = '0';
    iframe.style.height = '0';
    document.body.appendChild(iframe);
    
    const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
    if (!iframeDoc) return;
    iframeDoc.open();
    iframeDoc.write(html);
    iframeDoc.close();
    
    iframe.onload = () => {
      iframe.contentWindow?.print();
      setTimeout(() => document.body.removeChild(iframe), 1000);
    };
    // Fallback
    setTimeout(() => {
      iframe.contentWindow?.print();
      setTimeout(() => {
        if (document.body.contains(iframe)) document.body.removeChild(iframe);
      }, 1000);
    }, 500);
  };

  return (
    <Button variant="outline" size="sm" className="gap-1" onClick={handlePrint}>
      <Printer className="h-3.5 w-3.5" />
      Imprimer
    </Button>
  );
}
