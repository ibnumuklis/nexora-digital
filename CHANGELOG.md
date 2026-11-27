# Changelog

## Unreleased — platform stabilization

- Catalog prices use the package billing period in both languages. Product cards compare published prices only within the same currency and billing period.
- The home page hero text and primary CTA are fully opaque on initial display.
- Quotation edits reject malformed amounts. Status transitions verify that the saved status still matches the one read by the action.
- The operations workflow handles an empty render queue, wakes the worker for stale processing locks, and checks the expected status per uptime endpoint. The scheduled worker exits with an error when it cannot claim jobs or clean up demo sessions.

## [1.2.0] — 2026-11-25 — Demo langsung Waroeng Suramadu ERP
- Demo produk Waroeng Suramadu ERP kini memakai aplikasi aslinya dalam **mode demo** terpisah (`https://waroeng-suramadu-demo.vercel.app`, repo `ibnumuklis/waroeng-suramadu-erp`, `build_demo.js`): tanpa Firebase, database di memori browser, data contoh fiktif, ekspor dimatikan. Aplikasi produksi dan Firestore tidak tersentuh.
- Sesi demo NEXORA (mode iframe): timer server, watermark dan batas tidak-aktif tetap berlaku; aplikasi demo mengirim sinyal aktivitas `postMessage` (divalidasi asal) agar sesi tidak terputus saat dipakai.
- Iframe demo lebih tinggi (78vh), `allow-modals`; demo hanya bisa disematkan oleh situs NEXORA (CSP `frame-ancestors`).
- Screenshot produk dari demo (Dashboard, Kasir, HPP, Stok) sebagai file statis `public/products/<slug>/`.

## [1.1.0] — 2026-11-25 — Lokalisasi pasar Indonesia
- Bahasa Indonesia menjadi bahasa utama situs publik; tombol ID/EN (cookie `nx_lang`, 1 tahun) untuk versi Inggris. Admin tetap berbahasa Inggris.
- Migrasi aditif `20261125080633_nexora_content_translations`: kolom `translations jsonb` pada products, product_features, pricing_packages, product_categories, articles. Kolom utama = Bahasa Indonesia; `translations.en` = Inggris.
- Konten produk, kategori, fitur, paket dan artikel dalam Bahasa Indonesia (seed `supabase/seed/20261125_localize_indonesian_content.sql`).
- Harga "mulai dari" sementara per paket (Rupiah/bulan) — Starter/Professional/Enterprise; Custom = hubungi kami. Ditampilkan di kartu produk, detail produk dan tabel harga.
- WhatsApp menjadi CTA utama: tombol header, hero, per produk/paket (pesan otomatis berisi nama produk), tombol mengambang, akhir sesi demo, halaman kontak.
- Segmen lokal di beranda dan halaman Solusi: UMKM kuliner & ritel, sekolah & lembaga, perusahaan menengah, agensi & reseller.
- Kebijakan privasi, syarat & ketentuan, kebijakan cookie dan disclaimer demo versi Bahasa Indonesia (versi Indonesia yang berlaku bila ada perbedaan).
- Formulir: label, pesan error dan pilihan anggaran disesuaikan untuk pasar lokal; nomor WhatsApp disarankan.
- Demo sandbox: label, status dan nilai (Rp) mengikuti bahasa.

## [1.0.0] — 2026-11-22 — Public release (interim hosting)
- Merged PR #1 to `main`; deployed to Vercel production: https://nexora-digital-jet.vercel.app (functions in Tokyo `hnd1`; previews protected by Vercel Authentication, production public).
- Official logos (mark, wordmarks, icons, OG image) across site, admin and render templates.
- Company identity (sole proprietorship, Makassar; email, WhatsApp) and final Privacy (UU PDP), Terms, Cookies and Demo disclaimer.
- Provisional content for all 5 products (features, packages, FAQ, SEO) published; demos enabled in sandbox mode.
- Migration `20261122123507_nexora_drop_duplicate_lead_owner_index` (applied live).
- Free operations: `worker --once` + `.github/workflows/operations.yml` (render queue every 15 min when jobs exist, daily demo cleanup, uptime check).

## [0.2.0] — 2026-11-22 (branch `claude/nexora-production-readiness`, unreleased)

### Database (applied to live, additive)
- `20261122103703_nexora_rbac_audit_hardening`: least-privilege RLS per role, staff policies for the catalog (previously missing), TRUNCATE/TRIGGER/REFERENCES revoked from anon/authenticated, service_role grants, audit triggers, `updated_at` triggers, publish-requires-verification constraint, last-super-admin guard, `staff_directory()`, `log_audit_event()`.
- `20261122104234_nexora_modules_crm_demo_content_analytics`: DB rate limiter; CRM columns (consent, owner, follow-up, score); `submit_inquiry()`; quotation workflow trigger; `track_event()` + event allowlist; `analytics_overview()`; demo engine (`demo_start/heartbeat/end/admin_revoke/cleanup`, `demo_session_events`); integration check log; content approval trigger; `render_jobs` + worker RPCs; public image bucket `nexora-public`; `grant_staff_role()`.
- `20261122114338_nexora_lead_score_search_path`: advisor fix.
- Repo now contains the 5 previously applied migrations verbatim; never-applied legacy SQL archived.

### Application
- Rebuilt public site on live data with honest empty/error states, SEO, JSON-LD, consent-aware analytics, light/dark theme, legal drafts.
- Auth: password + magic link, sign-up with email confirmation, reset, callback (PKCE + token hash), sign-out (local/global), ≥ 12-char password policy.
- Admin console: overview, products, categories, integrations, demo sessions, leads/CRM, sales & quotes, Content Studio, articles, testimonials, analytics, staff, security/audit, account.
- Demo engine UI with server-authoritative timer, warnings at 60/30 s, idle timeout, watermark, synthetic sandbox.
- Content Studio: rules-based copy, editable templates, PNG/JPG export (5 sizes), MP4 worker (H.264, verified), asset library, approvals, calendar.
- Security: nonce CSP, HSTS and headers, same-origin checks, SSRF-safe health checks with DNS-rebinding protection, magic-byte upload checks, CSV formula-injection protection.

### Tooling
- ESLint flat config, vitest (58 tests), Playwright E2E + axe, GitHub Actions CI with gitleaks, `npm audit` 0 vulnerabilities (postcss/fflate overrides).

## [0.1.0] — 2026-11-22
- Handoff baseline imported (did not lint, typecheck or build).
