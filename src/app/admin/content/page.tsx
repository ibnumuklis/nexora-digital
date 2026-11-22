import Link from 'next/link';
import { Wand2, Download, Film } from 'lucide-react';
import { requirePagePermission } from '@/lib/auth/session';
import { can } from '@/lib/auth/rbac';
import { OBJECTIVES, PLATFORMS, TONES } from '@/lib/content/copy';
import { aiStatus } from '@/lib/content/ai-provider';
import { PageHeader, Badge, EmptyState, Alert } from '@/components/ui';
import { DataTable, Td, fmtDate } from '@/components/admin/table';
import { ActionForm, SelectInput, SubmitButton, TextInput } from '@/components/admin/form';
import { createProject, setJobStatus } from './actions';

export const metadata = { title: 'Content Studio' };
const label = (s: string) => s.replace(/_/g, ' ').replace(/^\w/, (c) => c.toUpperCase());

export default async function ContentStudio() {
  const ctx = await requirePagePermission('content.read');
  const db = ctx.supabase;
  const [{ data: projects }, { data: products }, { data: jobs }, { data: assets }, { data: calendar }] = await Promise.all([
    db.from('content_projects').select('id,title,content_type,status,channel,updated_at,product:products(name)').order('updated_at', { ascending: false }).limit(100),
    db.from('products').select('id,name').order('name'),
    db.from('render_jobs').select('id,content_project_id,job_type,output_format,width,height,duration_seconds,status,progress,attempts,max_attempts,error,created_at,output_asset_id').order('created_at', { ascending: false }).limit(30),
    db.from('content_assets').select('id,title,mime_type,width,height,duration_seconds,file_size_bytes,status,created_at').eq('status', 'ready').order('created_at', { ascending: false }).limit(40),
    db.from('content_calendar').select('id,channel,scheduled_at,status,project:content_projects(title)').gte('scheduled_at', new Date(Date.now() - 86400000).toISOString()).order('scheduled_at').limit(20),
  ]);
  const w = can(ctx.role, 'content.write');
  const ai = aiStatus();

  return (
    <>
      <PageHeader eyebrow="AI Content Studio" title="Content projects" description="Product → brief → copy draft → editable design → verified PNG/JPG/MP4 → review → approval → calendar. Every output is a draft until approved." />
      <Alert tone={ai.enabled ? 'success' : 'info'} className="mb-6" title={ai.enabled ? 'AI provider active' : 'AI provider not enabled'}>{ai.reason}</Alert>
      <div className="grid gap-6 xl:grid-cols-[1fr_340px]">
        <div className="grid gap-8">
          {projects?.length ? (
            <DataTable caption="Content projects" head={['Project', 'Product', 'Type', 'Channel', 'Status', 'Updated']}>
              {projects.map((p) => (
                <tr key={p.id} className="hover:bg-surface-2/40">
                  <Td><Link href={`/admin/content/${p.id}`} className="font-semibold hover:text-accent">{p.title}</Link></Td>
                  <Td>{(p.product as { name: string } | null)?.name ?? '—'}</Td>
                  <Td className="text-xs">{label(p.content_type)}</Td><Td className="text-xs">{p.channel ? label(p.channel) : '—'}</Td>
                  <Td><Badge tone={p.status === 'approved' ? 'green' : p.status === 'in_review' ? 'amber' : 'neutral'}>{label(p.status)}</Badge></Td>
                  <Td className="text-xs text-muted">{fmtDate(p.updated_at)}</Td>
                </tr>
              ))}
            </DataTable>
          ) : <EmptyState icon={<Wand2 />} title="No content projects yet">Create one from a product to generate copy, designs and videos.</EmptyState>}

          <section>
            <h2 className="mb-3 flex items-center gap-2 font-semibold"><Film size={16} aria-hidden /> Render jobs</h2>
            {jobs?.length ? (
              <DataTable caption="Render jobs" head={['Job', 'Output', 'Status', 'Progress', 'Created', '']}>
                {jobs.map((j) => (
                  <tr key={j.id}>
                    <Td className="font-mono text-xs">{j.id.slice(0, 8)}</Td>
                    <Td className="text-xs">{j.output_format.toUpperCase()} {j.width}×{j.height}{j.duration_seconds ? ` · ${j.duration_seconds}s` : ''}</Td>
                    <Td><Badge tone={j.status === 'completed' ? 'green' : j.status === 'failed' ? 'red' : j.status === 'processing' ? 'blue' : 'neutral'}>{j.status}</Badge>{j.error && <p className="mt-1 max-w-xs text-[11px] text-red-600">{j.error}</p>}</Td>
                    <Td><div className="h-2 w-28 overflow-hidden rounded-full bg-surface-2" role="progressbar" aria-valuenow={j.progress} aria-valuemin={0} aria-valuemax={100}><div className="h-full bg-emerald" style={{ width: `${j.progress}%` }} /></div><p className="mt-1 text-[11px] text-muted">{j.progress}% · attempt {j.attempts}/{j.max_attempts}</p></Td>
                    <Td className="text-xs text-muted">{fmtDate(j.created_at, true)}</Td>
                    <Td>
                      {j.status === 'completed' && j.output_asset_id && <a href={`/api/admin/assets/${j.output_asset_id}`} className="inline-flex items-center gap-1 text-xs font-semibold text-accent"><Download size={13} aria-hidden /> Download</a>}
                      {w && ['queued', 'processing'].includes(j.status) && <ActionForm action={setJobStatus} className="" confirm="Cancel this render job?"><input type="hidden" name="id" value={j.id} /><input type="hidden" name="to" value="canceled" /><SubmitButton variant="ghost" className="min-h-[30px] text-xs">Cancel</SubmitButton></ActionForm>}
                      {w && ['failed', 'canceled'].includes(j.status) && j.attempts < j.max_attempts && <ActionForm action={setJobStatus} className=""><input type="hidden" name="id" value={j.id} /><input type="hidden" name="to" value="queued" /><SubmitButton variant="ghost" className="min-h-[30px] text-xs">Retry</SubmitButton></ActionForm>}
                    </Td>
                  </tr>
                ))}
              </DataTable>
            ) : <p className="text-sm text-muted">No render jobs yet. Videos are rendered by the background worker (see docs/RENDER_WORKER.md).</p>}
          </section>

          <section>
            <h2 className="mb-3 font-semibold">Asset library</h2>
            {assets?.length ? (
              <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {assets.map((a) => (
                  <li key={a.id} className="card p-4 text-sm">
                    <p className="font-medium">{a.title}</p>
                    <p className="mt-1 text-xs text-muted">{a.mime_type} · {a.width}×{a.height}{a.duration_seconds ? ` · ${a.duration_seconds}s` : ''} · {Math.round((a.file_size_bytes ?? 0) / 1024)} KB</p>
                    <a href={`/api/admin/assets/${a.id}`} className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-accent"><Download size={13} aria-hidden /> Download</a>
                  </li>
                ))}
              </ul>
            ) : <p className="text-sm text-muted">Verified exports appear here.</p>}
          </section>

          <section>
            <h2 className="mb-3 font-semibold">Upcoming calendar</h2>
            {calendar?.length ? (
              <ul className="divide-y divide-line rounded-2xl border border-line bg-surface">{calendar.map((c) => <li key={c.id} className="flex justify-between p-4 text-sm"><span>{(c.project as { title: string } | null)?.title} · {label(c.channel)}</span><span className="text-xs text-muted">{fmtDate(c.scheduled_at, true)} · {c.status}</span></li>)}</ul>
            ) : <p className="text-sm text-muted">Nothing scheduled. Approved projects can be added to the calendar.</p>}
          </section>
        </div>
        {w && (
          <aside className="card h-fit p-6"><h2 className="font-semibold">New content project</h2>
            <div className="mt-4"><ActionForm action={createProject}>
              <TextInput name="title" label="Title" required maxLength={160} />
              <SelectInput name="product_id" label="Product" options={[{ value: '', label: 'Select a product' }, ...(products ?? []).map((p) => ({ value: p.id, label: p.name }))]} />
              <SelectInput name="content_type" label="Content type" options={['social_post', 'carousel', 'story', 'video', 'article_promo'].map((v) => ({ value: v, label: label(v) }))} />
              <SelectInput name="objective" label="Objective" options={OBJECTIVES.map((v) => ({ value: v, label: label(v) }))} />
              <SelectInput name="channel" label="Platform" options={PLATFORMS.map((v) => ({ value: v, label: label(v) }))} />
              <SelectInput name="tone" label="Tone" options={TONES.map((v) => ({ value: v, label: label(v) }))} />
              <TextInput name="audience" label="Audience" maxLength={160} hint="e.g. restaurant owners in Makassar" />
              <SubmitButton>Create project</SubmitButton>
            </ActionForm></div>
          </aside>
        )}
      </div>
    </>
  );
}
