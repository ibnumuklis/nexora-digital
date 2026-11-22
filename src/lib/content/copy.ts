/**
 * Deterministic copy suggestions built ONLY from verified product fields supplied by the caller.
 * No invented metrics, testimonials, customers or capabilities. Output is always a draft.
 */
export const PLATFORMS = ['instagram', 'linkedin', 'facebook', 'tiktok', 'whatsapp_status', 'x'] as const;
export const TONES = ['professional', 'friendly', 'bold', 'educational'] as const;
export const OBJECTIVES = ['awareness', 'demo_signups', 'consultation', 'launch', 'education'] as const;
export type Platform = (typeof PLATFORMS)[number];
export type Tone = (typeof TONES)[number];
export type Objective = (typeof OBJECTIVES)[number];

export type ProductFacts = { name: string; short_description?: string | null; target_market?: string | null; benefits?: string[]; features?: string[]; demo_enabled?: boolean };
export type CopyBrief = { platform: Platform; tone: Tone; objective: Objective; audience?: string | null; language?: 'en' | 'id' };
export type CopyDraft = { headline: string; subline: string; caption: string; cta: string; hashtags: string[]; bullets: string[]; sources: string[]; generator: 'rules-v1'; warnings: string[] };

const LIMITS: Record<Platform, number> = { instagram: 2200, linkedin: 3000, facebook: 2000, tiktok: 2200, whatsapp_status: 700, x: 280 };

const CTA: Record<'en' | 'id', Record<Objective, string>> = {
  en: { awareness: 'Learn more', demo_signups: 'Try the demo', consultation: 'Book a consultation', launch: 'Explore now', education: 'Read more' },
  id: { awareness: 'Pelajari lebih lanjut', demo_signups: 'Coba demonya', consultation: 'Jadwalkan konsultasi', launch: 'Lihat sekarang', education: 'Baca selengkapnya' },
};

const OPENERS: Record<'en' | 'id', Record<Tone, (n: string) => string>> = {
  en: { professional: (n) => `Introducing ${n}.`, friendly: (n) => `Meet ${n} 👋`, bold: (n) => `${n} is here.`, educational: (n) => `What is ${n}?` },
  id: { professional: (n) => `Memperkenalkan ${n}.`, friendly: (n) => `Kenalan dengan ${n} 👋`, bold: (n) => `${n} telah hadir.`, educational: (n) => `Apa itu ${n}?` },
};

function tag(s: string) {
  return '#' + s.replace(/[^A-Za-z0-9]+/g, ' ').trim().split(/\s+/).map((w) => w[0].toUpperCase() + w.slice(1).toLowerCase()).join('');
}

export function generateCopy(p: ProductFacts, brief: CopyBrief): CopyDraft {
  const lang = brief.language ?? 'en';
  const sources: string[] = ['product.name'];
  const warnings: string[] = [];
  const benefits = (p.benefits ?? []).filter(Boolean).slice(0, 4);
  const features = (p.features ?? []).filter(Boolean).slice(0, 4);
  if (benefits.length) sources.push('product.benefits');
  if (features.length) sources.push('product_features');
  if (!p.short_description) warnings.push('Product has no short description — subline left generic.');
  if (!benefits.length && !features.length) warnings.push('No verified benefits or features — add them to the product before publishing content.');
  if (brief.objective === 'demo_signups' && !p.demo_enabled) warnings.push('Objective is demo sign-ups but this product has no live demo. Use “consultation” instead.');

  const headline = (benefits[0] ?? p.short_description ?? p.name).replace(/\.$/, '').slice(0, 90);
  const subline = (p.short_description ?? (lang === 'id' ? `Produk dari NEXORA DIGITAL.` : `A product by NEXORA DIGITAL.`)).slice(0, 200);
  if (p.short_description) sources.push('product.short_description');
  const bullets = (features.length ? features : benefits).slice(0, 4);
  const audienceLine = brief.audience || p.target_market ? (lang === 'id' ? `Untuk ${brief.audience || p.target_market}.` : `Built for ${brief.audience || p.target_market}.`) : '';
  if (!brief.audience && p.target_market) sources.push('product.target_market');
  const cta = brief.objective === 'demo_signups' && !p.demo_enabled ? CTA[lang].consultation : CTA[lang][brief.objective];

  const parts = [
    OPENERS[lang][brief.tone](p.name),
    subline,
    audienceLine,
    bullets.length ? bullets.map((b) => `• ${b}`).join('\n') : '',
    `${cta} → nexora.digital`,
  ].filter(Boolean);
  let caption = parts.join(brief.platform === 'x' ? ' ' : '\n\n');
  const hashtags = Array.from(new Set([tag('NEXORA Digital'), tag(p.name), ...(brief.platform === 'linkedin' ? [tag('Digital Transformation')] : [])])).slice(0, brief.platform === 'x' ? 2 : 5);
  const limit = LIMITS[brief.platform];
  const withTags = `${caption}\n\n${hashtags.join(' ')}`;
  if (withTags.length > limit) {
    caption = caption.slice(0, Math.max(0, limit - hashtags.join(' ').length - 4)).replace(/\s+\S*$/, '') + '…';
    warnings.push(`Caption shortened to fit the ${brief.platform} limit (${limit} characters).`);
  }
  return { headline, subline, caption, cta, hashtags, bullets, sources: Array.from(new Set(sources)), generator: 'rules-v1', warnings };
}

/** Storyboard for 15/30/60-second videos: scenes with durations that sum exactly to the target. */
export type Scene = { kind: 'intro' | 'problem' | 'feature' | 'cta'; headline: string; subline?: string; bullets?: string[]; seconds: number };

export function buildStoryboard(p: ProductFacts & { problem_statement?: string | null }, durationSeconds: 15 | 30 | 60, cta: string): Scene[] {
  const features = (p.features ?? []).filter(Boolean);
  const benefits = (p.benefits ?? []).filter(Boolean);
  const points = (features.length ? features : benefits).slice(0, durationSeconds === 15 ? 1 : durationSeconds === 30 ? 3 : 6);
  const scenes: Omit<Scene, 'seconds'>[] = [{ kind: 'intro', headline: p.name, subline: p.short_description ?? undefined }];
  if (durationSeconds >= 30 && p.problem_statement) scenes.push({ kind: 'problem', headline: p.problem_statement.slice(0, 110) });
  if (points.length) {
    if (durationSeconds === 60) for (let i = 0; i < points.length; i += 2) scenes.push({ kind: 'feature', headline: points[i], bullets: points.slice(i, i + 2) });
    else points.forEach((pt) => scenes.push({ kind: 'feature', headline: pt }));
  }
  scenes.push({ kind: 'cta', headline: cta, subline: 'NEXORA DIGITAL · Build. Innovate. Transform.' });
  const base = Math.floor(durationSeconds / scenes.length);
  let rest = durationSeconds - base * scenes.length;
  return scenes.map((s) => ({ ...s, seconds: base + (rest-- > 0 ? 1 : 0) }));
}
