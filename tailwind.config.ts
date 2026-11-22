import type { Config } from 'tailwindcss';
const config: Config = { content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'], theme: { extend: { colors: { forest:'#102C25', emerald:'#16845B', lime:'#C5F36B', ink:'#171C1A', paper:'#F7F8F5' }, boxShadow: { soft:'0 20px 60px rgba(16,44,37,.08)' } } }, plugins: [] };
export default config;
