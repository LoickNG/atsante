

## Plan : Transformer ATSanté en PWA installable

### Objectif
Permettre d'installer l'application depuis Chrome/Edge comme une app native (icône bureau, plein écran, splash screen), idéale pour une démo professionnelle.

### Étapes

**1. Installer `vite-plugin-pwa`**
- Ajouter la dépendance au projet

**2. Configurer le plugin PWA dans `vite.config.ts`**
- Ajouter `VitePWA` avec :
  - Manifest : nom "ATSanté", couleurs thème médical, icônes
  - Mode `registerType: 'autoUpdate'`
  - `navigateFallbackDenylist: [/^\/~oauth/]` pour ne pas interférer avec l'auth
  - Stratégie de cache pour fonctionnement hors-ligne basique

**3. Créer les icônes PWA**
- Générer `pwa-192x192.png` et `pwa-512x512.png` dans `/public` (icône ATSanté simple avec texte/croix médicale)

**4. Mettre à jour `index.html`**
- Ajouter les meta tags mobile : `theme-color`, `apple-mobile-web-app-capable`, lien favicon, etc.

**5. Créer une page `/installer` (optionnel mais utile pour la démo)**
- Page avec un bouton "Installer l'application" qui déclenche le prompt d'installation du navigateur
- Instructions visuelles pour iOS (Partager → Ajouter à l'écran d'accueil)

### Résultat
Après déploiement, vous pourrez :
1. Ouvrir https://atsante.lovable.app dans Chrome
2. Cliquer sur "Installer" (barre d'adresse ou page dédiée)
3. L'app apparaît sur le bureau comme un `.exe` classique, en plein écran, sans barre de navigateur

### Détails techniques
- Plugin : `vite-plugin-pwa` (basé sur Workbox)
- Fichiers modifiés : `vite.config.ts`, `index.html`
- Fichiers créés : icônes PWA dans `public/`, page `/installer`
- Route ajoutée dans le routeur React

