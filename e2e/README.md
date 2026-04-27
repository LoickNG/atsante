# Tests E2E — Identité clinique dans les impressions

Vérifie que les paramètres de la clinique (nom, adresse, téléphone, couleur, logo)
sont bien injectés dans **tous les documents imprimés** : ordonnances,
résultats de laboratoire, résultats d'imagerie.

## Installation (à faire une seule fois)

```bash
npm i -D @playwright/test
npx playwright install chromium
```

## Configuration

Crée un compte admin de test puis exporte :

```bash
export E2E_BASE_URL="http://localhost:8080"        # ou ton URL preview
export E2E_ADMIN_EMAIL="admin@test.local"
export E2E_ADMIN_PASSWORD="ton-mot-de-passe"
```

## Exécution

```bash
# Lance le serveur de dev dans un terminal
npm run dev

# Dans un autre terminal
npx playwright test e2e/clinic-print.spec.ts
```

## Ce que font les tests

1. **Snapshot** des paramètres clinique actuels (avant modif).
2. **Modification temporaire** des paramètres (nom/adresse/tél/couleur uniques).
3. Pour chaque module (ordonnance, labo, imagerie) :
   - intercepte `window.open` pour capturer le HTML imprimé,
   - clique sur le bouton « Imprimer »,
   - vérifie que le HTML contient bien les valeurs temporaires + les directives anti-cache.
4. **Restauration** des paramètres d'origine.

## Tests unitaires complémentaires

Les helpers (`buildClinicHeaderHtml`, `buildClinicFooterHtml`,
`printResultDocument`) sont couverts par Vitest :

```bash
npm test -- src/utils/printResult.test.ts
```
