import { z } from 'zod';

/**
 * Environment validation. Public variables are safe to expose to the browser (RLS protects data).
 * Server-only variables are read lazily through `serverEnv()` so they never reach client bundles.
 */
const publicSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: z.string().min(20),
  NEXT_PUBLIC_SITE_URL: z.string().url().default('http://localhost:3000'),
});

export type PublicEnv = z.infer<typeof publicSchema>;

export function publicEnv(): PublicEnv | null {
  const parsed = publicSchema.safeParse({
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL || undefined,
  });
  return parsed.success ? parsed.data : null;
}

export function requirePublicEnv(): PublicEnv {
  const env = publicEnv();
  if (!env) throw new Error('Supabase public environment is not configured (NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY).');
  return env;
}

export function siteUrl(): string {
  return (process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000').replace(/\/$/, '');
}

const serverSchema = z.object({
  VISITOR_HASH_SALT: z.string().min(16).optional(),
  INTEGRATION_ALLOWED_HOSTS: z.string().optional(),
  NODE_ENV: z.string().optional(),
});

export function serverEnv() {
  if (typeof window !== 'undefined') throw new Error('serverEnv() must not be called in the browser');
  const env = serverSchema.parse({
    VISITOR_HASH_SALT: process.env.VISITOR_HASH_SALT || undefined,
    INTEGRATION_ALLOWED_HOSTS: process.env.INTEGRATION_ALLOWED_HOSTS || undefined,
    NODE_ENV: process.env.NODE_ENV,
  });
  return {
    visitorHashSalt: env.VISITOR_HASH_SALT ?? (env.NODE_ENV === 'production' ? null : 'nexora-dev-only-salt-change-me'),
    integrationAllowedHosts: (env.INTEGRATION_ALLOWED_HOSTS ?? '')
      .split(',')
      .map((h) => h.trim().toLowerCase())
      .filter(Boolean),
  };
}
