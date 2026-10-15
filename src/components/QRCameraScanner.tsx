import React, { useEffect, useRef, useState } from 'react';
import { AlertOctagon } from 'lucide-react';
import { decodeQrFromImageData } from '../services/qr';

interface QRCameraScannerProps {
  onDetected: (value: string) => void;
}

const cameraErrorMessage = (err: unknown): string => {
  const name = err instanceof DOMException ? err.name : '';
  if (name === 'NotAllowedError') return "Accès à la caméra refusé. Autorisez-la dans le navigateur puis réessayez.";
  if (name === 'NotFoundError' || name === 'OverconstrainedError') return 'Aucune caméra détectée sur cet appareil.';
  if (name === 'NotReadableError') return 'La caméra est déjà utilisée par une autre application.';
  return "Impossible de démarrer la caméra.";
};

export const QRCameraScanner: React.FC<QRCameraScannerProps> = ({ onDetected }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const onDetectedRef = useRef(onDetected);
  onDetectedRef.current = onDetected;
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let stream: MediaStream | null = null;
    let frame = 0;
    let cancelled = false;
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d', { willReadFrequently: true });

    const tick = () => {
      if (cancelled) return;
      const video = videoRef.current;
      if (video && ctx && video.readyState >= video.HAVE_ENOUGH_DATA && video.videoWidth > 0) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const value = decodeQrFromImageData(ctx.getImageData(0, 0, canvas.width, canvas.height));
        if (value) {
          onDetectedRef.current(value);
          return;
        }
      }
      frame = requestAnimationFrame(tick);
    };

    const start = async () => {
      // getUserMedia n'existe que dans un contexte sécurisé (HTTPS ou localhost).
      if (!navigator.mediaDevices?.getUserMedia) {
        setError("Caméra indisponible : la page doit être ouverte en HTTPS (ou sur localhost). Utilisez « Importer une photo ».");
        return;
      }
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: 'environment' } },
          audio: false,
        });
        if (cancelled) {
          stream.getTracks().forEach(t => t.stop());
          return;
        }
        const video = videoRef.current;
        if (!video) return;
        video.srcObject = stream;
        await video.play();
        frame = requestAnimationFrame(tick);
      } catch (err) {
        if (!cancelled) setError(cameraErrorMessage(err));
      }
    };

    start();

    return () => {
      cancelled = true;
      cancelAnimationFrame(frame);
      stream?.getTracks().forEach(t => t.stop());
    };
  }, []);

  if (error) {
    return (
      <div className="p-4 text-center bg-sunken rounded-xl border border-line-strong text-muted text-xs">
        <AlertOctagon className="w-6 h-6 text-amber-400 mx-auto mb-2 opacity-80" />
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="relative bg-black rounded-xl overflow-hidden border border-line-strong aspect-video">
      <video ref={videoRef} playsInline muted className="w-full h-full object-cover" />
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-40 h-40 border-2 border-white/80 rounded-2xl" />
      </div>
      <p className="absolute bottom-2 inset-x-0 text-center text-[11px] font-mono text-white/90">
        Placez le QR code dans le cadre
      </p>
    </div>
  );
};
