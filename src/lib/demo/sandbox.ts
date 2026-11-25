/**
 * Synthetic sandbox data for NEXORA-hosted demos (ADR-007). Deterministic per session + module,
 * generated in memory — no database, no production data, no personal data.
 * Records are generic and clearly labelled as sample data; they do not claim real product features.
 */
function mulberry32(seed: number) {
  return () => {
    seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hash(s: string) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return h >>> 0;
}

const NAMES = ['Aurora', 'Bima', 'Cendana', 'Delta', 'Elang', 'Fajar', 'Garuda', 'Harmoni', 'Indah', 'Jati', 'Kenari', 'Lestari', 'Melati', 'Nusa', 'Orchid', 'Pelangi'];
export type SandboxLabels = { statuses: string[]; sample: string; kpiRecords: string; kpiActive: string; kpiSource: string; synthetic: string; note: string; fallback: string[] };
const DEFAULT_LABELS: SandboxLabels = {
  statuses: ['Active', 'Pending', 'In review', 'Completed', 'On hold'], sample: 'Sample', kpiRecords: 'Sample records', kpiActive: 'Active (sample)',
  kpiSource: 'Data source', synthetic: 'Synthetic', note: 'All values are randomly generated for this demo session and are not real business data.', fallback: ['Overview', 'Records', 'Reports'],
};

export type SandboxModule = { key: string; title: string };
export type SandboxView = {
  module: SandboxModule;
  generatedAt: string;
  kpis: { label: string; value: string }[];
  rows: { ref: string; name: string; status: string; updated: string; value: string }[];
  note: string;
};

export function sandboxModules(titles: string[], fallback: string[] = DEFAULT_LABELS.fallback): SandboxModule[] {
  const base = titles.length ? titles : fallback;
  return base.slice(0, 8).map((t, i) => ({ key: `m${i}`, title: t.slice(0, 60) }));
}

export function buildSandboxView(sessionId: string, module: SandboxModule, now = new Date(), L: SandboxLabels = DEFAULT_LABELS): SandboxView {
  const STATUSES = L.statuses;
  const rnd = mulberry32(hash(sessionId + module.key));
  const rows = Array.from({ length: 8 }, (_, i) => {
    const d = new Date(now.getTime() - Math.floor(rnd() * 14) * 86400000);
    return {
      ref: `SMP-${String(1000 + Math.floor(rnd() * 9000))}`,
      name: `${L.sample} ${NAMES[Math.floor(rnd() * NAMES.length)]} ${i + 1}`,
      status: STATUSES[Math.floor(rnd() * STATUSES.length)],
      updated: d.toISOString().slice(0, 10),
      value: `Rp ${(Math.floor(rnd() * 900) + 100) * 1000}`.replace(/\B(?=(\d{3})+(?!\d))/g, '.'),
    };
  });
  return {
    module,
    generatedAt: now.toISOString(),
    kpis: [
      { label: L.kpiRecords, value: String(rows.length) },
      { label: L.kpiActive, value: String(rows.filter((r) => r.status === STATUSES[0]).length) },
      { label: L.kpiSource, value: L.synthetic },
    ],
    rows,
    note: L.note,
  };
}
