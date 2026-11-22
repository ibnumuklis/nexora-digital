import { Alert } from '@/components/ui';

export function LegalPage({ title, updated, children }: { title: string; updated: string; children: React.ReactNode }) {
  return (
    <article className="section-pad">
      <div className="container-shell max-w-3xl">
        <p className="eyebrow">Legal</p>
        <h1 className="mt-3 text-4xl font-semibold">{title}</h1>
        <p className="mt-3 text-sm text-muted">Last updated: {updated}</p>
        <Alert tone="warning" className="mt-6" title="Draft — pending owner and legal review">
          This text describes how the NEXORA platform actually processes data. Legal entity details, governing law and contact address must be confirmed by NEXORA DIGITAL before public launch.
        </Alert>
        <div className="prose-nexora mt-8">{children}</div>
      </div>
    </article>
  );
}
