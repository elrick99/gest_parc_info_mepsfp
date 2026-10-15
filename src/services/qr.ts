import jsQR from 'jsqr';

// Les étiquettes encodent une URL complète
// (ex: http://hote/api/equipements/scan/?qr_code=QR_INV-LAP-099).
// L'API n'attend que la valeur du paramètre : on l'extrait ici. Une saisie
// manuelle (code inventaire ou valeur QR brute) est renvoyée telle quelle.
export const extractScanCode = (raw: string): string => {
  const value = raw.trim();
  try {
    const params = new URL(value).searchParams;
    return (params.get('qr_code') || params.get('code_inventaire') || value).trim();
  } catch {
    return value;
  }
};

export const decodeQrFromImageData = (image: ImageData): string | null => {
  const code = jsQR(image.data, image.width, image.height, { inversionAttempts: 'attemptBoth' });
  return code?.data || null;
};

// Décode un QR code depuis une photo (repli quand la caméra en direct est
// indisponible, par exemple hors HTTPS). L'image est réduite pour rester
// rapide sur les photos de téléphone.
export const decodeQrFromFile = async (file: File): Promise<string | null> => {
  const bitmap = await createImageBitmap(file);
  const maxSide = 1280;
  const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  return decodeQrFromImageData(ctx.getImageData(0, 0, canvas.width, canvas.height));
};
