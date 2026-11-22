# Production Blockers

The following require external access, verified inputs, or additional infrastructure and cannot be safely inferred from a local codebase.

1. A dedicated Supabase project must be selected and provisioned. Do not reuse the unrelated existing Supabase projects.
2. Domain ownership and hosting project must be confirmed.
3. Each application needs a verified production URL and a separate demo URL/environment.
4. Each demo requires synthetic data, a server-side proxy or sandbox, a strict allowlist, expiry enforcement, and reset/cleanup.
5. Admin roles must be assigned to verified Auth users.
6. AI provider and budget must be selected before enabling paid generation.
7. MP4 export requires a background worker with FFmpeg/Remotion and storage lifecycle management.
8. Payment gateway and legal commercial terms require explicit merchant configuration and review.
9. Privacy notice, consent, data retention, backups, monitoring and incident response need review.
10. The application must pass dependency installation, production build, automated tests, and a security review before launch.
