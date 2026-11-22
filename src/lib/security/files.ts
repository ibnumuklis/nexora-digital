/** File upload validation by magic bytes (never trust the client-declared MIME type). */
export type SniffedType = 'image/png' | 'image/jpeg' | 'image/webp' | 'video/mp4' | 'application/pdf';

export function sniffMime(buf: Uint8Array): SniffedType | null {
  const b = buf;
  if (b.length >= 8 && b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47 && b[4] === 0x0d && b[5] === 0x0a && b[6] === 0x1a && b[7] === 0x0a) return 'image/png';
  if (b.length >= 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return 'image/jpeg';
  if (b.length >= 12 && String.fromCharCode(...b.slice(0, 4)) === 'RIFF' && String.fromCharCode(...b.slice(8, 12)) === 'WEBP') return 'image/webp';
  if (b.length >= 12 && String.fromCharCode(...b.slice(4, 8)) === 'ftyp') return 'video/mp4';
  if (b.length >= 5 && String.fromCharCode(...b.slice(0, 5)) === '%PDF-') return 'application/pdf';
  return null;
}

export const EXT: Record<SniffedType, string> = { 'image/png': 'png', 'image/jpeg': 'jpg', 'image/webp': 'webp', 'video/mp4': 'mp4', 'application/pdf': 'pdf' };

export async function validateUpload(file: File, allowed: SniffedType[], maxBytes: number): Promise<{ ok: true; mime: SniffedType; bytes: Uint8Array } | { ok: false; error: string }> {
  if (!file || typeof file.arrayBuffer !== 'function' || file.size === 0) return { ok: false, error: 'Choose a file to upload.' };
  if (file.size > maxBytes) return { ok: false, error: `File is too large (max ${Math.round(maxBytes / 1024 / 1024)} MB).` };
  const bytes = new Uint8Array(await file.arrayBuffer());
  const mime = sniffMime(bytes);
  if (!mime || !allowed.includes(mime)) return { ok: false, error: `Unsupported file type. Allowed: ${allowed.map((a) => EXT[a]).join(', ')}.` };
  return { ok: true, mime, bytes };
}
