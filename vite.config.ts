import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { VitePWA } from "vite-plugin-pwa";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
  },
  plugins: [
    react(),
    mode === "development" && componentTagger(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["pwa-192x192.png", "pwa-512x512.png"],
      manifest: {
        name: "ATSanté - Système de Gestion Hospitalier",
        short_name: "ATSanté",
        description: "Système de Gestion Hospitalier complet",
        theme_color: "#0D9488",
        background_color: "#ffffff",
        display: "standalone",
        orientation: "any",
        start_url: "/",
        scope: "/",
        icons: [
          {
            src: "pwa-192x192.png",
            sizes: "192x192",
            type: "image/png",
          },
          {
            src: "pwa-512x512.png",
            sizes: "512x512",
            type: "image/png",
          },
          {
            src: "pwa-512x512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any maskable",
          },
        ],
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,ico,png,svg,woff2}"],
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
        navigateFallback: "index.html",
        navigateFallbackDenylist: [/^\/~oauth/],
        runtimeCaching: [
          {
            // Toujours récupérer les paramètres de la clinique en frais (logo, nom, couleur, etc.)
            // pour que les en-têtes d'impression soient à jour.
            urlPattern: /\/rest\/v1\/clinic_settings.*$/,
            handler: "NetworkOnly",
            options: { cacheName: "clinic-settings-no-cache" },
          },
          {
            // Logos stockés dans Supabase Storage (bucket email-assets, etc.)
            // StaleWhileRevalidate : affichage rapide mais mise à jour systématique en arrière-plan.
            urlPattern: /\/storage\/v1\/object\/public\/(email-assets|profile-photos)\/.*$/,
            handler: "StaleWhileRevalidate",
            options: {
              cacheName: "clinic-logos",
              expiration: { maxEntries: 30, maxAgeSeconds: 60 * 60 * 24 },
            },
          },
          {
            urlPattern: /^https:\/\/.*supabase.*$/,
            handler: "NetworkFirst",
            options: {
              cacheName: "api-cache",
              expiration: { maxEntries: 50, maxAgeSeconds: 300 },
            },
          },
        ],
      },
    }),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
