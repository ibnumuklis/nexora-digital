import { describe, expect, it } from 'vitest';
import sharp from 'sharp';
import { buildStoryboard, generateCopy } from '@/lib/content/copy';
import { IMAGE_FORMATS } from '@/lib/content/formats';
import { renderDesign } from '@/lib/content/render';
import { sanitizeDesign } from '@/lib/content/templates';
import { renderVideo, verifyVideo } from '@/lib/content/video';
import { sniffMime } from '@/lib/security/files';

const facts = { name: 'Sample Product', short_description: 'Synthetic description for tests.', target_market: 'test teams', benefits: ['One view of every branch'], features: ['Inventory', 'Reports'], demo_enabled: false };

describe('copy generator (rules-v1)', () => {
  it('uses only supplied facts and never invents numbers or testimonials', () => {
    const d = generateCopy(facts, { platform: 'instagram', tone: 'professional', objective: 'awareness' });
    expect(d.caption).toContain('Sample Product');
    expect(d.caption).toContain('Inventory');
    expect(d.caption).not.toMatch(/\d+\s?%|\b\d{2,}\+?\s?(clients|customers|users)\b|testimonial|award|certified/i);
    expect(d.sources).toEqual(expect.arrayContaining(['product.name', 'product_features']));
    expect(d.generator).toBe('rules-v1');
  });
  it('warns when facts are missing or objective is impossible', () => {
    const d = generateCopy({ name: 'Bare' }, { platform: 'linkedin', tone: 'bold', objective: 'demo_signups' });
    expect(d.warnings.join(' ')).toMatch(/No verified benefits/);
    expect(d.warnings.join(' ')).toMatch(/no live demo/);
    expect(d.cta).toBe('Book a consultation');
  });
  it('respects platform length limits', () => {
    const long = { ...facts, short_description: 'x'.repeat(239), features: Array.from({ length: 4 }, (_, i) => `Feature ${i} ` + 'y'.repeat(100)) };
    const d = generateCopy(long, { platform: 'x', tone: 'friendly', objective: 'launch' });
    expect(`${d.caption}\n\n${d.hashtags.join(' ')}`.length).toBeLessThanOrEqual(280);
  });
  it('supports Bahasa Indonesia', () => {
    expect(generateCopy(facts, { platform: 'instagram', tone: 'friendly', objective: 'consultation', language: 'id' }).cta).toBe('Jadwalkan konsultasi');
  });
  it.each([15, 30, 60] as const)('storyboard for %ss sums exactly to the duration', (d) => {
    const s = buildStoryboard({ ...facts, problem_statement: 'A problem.' }, d, 'Learn more');
    expect(s.reduce((a, x) => a + x.seconds, 0)).toBe(d);
    expect(s[0].kind).toBe('intro');
    expect(s.at(-1)!.kind).toBe('cta');
  });
});

describe('template renderer', () => {
  it('sanitises input', () => {
    const d = sanitizeDesign({ template: 'product-launch', theme: 'nope' as never, headline: 'a\u0000b'.repeat(100), imageDataUri: 'javascript:alert(1)', bullets: ['1', '2', '3', '4', '5'] });
    expect(d.headline.length).toBeLessThanOrEqual(120);
    expect(d.theme).toBe('forest');
    expect(d.imageDataUri).toBeNull();
    expect(d.bullets).toHaveLength(4);
  });
  it.each(IMAGE_FORMATS.map((f) => [f.key, f.width, f.height] as const))('renders %s at exact %ix%i (PNG + JPG)', async (_k, w, h) => {
    for (const fmt of ['png', 'jpg'] as const) {
      const img = await renderDesign({ template: 'feature-list', theme: 'light', headline: 'Test headline', bullets: ['A', 'B'], cta: 'Go' }, w, h, fmt);
      const meta = await sharp(img.buffer).metadata();
      expect([meta.width, meta.height]).toEqual([w, h]);
      expect(sniffMime(new Uint8Array(img.buffer))).toBe(fmt === 'png' ? 'image/png' : 'image/jpeg');
      expect(img.sha256).toMatch(/^[a-f0-9]{64}$/);
    }
  });
});

describe('video renderer', () => {
  it('verifyVideo rejects mismatches (no fake MP4)', () => {
    const good = { codec: 'h264', pixFmt: 'yuv420p', width: 1080, height: 1920, duration: 15.01, hasAudio: true, formatName: 'mov,mp4,m4a,3gp,3g2,mj2' };
    expect(verifyVideo(good, { width: 1080, height: 1920, durationSeconds: 15 })).toEqual([]);
    expect(verifyVideo({ ...good, codec: 'vp9', formatName: 'matroska,webm' }, { width: 1080, height: 1920, durationSeconds: 15 })).toHaveLength(2);
    expect(verifyVideo({ ...good, duration: 14.2 }, { width: 1080, height: 1920, durationSeconds: 15 })).toHaveLength(1);
  });
  it('renders a real, verified 15-second 1:1 H.264 MP4', async () => {
    const scenes = buildStoryboard(facts, 15, 'Learn more');
    const res = await renderVideo({ width: 1080, height: 1080, durationSeconds: 15, scenes, theme: 'forest', productName: facts.name });
    try {
      expect(res.probe.codec).toBe('h264');
      expect(res.probe.pixFmt).toBe('yuv420p');
      expect([res.probe.width, res.probe.height]).toEqual([1080, 1080]);
      expect(Math.abs(res.probe.duration - 15)).toBeLessThan(0.2);
      expect(res.bytes).toBeGreaterThan(10_000);
    } finally {
      await res.cleanup();
    }
  });
});
