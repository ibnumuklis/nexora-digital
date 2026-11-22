/**
 * Evidence-based recommendations (rules-v1). Each item cites the aggregate numbers it relies on.
 * "measured" = a fact computed from events; "hypothesis" = a suggested experiment, never a claim.
 */
export type Overview = {
  days: number;
  total_events: number;
  unique_sessions: number;
  by_event: Record<string, number>;
  by_product: { product_id: string; name: string; views: number; demo_clicks: number; demo_started: number; inquiries: number }[];
  by_source: Record<string, number>;
  funnel: { page_view: number; product_view: number; demo_cta_click: number; demo_started: number; inquiry_submitted: number };
  leads: { total: number; by_source: Record<string, number>; by_status: Record<string, number> };
};

export type Recommendation = {
  kind: 'measured' | 'hypothesis';
  type: string;
  title: string;
  description: string;
  product_id: string | null;
  confidence: number | null; // 0–1, only for hypotheses with enough sample
  evidence: Record<string, string | number>;
};

export const MIN_SESSIONS = 50;
export const MIN_PRODUCT_VIEWS = 30;

const pct = (a: number, b: number) => (b > 0 ? Math.round((a / b) * 1000) / 10 : 0);

export function dataSufficiency(o: Overview): { sufficient: boolean; reason: string } {
  if (o.unique_sessions < MIN_SESSIONS) return { sufficient: false, reason: `Only ${o.unique_sessions} consented sessions in the last ${o.days} days (minimum ${MIN_SESSIONS}). Keep collecting data before acting on trends.` };
  return { sufficient: true, reason: '' };
}

export function buildRecommendations(o: Overview): Recommendation[] {
  const out: Recommendation[] = [];
  const period = `${o.days}d`;
  const suff = dataSufficiency(o);
  if (!suff.sufficient) {
    out.push({ kind: 'measured', type: 'insufficient_data', title: 'Not enough data for recommendations yet', description: suff.reason, product_id: null, confidence: null, evidence: { period, unique_sessions: o.unique_sessions, total_events: o.total_events, minimum_sessions: MIN_SESSIONS } });
    return out;
  }

  const f = o.funnel;
  out.push({ kind: 'measured', type: 'funnel', title: 'Website funnel', description: `${f.page_view} sessions viewed a page, ${f.product_view} viewed a product (${pct(f.product_view, f.page_view)}%), ${f.demo_cta_click} clicked a demo CTA, ${f.inquiry_submitted} submitted an inquiry (${pct(f.inquiry_submitted, f.page_view)}% of sessions).`, product_id: null, confidence: null, evidence: { period, ...f } });

  if (f.page_view >= MIN_SESSIONS && pct(f.product_view, f.page_view) < 25) {
    out.push({ kind: 'hypothesis', type: 'discovery', title: 'Test making products easier to discover from the home page', description: `Only ${pct(f.product_view, f.page_view)}% of sessions reach a product page. Hypothesis: featuring products higher on the home page or adding a product finder increases product views. Validate with a before/after comparison.`, product_id: null, confidence: 0.4, evidence: { period, page_view_sessions: f.page_view, product_view_sessions: f.product_view, rate_pct: pct(f.product_view, f.page_view) } });
  }

  for (const p of o.by_product) {
    if (p.views < MIN_PRODUCT_VIEWS) continue;
    const inqRate = pct(p.inquiries, p.views);
    out.push({ kind: 'measured', type: 'product_performance', title: `${p.name}: ${p.views} views, ${p.inquiries} inquiries`, description: `Inquiry rate ${inqRate}% · demo clicks ${p.demo_clicks} · demos started ${p.demo_started}.`, product_id: p.product_id, confidence: null, evidence: { period, views: p.views, inquiries: p.inquiries, demo_clicks: p.demo_clicks, demo_started: p.demo_started, inquiry_rate_pct: inqRate } });
    if (p.inquiries === 0) {
      out.push({ kind: 'hypothesis', type: 'conversion', title: `Test clearer pricing/next steps on ${p.name}`, description: `${p.views} views produced no inquiries. Hypothesis: a visible “Request a quote” section with package levels and a short FAQ raises inquiries. This is a suggestion, not a measured cause.`, product_id: p.product_id, confidence: 0.35, evidence: { period, views: p.views, inquiries: 0 } });
    }
    if (p.demo_clicks > 0 && p.demo_started / p.demo_clicks < 0.5) {
      out.push({ kind: 'hypothesis', type: 'demo', title: `Investigate demo start drop-off on ${p.name}`, description: `${p.demo_clicks} demo clicks but ${p.demo_started} sessions started (${pct(p.demo_started, p.demo_clicks)}%). Check capacity/rate-limit errors in Demo Sessions before changing copy.`, product_id: p.product_id, confidence: 0.5, evidence: { period, demo_clicks: p.demo_clicks, demo_started: p.demo_started } });
    }
  }

  const started = o.by_event.demo_started ?? 0;
  if (started >= 20) {
    const completed = o.by_event.demo_completed ?? 0;
    const expired = o.by_event.demo_expired ?? 0;
    out.push({ kind: 'measured', type: 'demo_engagement', title: 'Demo session outcomes', description: `${started} demos started: ${completed} ended by the visitor, ${expired} expired (time or inactivity).`, product_id: null, confidence: null, evidence: { period, demo_started: started, demo_completed: completed, demo_expired: expired } });
  }

  const sources = Object.entries(o.leads.by_source).sort((a, b) => b[1] - a[1]);
  if (o.leads.total >= 10 && sources.length) {
    out.push({ kind: 'measured', type: 'lead_sources', title: 'Where leads come from', description: sources.map(([s, n]) => `${s}: ${n} (${pct(n, o.leads.total)}%)`).join(' · '), product_id: null, confidence: null, evidence: { period, total_leads: o.leads.total, ...Object.fromEntries(sources) } });
  }
  return out;
}
