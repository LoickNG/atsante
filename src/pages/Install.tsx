import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Download, Monitor, Smartphone, CheckCircle2, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export default function Install() {
  const navigate = useNavigate();
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    setIsStandalone(window.matchMedia("(display-mode: standalone)").matches);

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", handler);

    window.addEventListener("appinstalled", () => setInstalled(true));

    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") setInstalled(true);
    setDeferredPrompt(null);
  };

  if (isStandalone) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="max-w-md w-full text-center">
          <CardHeader>
            <CheckCircle2 className="h-16 w-16 text-primary mx-auto mb-4" />
            <CardTitle className="text-2xl">Application installée !</CardTitle>
            <CardDescription>
              Vous utilisez déjà ATSanté en mode application.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => navigate("/")} className="w-full">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Retour au tableau de bord
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="max-w-lg w-full">
        <CardHeader className="text-center">
          <img src="/pwa-192x192.png" alt="ATSanté" className="h-20 w-20 mx-auto mb-4 rounded-2xl shadow-lg" />
          <CardTitle className="text-2xl">Installer ATSanté</CardTitle>
          <CardDescription>
            Installez l'application sur votre appareil pour un accès rapide, sans barre de navigateur.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {installed ? (
            <div className="text-center space-y-4">
              <CheckCircle2 className="h-16 w-16 text-primary mx-auto" />
              <p className="text-lg font-medium">Installation réussie !</p>
              <p className="text-sm text-muted-foreground">
                Vous pouvez maintenant lancer ATSanté depuis votre bureau ou écran d'accueil.
              </p>
            </div>
          ) : deferredPrompt ? (
            <Button onClick={handleInstall} size="lg" className="w-full text-lg h-14">
              <Download className="mr-2 h-5 w-5" />
              Installer l'application
            </Button>
          ) : (
            <div className="space-y-4">
              <div className="rounded-lg border p-4 space-y-3">
                <div className="flex items-center gap-3">
                  <Monitor className="h-5 w-5 text-primary shrink-0" />
                  <div>
                    <p className="font-medium">Chrome / Edge (PC)</p>
                    <p className="text-sm text-muted-foreground">
                      Cliquez sur l'icône d'installation dans la barre d'adresse (⊕) ou allez dans Menu → Installer ATSanté
                    </p>
                  </div>
                </div>
              </div>
              <div className="rounded-lg border p-4 space-y-3">
                <div className="flex items-center gap-3">
                  <Smartphone className="h-5 w-5 text-primary shrink-0" />
                  <div>
                    <p className="font-medium">Safari (iOS)</p>
                    <p className="text-sm text-muted-foreground">
                      Appuyez sur Partager (⬆) → "Sur l'écran d'accueil"
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          <Button variant="outline" onClick={() => navigate("/")} className="w-full">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Retour
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
