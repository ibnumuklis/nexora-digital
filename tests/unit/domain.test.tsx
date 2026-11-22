import { describe, expect, it, beforeEach } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { can, PERMISSIONS, STAFF_ROLES } from '@/lib/auth/rbac';
import { handleInquiry } from '@/lib/inquiries';
import { _resetRateLimits } from '@/lib/http/rate-limit';
import { inquirySchema } from '@/lib/validation/forms';
import { toCsv, QUOTE_NEXT } from '@/lib/crm';
import { renderMarkdown } from '@/lib/markdown';
import { decodeDemoCookie, encodeDemoCookie } from '@/lib/demo/server';
import { buildSandboxView, sandboxModules } from '@/lib/demo/sandbox';
import { buildRecommendations, type Overview } from '@/lib/analytics/recommendations';
import { faqItems, publicMediaUrl } from '@/lib/catalog';

describe('RBAC matrix mirrors RLS (ADR-002)', () => {
  it('limits sensitive permissions', () => {
    expect(PERMISSIONS['staff.manage']).toEqual(['super_admin']);
    expect(can('content_editor', 'crm.read')).toBe(false);
    expect(can('content_editor', 'content.approve')).toBe(false);
    expect(can('marketing_manager', 'content.approve')).toBe(true);
    expect(can('marketing_manager', 'crm.write')).toBe(false);
    expect(can('sales_manager', 'sales.approve')).toBe(false);
    expect(can('admin', 'sales.approve')).toBe(true);
    expect(can('sales_manager', 'catalog.write')).toBe(false);
    expect(can('admin', 'staff.manage')).toBe(false);
    expect(can(null, 'catalog.read')).toBe(false);
    for (const r of STAFF_ROLES) expect(can(r, 'catalog.read')).toBe(true);
  });
});

const valid = { full_name: 'Budi Santoso', email: 'Budi@Example.com', message: 'We need an ERP for three branches.', privacy_consent: true, inquiry_type: 'quotation', source: 'quote' };

describe('inquiry handling', () => {
  beforeEach(() => _resetRateLimits());
  const fakeDb = (error: { message: string } | null = null) => {
    const calls: unknown[] = [];
    return { calls, db: { rpc: async (fn: string, args: unknown) => { calls.push({ fn, args }); return { data: error ? null : { ok: true }, error }; } } as never };
  };
  it('requires consent and valid fields', async () => {
    const { db, calls } = fakeDb();
    const r = await handleInquiry({ ...valid, privacy_consent: false }, { ip: '1.1.1.1', visitorHash: null, db });
    expect(r.status).toBe(400);
    expect(calls).toHaveLength(0);
  });
  it('normalises and submits through the RPC only', async () => {
    const { db, calls } = fakeDb();
    const r = await handleInquiry(valid, { ip: '1.1.1.2', visitorHash: 'a'.repeat(64), db });
    expect(r.status).toBe(200);
    expect(calls[0]).toMatchObject({ fn: 'submit_inquiry', args: { p: { email: 'budi@example.com', visitor_hash: 'a'.repeat(64) } } });
  });
  it('silently drops honeypot submissions', async () => {
    const { db, calls } = fakeDb();
    const r = await handleInquiry({ ...valid, website: 'http://spam' }, { ip: '1.1.1.3', visitorHash: null, db });
    expect(r.status).toBe(200);
    expect(calls).toHaveLength(0);
  });
  it('maps DB errors without leaking internals', async () => {
    const { db } = fakeDb({ message: 'rate_limited' });
    expect((await handleInquiry(valid, { ip: '1.1.1.4', visitorHash: null, db })).status).toBe(429);
    const { db: db2 } = fakeDb({ message: 'relation "leads" does not exist' });
    const r = await handleInquiry(valid, { ip: '1.1.1.5', visitorHash: null, db: db2 });
    expect(r.status).toBe(503);
    expect(JSON.stringify(r.body)).not.toContain('relation');
  });
  it('rate limits per IP at the app layer', async () => {
    const { db } = fakeDb();
    for (let i = 0; i < 5; i++) await handleInquiry(valid, { ip: '9.9.9.9', visitorHash: null, db });
    expect((await handleInquiry(valid, { ip: '9.9.9.9', visitorHash: null, db })).status).toBe(429);
  });
  it('schema rejects oversize and malformed input', () => {
    expect(inquirySchema.safeParse({ ...valid, message: 'x'.repeat(5001) }).success).toBe(false);
    expect(inquirySchema.safeParse({ ...valid, phone: '<script>' }).success).toBe(false);
    expect(inquirySchema.safeParse({ ...valid, product_slug: '../etc' }).success).toBe(false);
  });
});

