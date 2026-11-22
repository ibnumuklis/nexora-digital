export const IMAGE_FORMATS = [
  { key: 'portrait', label: 'Portrait post 1080×1350', width: 1080, height: 1350 },
  { key: 'square', label: 'Square post 1080×1080', width: 1080, height: 1080 },
  { key: 'story', label: 'Story / Reel 1080×1920', width: 1080, height: 1920 },
  { key: 'square-lg', label: 'Square 1200×1200', width: 1200, height: 1200 },
  { key: 'landscape', label: 'Landscape 1920×1080', width: 1920, height: 1080 },
] as const;
export type ImageFormatKey = (typeof IMAGE_FORMATS)[number]['key'];

export const VIDEO_FORMATS = [
  { key: '9x16', label: 'Vertical 9:16 (1080×1920)', width: 1080, height: 1920 },
  { key: '1x1', label: 'Square 1:1 (1080×1080)', width: 1080, height: 1080 },
  { key: '16x9', label: 'Landscape 16:9 (1920×1080)', width: 1920, height: 1080 },
] as const;
export const VIDEO_DURATIONS = [15, 30, 60] as const;

export const TEMPLATES = [
  { key: 'product-launch', label: 'Product launch', desc: 'Bold headline, product name, CTA band' },
  { key: 'feature-list', label: 'Feature highlights', desc: 'Headline with up to 4 bullet points' },
  { key: 'quote-card', label: 'Statement card', desc: 'Large statement on brand colour' },
  { key: 'carousel-slide', label: 'Carousel slide', desc: 'Numbered slide for multi-image posts' },
] as const;
export type TemplateKey = (typeof TEMPLATES)[number]['key'];

export const THEMES = {
  forest: { bg: '#102C25', fg: '#F7F8F5', accent: '#C5F36B', muted: 'rgba(247,248,245,0.68)', card: 'rgba(255,255,255,0.07)' },
  light: { bg: '#F7F8F5', fg: '#171C1A', accent: '#16845B', muted: '#525E59', card: '#FFFFFF' },
  lime: { bg: '#C5F36B', fg: '#102C25', accent: '#102C25', muted: 'rgba(16,44,37,0.72)', card: 'rgba(255,255,255,0.45)' },
} as const;
export type ThemeKey = keyof typeof THEMES;

export function imageFormat(key: string) {
  return IMAGE_FORMATS.find((f) => f.key === key) ?? null;
}
export function videoFormat(key: string) {
  return VIDEO_FORMATS.find((f) => f.key === key) ?? null;
}
