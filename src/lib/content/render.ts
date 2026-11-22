import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import path from 'node:path';
import satori from 'satori';
import { Resvg } from '@resvg/resvg-js';
import sharp from 'sharp';
import { renderTemplate, type DesignInput } from './templates';

/**
 * Deterministic server-side renderer: template → SVG (Satori) → PNG (resvg) → optional JPG (sharp).
 * Used by the admin export action and by the video worker (frames). No network access.
 */
let fontsPromise: Promise<{ name: string; data: Buffer; weight: 400 | 600 | 700; style: 'normal' }[]> | null = null;
function fonts() {
  fontsPromise ??= (async () => {
    const dir = path.join(process.cwd(), 'node_modules/@fontsource/inter/files');
    const load = (w: number) => readFile(path.join(dir, `inter-latin-${w}-normal.woff`));
    const [r, s, b] = await Promise.all([load(400), load(600), load(700)]);
    return [
      { name: 'Inter', data: r, weight: 400 as const, style: 'normal' as const },
      { name: 'Inter', data: s, weight: 600 as const, style: 'normal' as const },
      { name: 'Inter', data: b, weight: 700 as const, style: 'normal' as const },
    ];
  })();
  return fontsPromise;
}

export type RenderedImage = { buffer: Buffer; mime: 'image/png' | 'image/jpeg'; width: number; height: number; bytes: number; sha256: string };

export async function renderDesign(input: DesignInput, width: number, height: number, format: 'png' | 'jpg' = 'png'): Promise<RenderedImage> {
  const svg = await satori(renderTemplate(input, width, height), { width, height, fonts: await fonts() });
  const png = new Resvg(svg, { fitTo: { mode: 'width', value: width }, font: { loadSystemFonts: false } }).render().asPng();
  const buffer = format === 'jpg' ? await sharp(png).flatten({ background: '#ffffff' }).jpeg({ quality: 90, mozjpeg: true }).toBuffer() : Buffer.from(png);
  const meta = await sharp(buffer).metadata();
  if (meta.width !== width || meta.height !== height) throw new Error(`render_dimension_mismatch ${meta.width}x${meta.height}`);
  return { buffer, mime: format === 'jpg' ? 'image/jpeg' : 'image/png', width, height, bytes: buffer.length, sha256: createHash('sha256').update(buffer).digest('hex') };
}