describe('CSV export', () => {
  it('escapes quotes/newlines and neutralises spreadsheet formulas', () => {
    const csv = toCsv([{ a: '=HYPERLINK("http://x")', b: 'line1\nline2', c: '+1', d: '@SUM(A1)', e: null }], ['a', 'b', 'c', 'd', 'e']);
    expect(csv).toContain(`"'=HYPERLINK(""http://x"")"`);
    expect(csv).toContain('"line1\nline2"');
    expect(csv).toContain("'+1");
    expect(csv).toContain("'@SUM(A1)");
  });
  it('quote workflow cannot skip approval', () => {
    expect(QUOTE_NEXT.drafting).not.toContain('sent');
    expect(QUOTE_NEXT.pending_approval).toContain('approved');
    expect(QUOTE_NEXT.approved).toContain('sent');
  });
});

describe('markdown renderer is XSS-safe', () => {
  it('never emits raw HTML or javascript: links', () => {
    const html = renderToStaticMarkup(<div>{renderMarkdown('## Hi\n\n<img src=x onerror=alert(1)> [x](javascript:alert(1)) [ok](https://nexora.example)\n\n- a\n- **b**')}</div>);
    expect(html).not.toContain('<img');
    expect(html).toContain('&lt;img');
    expect(html).not.toContain('href="javascript');
    expect(html).toContain('href="https://nexora.example"');
    expect(html).toContain('<h2>Hi</h2>');
    expect(html).toContain('<strong>b</strong>');
  });
});

describe('demo helpers', () => {
  it('cookie round-trips and rejects tampering', () => {
    const id = '11111111-2222-3333-4444-555555555555';
    const tok = 'ab'.repeat(32);
    expect(decodeDemoCookie(encodeDemoCookie(id, tok))).toEqual({ sessionId: id, token: tok });
    expect(decodeDemoCookie(`${id}.${tok}x`)).toBeNull();
    expect(decodeDemoCookie(`../${id}.${tok}`)).toBeNull();
    expect(decodeDemoCookie(undefined)).toBeNull();
  });
  it('sandbox data is synthetic, deterministic per session and labelled', () => {
    const mods = sandboxModules(['Inventory', 'Reports']);
    const a = buildSandboxView('s1', mods[0], new Date('2026-11-22T00:00:00Z'));
    const b = buildSandboxView('s1', mods[0], new Date('2026-11-22T00:00:00Z'));
    const c = buildSandboxView('s2', mods[0], new Date('2026-11-22T00:00:00Z'));
    expect(a).toEqual(b);
    expect(a.rows).not.toEqual(c.rows);
    expect(a.rows.every((r) => r.name.startsWith('Sample ') && r.ref.startsWith('SMP-'))).toBe(true);
    expect(a.note).toMatch(/not real/);
    expect(JSON.stringify(a)).not.toMatch(/@|\+62|\d{4} \d{4}/);
  });
});

const baseOverview: Overview = {
  days: 30, total_events: 0, unique_sessions: 0, by_event: {}, by_product: [], by_source: {},
  funnel: { page_view: 0, product_view: 0, demo_cta_click: 0, demo_started: 0, inquiry_submitted: 0 },
  leads: { total: 0, by_source: {}, by_status: {} },
};

describe('recommendations', () => {
  it('returns only an insufficient-data notice when sample is small', () => {
    const r = buildRecommendations({ ...baseOverview, unique_sessions: 12, total_events: 40 });
    expect(r).toHaveLength(1);
    expect(r[0].type).toBe('insufficient_data');
    expect(r[0].evidence.unique_sessions).toBe(12);
  });
  it('separates measured facts from hypotheses and cites evidence', () => {
    const r = buildRecommendations({
      ...baseOverview, unique_sessions: 200, total_events: 900,
      funnel: { page_view: 200, product_view: 30, demo_cta_click: 10, demo_started: 4, inquiry_submitted: 3 },
      by_product: [{ product_id: 'p1', name: 'Alpha', views: 60, demo_clicks: 10, demo_started: 2, inquiries: 0 }],
      by_event: { demo_started: 4 },
    });
    expect(r.some((x) => x.kind === 'measured' && x.type === 'funnel')).toBe(true);
    const hyps = r.filter((x) => x.kind === 'hypothesis');
    expect(hyps.length).toBeGreaterThanOrEqual(2);
    for (const h of hyps) {
      expect(Object.keys(h.evidence).length).toBeGreaterThan(1);
      expect(h.description.toLowerCase()).toMatch(/hypothesis|suggest|check|investigate/);
    }
  });
});

describe('catalog helpers', () => {
  it('exposes only public-bucket media URLs', () => {
    expect(publicMediaUrl('nexora-assets/private.png')).toBeNull();
    expect(publicMediaUrl(null)).toBeNull();
  });
  it('parses FAQ defensively', () => {
    expect(faqItems([{ q: 'A?', a: 'B' }, { q: 1 }, 'x', null])).toEqual([{ q: 'A?', a: 'B' }]);
  });
});
