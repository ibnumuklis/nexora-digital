import type { ReactNode } from 'react';

export function DataTable({ head, children, caption, empty }: { head: ReactNode[]; children: ReactNode; caption: string; empty?: ReactNode }) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-line bg-surface">
      <table className="w-full min-w-[640px] text-left text-sm">
        <caption className="sr-only">{caption}</caption>
        <thead className="bg-surface-2/70 text-[11px] uppercase tracking-wider text-muted">
          <tr>{head.map((h, i) => <th key={i} scope="col" className="px-4 py-3 font-semibold">{h}</th>)}</tr>
        </thead>
        <tbody className="divide-y divide-line">{children}</tbody>
      </table>
      {empty}
    </div>
  );
}

export function Td({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <td className={`px-4 py-3 align-top ${className}`}>{children}</td>;
}

export function StatCard({ label, value, note }: { label: string; value: ReactNode; note?: ReactNode }) {
  return (
    <div className="card p-5">
      <p className="text-xs font-medium text-muted">{label}</p>
      <p className="mt-2 font-display text-3xl font-semibold">{value}</p>
      {note && <p className="mt-1 text-xs text-muted">{note}</p>}
    </div>
  );
}

export function fmtDate(v: string | null | undefined, withTime = false) {
  if (!v) return '—';
  return new Date(v).toLocaleString('en-GB', withTime ? { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Asia/Jakarta' } : { dateStyle: 'medium', timeZone: 'Asia/Jakarta' });
}
