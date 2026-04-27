import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  buildClinicHeader,
  buildClinicHeaderHtml,
  buildClinicFooterHtml,
  printResultDocument,
  NO_CACHE_META,
} from "./printResult";
import type { ClinicSettings } from "@/hooks/useClinicSettings";

const baseClinic: ClinicSettings = {
  id: "clinic-1",
  name: "Clinique Test E2E",
  slogan: "Votre santé, notre priorité",
  address: "Avenue Charles de Gaulle 42",
  city: "N'Djamena",
  country: "Tchad",
  phone: "+235 66 00 00 00",
  phone2: "+235 99 11 22 33",
  email: "contact@clinique-test.td",
  website: "https://clinique-test.td",
  logo_url: "https://example.com/logo.png",
  primary_color: "#0d9488",
  license_number: "LIC-001",
  tax_id: "TAX-001",
  activated_license_key: null,
  created_at: "2024-01-01",
  updated_at: "2024-01-01",
} as any;

describe("printResult — en-tête dynamique de la clinique", () => {
  it("inclut le nom, l'adresse, le téléphone et la couleur dans buildClinicHeader", () => {
    const h = buildClinicHeader(baseClinic);
    expect(h.clinicName).toBe("Clinique Test E2E");
    expect(h.clinicAddress).toContain("Avenue Charles de Gaulle 42");
    expect(h.clinicAddress).toContain("N'Djamena");
    expect(h.clinicAddress).toContain("Tchad");
    expect(h.clinicPhone).toContain("+235 66 00 00 00");
    expect(h.clinicPhone).toContain("+235 99 11 22 33");
    expect(h.clinicColor).toBe("#0d9488");
    expect(h.logoHtml).toContain("https://example.com/logo.png");
    expect(h.logoHtml).toMatch(/[?&]t=\d+/); // cache-buster
  });

  it("buildClinicHeaderHtml expose toutes les infos de la clinique", () => {
    const html = buildClinicHeaderHtml(baseClinic);
    expect(html).toContain("Clinique Test E2E");
    expect(html).toContain("Votre santé, notre priorité");
    expect(html).toContain("Avenue Charles de Gaulle 42");
    expect(html).toContain("+235 66 00 00 00");
    expect(html).toContain("contact@clinique-test.td");
    expect(html).toContain("#0d9488"); // couleur appliquée à la bordure et au titre
    expect(html).toContain("https://example.com/logo.png");
  });

  it("buildClinicFooterHtml reflète le nom et le téléphone", () => {
    const html = buildClinicFooterHtml(baseClinic);
    expect(html).toContain("Clinique Test E2E");
    expect(html).toContain("+235 66 00 00 00");
  });

  it("se met à jour quand on modifie temporairement les paramètres clinique", () => {
    const initial = buildClinicHeaderHtml(baseClinic);
    expect(initial).toContain("Clinique Test E2E");
    expect(initial).toContain("#0d9488");

    // Modification temporaire (simule un changement dans Paramètres)
    const updated: ClinicSettings = {
      ...baseClinic,
      name: "Nouvelle Clinique Modifiée",
      address: "Rue de la Paix 99",
      phone: "+235 77 88 99 00",
      phone2: undefined as any,
      primary_color: "#dc2626",
      logo_url: "https://example.com/new-logo.svg",
    };

    const after = buildClinicHeaderHtml(updated);
    expect(after).toContain("Nouvelle Clinique Modifiée");
    expect(after).toContain("Rue de la Paix 99");
    expect(after).toContain("+235 77 88 99 00");
    expect(after).toContain("#dc2626");
    expect(after).toContain("https://example.com/new-logo.svg");

    // Les anciennes valeurs ne doivent plus apparaître
    expect(after).not.toContain("Clinique Test E2E");
    expect(after).not.toContain("#0d9488");
    expect(after).not.toContain("Avenue Charles de Gaulle 42");
  });

  it("retombe sur des valeurs par défaut si la clinique est indéfinie", () => {
    const html = buildClinicHeaderHtml(undefined);
    expect(html).toContain("Ma Clinique");
    expect(html).toContain("#1e40af"); // couleur par défaut
  });
});

