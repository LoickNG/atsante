import { useRef, useState, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Camera, RotateCcw, X, Upload } from 'lucide-react';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';

interface WebcamCaptureProps {
  onCapture: (blob: Blob) => void;
  capturedUrl?: string | null;
  onClear?: () => void;
  autoStart?: boolean;
}

export function WebcamCapture({ onCapture, capturedUrl, onClear, autoStart = false }: WebcamCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [streaming, setStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const hasAutoStarted = useRef(false);

  const startCamera = useCallback(async () => {
    try {
      setError(null);
      if (!navigator.mediaDevices?.getUserMedia) {
        setError("Votre navigateur ne supporte pas l'accès à la caméra. Utilisez Chrome, Edge ou Firefox récents.");
        return;
      }
      if (!window.isSecureContext) {
        setError("L'accès à la caméra nécessite HTTPS. Ouvrez l'application via une URL sécurisée.");
        return;
      }
      // Try with ideal constraints, fallback to basic if it fails
      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: 'user' },
          audio: false,
        });
      } catch (innerErr) {
        console.warn('Webcam: ideal constraints failed, trying basic', innerErr);
        stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      }
      streamRef.current = stream;
      setStreaming(true);
      // Wait for next tick so the <video> element is mounted before assigning the stream
      setTimeout(async () => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          try { await videoRef.current.play(); } catch (e) { console.warn('video.play() failed', e); }
        }
      }, 50);
    } catch (err: any) {
      console.error('Webcam error:', err);
      const name = err?.name || '';
      if (name === 'NotAllowedError' || name === 'PermissionDeniedError') {
        setError("Accès à la caméra refusé. Autorisez la caméra dans les paramètres du navigateur.");
      } else if (name === 'NotFoundError' || name === 'DevicesNotFoundError') {
        setError("Aucune caméra détectée sur cet appareil.");
      } else if (name === 'NotReadableError') {
        setError("La caméra est utilisée par une autre application. Fermez les autres apps et réessayez.");
      } else {
        setError(`Impossible d'accéder à la caméra (${name || 'erreur inconnue'}). Cliquez sur "Prendre une photo" pour réessayer.`);
      }
    }
  }, []);

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
    setStreaming(false);
  }, []);

  // Auto-start camera if requested and no photo captured yet
  useEffect(() => {
    if (autoStart && !capturedUrl && !streaming && !hasAutoStarted.current) {
      hasAutoStarted.current = true;
      startCamera();
    }
  }, [autoStart, capturedUrl, streaming, startCamera]);

  useEffect(() => () => stopCamera(), [stopCamera]);

  const takePhoto = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    canvas.width = 300;
    canvas.height = 300;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Center-crop to square
    const size = Math.min(video.videoWidth, video.videoHeight);
    const sx = (video.videoWidth - size) / 2;
    const sy = (video.videoHeight - size) / 2;
    ctx.drawImage(video, sx, sy, size, size, 0, 0, 300, 300);

    canvas.toBlob(blob => {
      if (blob) {
        onCapture(blob);
        stopCamera();
      }
    }, 'image/jpeg', 0.85);
  }, [onCapture, stopCamera]);

  if (capturedUrl) {
    return (
      <div className="flex flex-col items-center gap-2">
        <Avatar className="h-28 w-28 border-2 border-primary">
          <AvatarImage src={capturedUrl} alt="Photo patient" />
          <AvatarFallback>Photo</AvatarFallback>
        </Avatar>
        <div className="flex gap-2">
          <Button type="button" variant="outline" size="sm" onClick={() => { onClear?.(); startCamera(); }} className="gap-1">
            <RotateCcw className="h-3 w-3" />Reprendre
          </Button>
          <Button type="button" variant="ghost" size="sm" onClick={onClear} className="gap-1">
            <X className="h-3 w-3" />Supprimer
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-3">
      <canvas ref={canvasRef} className="hidden" />
      {streaming ? (
        <>
          <div className="relative rounded-full overflow-hidden h-28 w-28 border-2 border-primary">
            <video ref={videoRef} className="absolute inset-0 w-full h-full object-cover" muted playsInline />
          </div>
          <div className="flex gap-2">
            <Button type="button" size="sm" onClick={takePhoto} className="gap-1">
              <Camera className="h-3 w-3" />Capturer
            </Button>
            <Button type="button" variant="ghost" size="sm" onClick={stopCamera}>
              Annuler
            </Button>
          </div>
        </>
      ) : (
      <>
          <div className="h-28 w-28 rounded-full bg-muted flex items-center justify-center border-2 border-dashed border-destructive/40">
            <Camera className="h-8 w-8 text-muted-foreground" />
          </div>
          {error && <p className="text-xs text-destructive text-center max-w-xs">{error}</p>}
          <div className="flex flex-wrap gap-2 justify-center">
            <Button type="button" variant="outline" size="sm" onClick={startCamera} className="gap-1">
              <Camera className="h-3 w-3" />Prendre une photo
            </Button>
            <Button type="button" variant="ghost" size="sm" onClick={() => fileInputRef.current?.click()} className="gap-1">
              <Upload className="h-3 w-3" />Importer
            </Button>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="user"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) onCapture(file);
              e.target.value = '';
            }}
          />
        </>
      )}
    </div>
  );
}
