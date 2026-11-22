import type { Config } from 'tailwindcss';

const v = (name: string) => `rgb(var(--${name}) / <alpha-value>)`;

const config: Config = {
  darkMode: ['class', '[data-theme="dark"]'],
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        // Brand palette (fixed)
        forest: '#102C25',
        emerald: { DEFAULT: '#16845B', 600: '#12704D', 50: '#EAF4EC' },
        lime: '#C5F36B',
        paper: '#F7F8F5',
        ink: '#171C1A',
        mist: '#E8ECE9',
        // Semantic, theme-aware tokens
        bg: v('bg'),
        surface: v('surface'),
        'surface-2': v('surface-2'),
        fg: v('fg'),
        muted: v('muted'),
        line: v('line'),
        accent: v('accent'),
        'accent-fg': v('accent-fg'),
      },
      fontFamily: {
        sans: ['var(--font-sans)', 'system-ui', 'sans-serif'],
        display: ['var(--font-display)', 'var(--font-sans)', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        soft: '0 20px 60px rgba(16,44,37,.08)',
        card: '0 1px 2px rgba(16,44,37,.04), 0 8px 24px rgba(16,44,37,.06)',
      },
      keyframes: {
        'fade-up': { from: { opacity: '0', transform: 'translateY(8px)' }, to: { opacity: '1', transform: 'none' } },
        shimmer: { '100%': { transform: 'translateX(100%)' } },
      },
      animation: { 'fade-up': 'fade-up .5s ease-out both', shimmer: 'shimmer 1.4s infinite' },
    },
  },
  plugins: [],
};
export default config;