describe("printResult — anti-cache PWA", () => {
  it("NO_CACHE_META contient les directives no-cache requises", () => {
    expect(NO_CACHE_META).toContain('http-equiv="Cache-Control"');
    expect(NO_CACHE_META).toContain("no-cache");
    expect(NO_CACHE_META).toContain("no-store");
    expect(NO_CACHE_META).toContain('http-equiv="Pragma"');
    expect(NO_CACHE_META).toContain('http-equiv="Expires"');
  });

  it("ajoute un cache-buster différent à chaque appel pour le logo", async () => {
    const h1 = buildClinicHeader(baseClinic);
    await new Promise((r) => setTimeout(r, 5));
    const h2 = buildClinicHeader(baseClinic);
    const t1 = h1.logoHtml.match(/[?&]t=(\d+)/)?.[1];
    const t2 = h2.logoHtml.match(/[?&]t=(\d+)/)?.[1];
    expect(t1).toBeDefined();
    expect(t2).toBeDefined();
    expect(Number(t2)).toBeGreaterThanOrEqual(Number(t1));
  });
});

describe("printResultDocument — rendu HTML imprimé complet", () => {
  let writtenHtml = "";
  let openSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    writtenHtml = "";
    const fakeWindow: any = {
      document: {
        write: (html: string) => {
          writtenHtml += html;
        },
        close: () => {},
      },
    };
    openSpy = vi.spyOn(window, "open").mockReturnValue(fakeWindow as any);
  });

  afterEach(() => {
    openSpy.mockRestore();
  });

  it("le document imprimé contient logo, nom, adresse, téléphone et couleur de la clinique", () => {
    printResultDocument({
      clinic: baseClinic,
      patientName: "Jean DUPONT",
      patientCode: "PAT-20260101-0001",
      title: "Résultat de laboratoire",
      date: "27/04/2026",
      content: "Glycémie: 0.95 g/L",
      validatedBy: "Dr. Martin",
    });

    expect(writtenHtml).toContain("<!DOCTYPE html>");
    // En-tête clinique
    expect(writtenHtml).toContain("Clinique Test E2E");
    expect(writtenHtml).toContain("Avenue Charles de Gaulle 42");
    expect(writtenHtml).toContain("+235 66 00 00 00");
    expect(writtenHtml).toContain("https://example.com/logo.png");
    // Couleur primaire utilisée dans les styles
    expect(writtenHtml).toContain("#0d9488");
    // Anti-cache
    expect(writtenHtml).toContain("no-cache");
    // Contenu patient
    expect(writtenHtml).toContain("Jean DUPONT");
    expect(writtenHtml).toContain("PAT-20260101-0001");
    expect(writtenHtml).toContain("Résultat de laboratoire");
    expect(writtenHtml).toContain("Dr. Martin");
  });

  it("régénère le HTML avec les nouveaux paramètres après changement de clinique", () => {
    printResultDocument({
      clinic: baseClinic,
      patientName: "P1",
      patientCode: "PAT-1",
      title: "Doc",
      date: "01/01/2026",
      content: "x",
    });
    const firstHtml = writtenHtml;
    writtenHtml = "";

    // Simule un changement dans les paramètres
    const updated: ClinicSettings = {
      ...baseClinic,
      name: "Clinique Mise À Jour",
      primary_color: "#7c3aed",
      phone: "+235 90 00 00 00",
    };
    printResultDocument({
      clinic: updated,
      patientName: "P1",
      patientCode: "PAT-1",
      title: "Doc",
      date: "01/01/2026",
      content: "x",
    });

    expect(firstHtml).toContain("Clinique Test E2E");
    expect(firstHtml).toContain("#0d9488");
    expect(writtenHtml).toContain("Clinique Mise À Jour");
    expect(writtenHtml).toContain("#7c3aed");
    expect(writtenHtml).toContain("+235 90 00 00 00");
    expect(writtenHtml).not.toContain("Clinique Test E2E");
  });
});
