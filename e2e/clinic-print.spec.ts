/**
 * E2E Playwright — Vérifie que les modifications des paramètres de la clinique
 * (logo / nom / adresse / téléphone / couleur) sont bien reflétées dans
 * les documents imprimés (ordonnances, résultats labo/imagerie).
 *
 * ⚠️ Setup requis (non installé par défaut pour garder le bundle léger) :
 *   npm i -D @playwright/test
 *   npx playwright install chromium
 *   npx playwright test e2e/clinic-print.spec.ts
 *
 * Variables d'environnement attendues :
 *   E2E_BASE_URL       URL de la preview (ex: http://localhost:8080)
 *   E2E_ADMIN_EMAIL    email d'un compte admin de test
 *   E2E_ADMIN_PASSWORD mot de passe associé
 */
import { test, expect, Page } from "@playwright/test";

const BASE_URL = process.env.E2E_BASE_URL || "http://localhost:8080";
const ADMIN_EMAIL = process.env.E2E_ADMIN_EMAIL || "admin@test.local";
const ADMIN_PASSWORD = process.env.E2E_ADMIN_PASSWORD || "password";

// Valeurs temporaires injectées dans les paramètres pour la durée du test.
const TEMP_CLINIC = {
  name: `E2E Clinique ${Date.now()}`,
  address: "12 rue E2E",
  phone: "+235 12 34 56 78",
  color: "#9333ea",
};

async function login(page: Page) {
  await page.goto(`${BASE_URL}/auth`);
  await page.fill('input[type="email"]', ADMIN_EMAIL);
  await page.fill('input[type="password"]', ADMIN_PASSWORD);
  await page.click('button[type="submit"]');
  await page.waitForURL(/\/(dashboard|patients|profil|$)/);
}

async function setClinicSettings(page: Page, values: typeof TEMP_CLINIC) {
  await page.goto(`${BASE_URL}/parametres`);
  await page.getByLabel(/Nom de la clinique/i).fill(values.name);
  await page.getByLabel(/Adresse/i).first().fill(values.address);
  await page.getByLabel(/Téléphone/i).first().fill(values.phone);
  // Couleur primaire (input type=color)
  const colorInput = page.locator('input[type="color"]').first();
  await colorInput.evaluate((el: HTMLInputElement, c: string) => {
    el.value = c;
    el.dispatchEvent(new Event("input", { bubbles: true }));
    el.dispatchEvent(new Event("change", { bubbles: true }));
  }, values.color);
  await page.getByRole("button", { name: /Enregistrer|Sauvegarder/i }).click();
  await expect(page.getByText(/enregistré|mis à jour/i)).toBeVisible({ timeout: 5000 });
}

/**
 * Intercepte window.open pour récupérer le HTML écrit dans la nouvelle fenêtre
 * d'impression au lieu de l'ouvrir réellement.
 */
async function capturePrintHtml(page: Page, trigger: () => Promise<void>): Promise<string> {
  await page.evaluate(() => {
    (window as any).__printHtml = "";
    (window as any).open = () =>
      ({
        document: {
          write: (h: string) => {
            (window as any).__printHtml += h;
          },
          close: () => {},
        },
        print: () => {},
        close: () => {},
      } as any);
  });
  await trigger();
  // Laisser le temps au handler async d'écrire le HTML
  await page.waitForFunction(() => ((window as any).__printHtml || "").length > 100, {
    timeout: 5000,
  });
  return await page.evaluate(() => (window as any).__printHtml as string);
}

test.describe("Identité clinique dans les documents imprimés", () => {
  let originalSnapshot: Record<string, string> = {};

  test.beforeAll(async ({ browser }) => {
    const ctx = await browser.newContext();
    const page = await ctx.newPage();
    await login(page);
    await page.goto(`${BASE_URL}/parametres`);
    originalSnapshot = {
      name: (await page.getByLabel(/Nom de la clinique/i).inputValue()) || "",
      address: (await page.getByLabel(/Adresse/i).first().inputValue()) || "",
      phone: (await page.getByLabel(/Téléphone/i).first().inputValue()) || "",
      color: (await page.locator('input[type="color"]').first().inputValue()) || "#1e40af",
    };
    await setClinicSettings(page, TEMP_CLINIC);
    await ctx.close();
  });

  test.afterAll(async ({ browser }) => {
    const ctx = await browser.newContext();
    const page = await ctx.newPage();
    await login(page);
    await setClinicSettings(page, {
      name: originalSnapshot.name || "Ma Clinique",
      address: originalSnapshot.address || "",
      phone: originalSnapshot.phone || "",
      color: originalSnapshot.color || "#1e40af",
    });
    await ctx.close();
  });

  test("ordonnance imprimée → contient nom/adresse/téléphone/couleur de la clinique", async ({
    page,
  }) => {
    await login(page);
    await page.goto(`${BASE_URL}/patients`);
    await page.locator('[data-testid="patient-row"], tr').first().click();
    await page
      .getByRole("button", { name: /Imprimer.*ordonnance|Ordonnance/i })
      .first()
      .click({ trial: true })
      .catch(() => {});

    const html = await capturePrintHtml(page, async () => {
      await page
        .getByRole("button", { name: /Imprimer.*ordonnance|Imprimer/i })
        .first()
        .click();
    });

    expect(html).toContain(TEMP_CLINIC.name);
    expect(html).toContain(TEMP_CLINIC.address);
    expect(html).toContain(TEMP_CLINIC.phone);
    expect(html.toLowerCase()).toContain(TEMP_CLINIC.color.toLowerCase());
    expect(html).toMatch(/no-cache/i);
  });

  test("résultat de laboratoire imprimé → reflète les paramètres temporaires", async ({
    page,
  }) => {
    await login(page);
    await page.goto(`${BASE_URL}/laboratoire`);

    const html = await capturePrintHtml(page, async () => {
      await page.getByRole("button", { name: /Imprimer/i }).first().click();
    });

    expect(html).toContain(TEMP_CLINIC.name);
    expect(html).toContain(TEMP_CLINIC.phone);
    expect(html.toLowerCase()).toContain(TEMP_CLINIC.color.toLowerCase());
  });

  test("résultat d'imagerie imprimé → reflète les paramètres temporaires", async ({ page }) => {
    await login(page);
    await page.goto(`${BASE_URL}/imagerie`);

    const html = await capturePrintHtml(page, async () => {
      await page.getByRole("button", { name: /Imprimer/i }).first().click();
    });

    expect(html).toContain(TEMP_CLINIC.name);
    expect(html).toContain(TEMP_CLINIC.address);
    expect(html.toLowerCase()).toContain(TEMP_CLINIC.color.toLowerCase());
  });
});
