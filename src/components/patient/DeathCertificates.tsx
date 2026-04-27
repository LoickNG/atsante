import { Patient } from '@/hooks/usePatients';
import { ClinicSettings } from '@/hooks/useClinicSettings';
import { buildClinicHeader, buildClinicHeaderHtml, buildClinicFooterHtml } from '@/utils/printResult';

const formatDate = (d: string) =>
  new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' });

const formatDateTime = (d: string) =>
  new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' });

const calculateAge = (dob: string, deathDate?: string) => {
  const end = deathDate ? new Date(deathDate) : new Date();
  const birth = new Date(dob);
  let age = end.getFullYear() - birth.getFullYear();
  const m = end.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && end.getDate() < birth.getDate())) age--;
  return age;
};

function buildCertificateHTML(
  patient: Patient,
  type: 'genre' | 'cause',
  doctorName: string,
  clinic: ClinicSettings | undefined,
) {
  const p = patient as any;
  const age = calculateAge(patient.date_of_birth, p.deceased_at);
  const deathDate = p.deceased_at ? formatDateTime(p.deceased_at) : 'Non renseigné';
  const today = formatDate(new Date().toISOString());
  const headerHtml = buildClinicHeaderHtml(clinic);
  const footerHtml = buildClinicFooterHtml(clinic);
  const h = buildClinicHeader(clinic);
  const city = clinic?.city || "N'Djamena";

  if (type === 'genre') {
    return `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Certificat de Genre de Mort</title>
    <style>
      @page { size: A4; margin: 15mm; }
      body { font-family: 'Times New Roman', serif; font-size: 13px; line-height: 1.8; color: #000; }
      .doc-title { text-align: center; margin: 20px 0 30px; }
      .doc-title h1 { font-size: 18px; text-transform: uppercase; letter-spacing: 2px; margin: 0; color: ${h.clinicColor}; }
      .doc-title h2 { font-size: 13px; margin: 5px 0 0; font-weight: normal; color: #555; }
      .content { margin: 20px 30px; }
      .field { font-weight: bold; }
      .signature { margin-top: 60px; text-align: right; padding-right: 40px; }
      .stamp-area { border: 1px dashed #999; width: 120px; height: 120px; margin-top: 20px; display: inline-flex; align-items: center; justify-content: center; font-size: 10px; color: #999; }
    </style></head><body>
      ${headerHtml}
      <div class="doc-title">
        <h1>Certificat de Genre de Mort</h1>
        <h2>(Article 79 du Code Civil)</h2>
      </div>
      <div class="content">
        <p>Je soussigné(e), <span class="field">Dr. ${doctorName}</span>, Médecin exerçant à <span class="field">${h.clinicName}</span>,</p>
        <p>certifie avoir constaté le décès de :</p>
        <br/>
        <p><span class="field">Nom et Prénom :</span> ${patient.last_name} ${patient.first_name}</p>
        <p><span class="field">Date de naissance :</span> ${formatDate(patient.date_of_birth)} (${age} ans)</p>
        <p><span class="field">Genre :</span> ${patient.gender === 'F' ? 'Féminin' : 'Masculin'}</p>
        <p><span class="field">Adresse :</span> ${patient.address || 'Non renseignée'}</p>
        <p><span class="field">Code patient :</span> ${patient.code}</p>
        <br/>
        <p><span class="field">Date et heure du décès :</span> ${deathDate}</p>
        <p><span class="field">Lieu du décès :</span> ${p.place_of_death || 'Non renseigné'}</p>
        <br/>
        <p>Le décès est de genre <span class="field">naturel / violent / suspect</span> <em>(rayer les mentions inutiles)</em>.</p>
        <p>Il n'existe <span class="field">aucun obstacle médico-légal</span> à la délivrance du permis d'inhumer.</p>
        <br/>
        <p>En foi de quoi, je délivre le présent certificat pour servir et valoir ce que de droit.</p>
      </div>
      <div class="signature">
        <p>Fait à ${city}, le ${today}</p>
        <br/>
        <p>Le Médecin,</p>
        <br/><br/><br/>
        <p>Dr. ${doctorName}</p>
        <div class="stamp-area">Cachet</div>
      </div>
      ${footerHtml}
    </body></html>`;
  }

  // Certificat de cause de décès
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Certificat de Cause de Décès</title>
  <style>
    @page { size: A4; margin: 15mm; }
    body { font-family: 'Times New Roman', serif; font-size: 13px; line-height: 1.8; color: #000; }
    .doc-title { text-align: center; margin: 20px 0 30px; }
    .doc-title h1 { font-size: 18px; text-transform: uppercase; letter-spacing: 2px; margin: 0; color: ${h.clinicColor}; }
    .doc-title h2 { font-size: 13px; margin: 5px 0 0; font-weight: normal; color: #555; }
    .doc-title .confidential { font-size: 12px; color: red; font-weight: bold; margin-top: 5px; }
    .content { margin: 20px 30px; }
    .field { font-weight: bold; }
    .cause-box { border: 1px solid #333; padding: 15px; margin: 15px 0; }
    .cause-box h3 { margin: 0 0 10px; font-size: 14px; }
    .cause-line { border-bottom: 1px dotted #999; padding: 5px 0; margin: 5px 0; min-height: 25px; }
    .signature { margin-top: 60px; text-align: right; padding-right: 40px; }
    .stamp-area { border: 1px dashed #999; width: 120px; height: 120px; margin-top: 20px; display: inline-flex; align-items: center; justify-content: center; font-size: 10px; color: #999; }
  </style></head><body>
    ${headerHtml}
    <div class="doc-title">
      <h1>Certificat Médical de Cause de Décès</h1>
      <h2>Volet Médical — Confidentiel</h2>
      <p class="confidential">⚠ CONFIDENTIEL — SECRET MÉDICAL</p>
    </div>
    <div class="content">
      <p><span class="field">Nom et Prénom :</span> ${patient.last_name} ${patient.first_name}</p>
      <p><span class="field">Date de naissance :</span> ${formatDate(patient.date_of_birth)} (${age} ans)</p>
      <p><span class="field">Genre :</span> ${patient.gender === 'F' ? 'Féminin' : 'Masculin'}</p>
      <p><span class="field">Code patient :</span> ${patient.code}</p>
      <p><span class="field">Date et heure du décès :</span> ${deathDate}</p>
      <p><span class="field">Lieu du décès :</span> ${p.place_of_death || 'Non renseigné'}</p>

      <div class="cause-box">
        <h3>I. Cause directe et causes antécédentes</h3>
        <p><span class="field">a) Cause directe du décès :</span></p>
        <div class="cause-line">${p.cause_of_death || ''}</div>
        <p><span class="field">b) Due à (cause antécédente) :</span></p>
        <div class="cause-line"></div>
        <p><span class="field">c) Due à (cause initiale) :</span></p>
        <div class="cause-line"></div>
      </div>

      <div class="cause-box">
        <h3>II. Autres états morbides ayant contribué au décès</h3>
        <div class="cause-line">${p.death_notes || ''}</div>
        <div class="cause-line"></div>
      </div>

      <p><span class="field">Autopsie pratiquée :</span> Oui / Non <em>(rayer la mention inutile)</em></p>
      <p><span class="field">Obstacle médico-légal :</span> Oui / Non <em>(rayer la mention inutile)</em></p>
    </div>
    <div class="signature">
      <p>Fait à ${city}, le ${today}</p>
      <br/>
      <p>Le Médecin ayant constaté le décès,</p>
      <br/><br/><br/>
      <p>Dr. ${doctorName}</p>
      <div class="stamp-area">Cachet</div>
    </div>
    ${footerHtml}
  </body></html>`;
}

export function printDeathCertificate(
  patient: Patient,
  type: 'genre' | 'cause',
  doctorName: string,
  clinic?: ClinicSettings,
) {
  const html = buildCertificateHTML(patient, type, doctorName, clinic);
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert("Veuillez autoriser les popups pour imprimer le certificat.");
    return;
  }
  printWindow.document.write(html);
  printWindow.document.close();
  setTimeout(() => { printWindow.print(); }, 500);
}
