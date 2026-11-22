/* eslint-disable @next/next/no-img-element */
import type { ReactElement } from 'react';
import { THEMES, type TemplateKey, type ThemeKey } from './formats';

/** Editable design input. Every text field is user-edited and approved — templates never invent facts. */
export type DesignInput = {
  template: TemplateKey;
  theme: ThemeKey;
  headline: string;
  subline?: string;
  productName?: string;
  bullets?: string[];
  cta?: string;
  slideIndex?: number;
  slideTotal?: number;
  imageDataUri?: string | null;
  footer?: string;
  /** Official logo mark as data URI (injected by the renderer). */
  brandMarkUri?: string | null;
};

export function sanitizeDesign(input: DesignInput): DesignInput {
  const clip = (s: string | undefined, n: number) => (s ?? '').replace(/[\u0000-\u001f]/g, ' ').trim().slice(0, n);
  return {
    template: input.template,
    theme: input.theme in THEMES ? input.theme : 'forest',
    headline: clip(input.headline, 120) || 'NEXORA DIGITAL',
    subline: clip(input.subline, 220),
    productName: clip(input.productName, 60),
    bullets: (input.bullets ?? []).map((b) => clip(b, 80)).filter(Boolean).slice(0, 4),
    cta: clip(input.cta, 40),
    slideIndex: input.slideIndex,
    slideTotal: input.slideTotal,
    imageDataUri: input.imageDataUri && /^data:image\/(png|jpeg|webp);base64,/.test(input.imageDataUri) ? input.imageDataUri : null,
    footer: clip(input.footer, 60) || 'NEXORA DIGITAL · Build. Innovate. Transform.',
    brandMarkUri: input.brandMarkUri && input.brandMarkUri.startsWith('data:image/png;base64,') ? input.brandMarkUri : null,
  };
}

function Logo({ markUri, color, size }: { markUri?: string | null; color: string; size: number }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: size * 0.35 }}>
      {markUri ? <img src={markUri} alt="" style={{ height: size, width: size * 2.08 }} /> : null}
      <div style={{ display: 'flex', fontSize: size * 0.42, letterSpacing: size * 0.04, fontWeight: 700, color }}>NEXORA DIGITAL</div>
    </div>
  );
}

/** Returns a Satori-compatible element tree (flexbox only, inline styles). */
export function renderTemplate(raw: DesignInput, width: number, height: number): ReactElement {
  const d = sanitizeDesign(raw);
  const t = THEMES[d.theme ?? 'forest'];
  const u = Math.min(width, height) / 1080; // scale unit
  const pad = 88 * u;
  const tall = height / width > 1.4;
  const wide = width / height > 1.4;
  const hSize = (d.template === 'quote-card' ? 96 : 84) * u * (wide ? 0.9 : 1);

  const header = (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: t.fg }}>
      <Logo markUri={d.brandMarkUri} color={t.fg} size={52 * u} />
      {d.template === 'carousel-slide' && d.slideIndex ? <div style={{ display: 'flex', fontSize: 30 * u, color: t.muted }}>{`${d.slideIndex}/${d.slideTotal ?? d.slideIndex}`}</div> : d.productName ? <div style={{ display: 'flex', fontSize: 28 * u, color: t.muted }}>{d.productName}</div> : <div style={{ display: 'flex' }} />}
    </div>
  );

  const body = (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 28 * u, flex: 1, justifyContent: 'center' }}>
      {d.template === 'product-launch' && d.productName ? <div style={{ display: 'flex', alignSelf: 'flex-start', padding: `${10 * u}px ${22 * u}px`, borderRadius: 999, background: t.accent, color: d.theme === 'forest' ? '#102C25' : '#F7F8F5', fontSize: 28 * u, fontWeight: 600 }}>{d.productName}</div> : null}
      <div style={{ display: 'flex', flexWrap: 'wrap', fontSize: hSize, lineHeight: 1.05, fontWeight: 700, color: t.fg, letterSpacing: -2 * u }}>{d.template === 'quote-card' ? `“${d.headline}”` : d.headline}</div>
      {d.subline ? <div style={{ display: 'flex', fontSize: 38 * u, lineHeight: 1.35, color: t.muted }}>{d.subline}</div> : null}
      {(d.template === 'feature-list' || d.template === 'carousel-slide') && d.bullets?.length ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 * u, marginTop: 12 * u }}>
          {d.bullets.map((b, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 22 * u, padding: `${20 * u}px ${26 * u}px`, borderRadius: 24 * u, background: t.card, color: t.fg, fontSize: 34 * u }}>
              <div style={{ display: 'flex', width: 18 * u, height: 18 * u, borderRadius: 999, background: t.accent }} />
              <div style={{ display: 'flex' }}>{b}</div>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );

  const image = d.imageDataUri ? (
    <div style={{ display: 'flex', borderRadius: 28 * u, overflow: 'hidden', border: `${2 * u}px solid ${t.card}`, ...(wide ? { width: width * 0.42, height: height - pad * 2 } : { width: width - pad * 2, height: tall ? height * 0.32 : height * 0.26 }) }}>
      <img src={d.imageDataUri} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
    </div>
  ) : null;

  const footer = (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <div style={{ display: 'flex', fontSize: 24 * u, color: t.muted }}>{d.footer}</div>
      {d.cta ? <div style={{ display: 'flex', padding: `${18 * u}px ${34 * u}px`, borderRadius: 999, background: t.accent, color: d.theme === 'forest' ? '#102C25' : '#F7F8F5', fontSize: 30 * u, fontWeight: 700 }}>{d.cta}</div> : null}
    </div>
  );

  const innerW = width - pad * 2;
  const innerH = height - pad * 2;
  const textW = wide && image ? innerW - width * 0.42 - 40 * u : innerW;
  return (
    <div style={{ display: 'flex', width, height, background: t.bg, fontFamily: 'Inter', position: 'relative', overflow: 'hidden' }}>
      <div style={{ display: 'flex', position: 'absolute', right: -160 * u, top: -160 * u, width: 620 * u, height: 620 * u, borderRadius: 999, border: `${2 * u}px solid ${t.accent}`, opacity: 0.18 }} />
      <div style={{ display: 'flex', position: 'absolute', left: pad, top: pad, width: innerW, height: innerH, flexDirection: 'row', gap: 40 * u }}>
        <div style={{ display: 'flex', flexDirection: 'column', width: textW, height: innerH, gap: 40 * u }}>
          {header}
          {!wide && image}
          {body}
          {footer}
        </div>
        {wide && image}
      </div>
    </div>
  );
}
