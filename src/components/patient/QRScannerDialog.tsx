import { useEffect, useRef, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Html5Qrcode } from 'html5-qrcode';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Camera, XCircle } from 'lucide-react';

interface QRScannerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function QRScannerDialog({ open, onOpenChange }: QRScannerDialogProps) {
  const navigate = useNavigate();
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);

  useEffect(() => {
    if (!open) return;

    let mounted = true;
    const startScanner = async () => {
      try {
        setError(null);
        const scanner = new Html5Qrcode('qr-reader');
        scannerRef.current = scanner;

        await scanner.start(
          { facingMode: 'environment' },
          { fps: 10, qrbox: { width: 250, height: 250 } },
          async (decodedText) => {
            if (!mounted) return;
            // Stop scanning immediately
            await scanner.stop().catch(() => {});
            scannerRef.current = null;
            setScanning(false);

            // Look up patient by code
            const code = decodedText.trim();
            const { data, error: dbError } = await supabase
              .from('patients')
              .select('id, first_name, last_name, code')
              .eq('code', code)
              .maybeSingle();

            if (dbError || !data) {
              toast.error('Patient introuvable', {
                description: `Aucun patient avec le code "${code}"`,
              });
              onOpenChange(false);
              return;
            }

            toast.success(`Patient trouvé : ${data.first_name} ${data.last_name}`);
            onOpenChange(false);
            navigate(`/patients/${data.id}`);
          },
          () => {} // ignore scan failures (no QR in frame)
        );

        if (mounted) setScanning(true);
      } catch {
        if (mounted) setError("Impossible d'accéder à la caméra. Vérifiez les permissions.");
      }
    };

    // Small delay to let the dialog DOM render
    const timer = setTimeout(startScanner, 300);

    return () => {
      mounted = false;
      clearTimeout(timer);
      scannerRef.current?.stop().catch(() => {});
      scannerRef.current = null;
      setScanning(false);
    };
  }, [open, navigate, onOpenChange]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Camera className="h-5 w-5" />
            Scanner un code QR patient
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col items-center gap-4">
          <div
            id="qr-reader"
            className="w-full rounded-lg overflow-hidden bg-muted"
            style={{ minHeight: 300 }}
          />

          {error && (
            <div className="flex items-center gap-2 text-destructive text-sm">
              <XCircle className="h-4 w-4" />
              {error}
            </div>
          )}

          {scanning && (
            <p className="text-sm text-muted-foreground text-center">
              Placez le code QR de la carte patient devant la caméra
            </p>
          )}

          <Button variant="outline" onClick={() => onOpenChange(false)} className="w-full">
            Annuler
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
