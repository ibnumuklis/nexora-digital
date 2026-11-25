'use client';
import { useEffect, useState } from 'react';
import { Moon, Sun } from 'lucide-react';

export function ThemeToggle({ className = 'text-white/80 hover:bg-white/10', labels = { light: 'Switch to light theme', dark: 'Switch to dark theme' } }: { className?: string; labels?: { light: string; dark: string } }) {
  const [theme, setTheme] = useState<'light' | 'dark' | null>(null);
  useEffect(() => setTheme((document.documentElement.dataset.theme as 'light' | 'dark') || 'light'), []);
  const toggle = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    document.documentElement.dataset.theme = next;
    try {
      localStorage.setItem('nx-theme', next);
    } catch {}
    setTheme(next);
  };
  return (
    <button type="button" onClick={toggle} className={`grid h-11 w-11 place-items-center rounded-full transition ${className}`} aria-label={theme === 'dark' ? labels.light : labels.dark}>
      {theme === 'dark' ? <Sun size={18} aria-hidden /> : <Moon size={18} aria-hidden />}
    </button>
  );
}
