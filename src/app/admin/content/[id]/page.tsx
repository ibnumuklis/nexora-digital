import Link from 'next/link';
import { notFound } from 'next/navigation';
import { AlertTriangle, ArrowLeft, Download } from 'lucide-react';
import { requirePagePermission } from '@/lib/auth/session';
import { can } from '@/lib/auth/rbac';
import { IMAGE_FORMATS, TEMPLATES, VIDEO_FORMATS, VIDEO_DURATIONS } from '@/lib/content/formats';
import { PLATFORMS } from '@/lib/content/copy';
import { PageHeader, Badge, Alert } from '@/components/ui';
import { fmtDate } from '@/components/admin/table';
import { ActionForm, SelectInput, SubmitButton, TextArea, TextInput } from '@/components/admin/form';
import { addCalendarEntry, deleteAsset, exportImage, generateProjectCopy, queueVideo, saveCaption, saveDesign, setProjectStatus } from '../actions';

export const metadata = { title: 'Content project' };
type Copy = { caption?: string; hashtags?: string[]; warnings?: string[]; sources?: string[]; generator?: string; generated_at?: string };
type Design = { template?: string; theme?: string; headline?: string; subline?: string; bullets?: string[]; cta?: string; media_id?: string; slide_index?: number; slide_total?: number };

export default async function ContentProject({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ format?: string }> }) {
  const ctx = await requirePagePermission('content.read');
  const { id } = await params;
  const sp = await searchParams;
  if (!/^[0-9a-f-]{36}$/.test(id)) notFound();
  const db = ctx.supabase;
  const { data: p } = await db.from('content_projects').select('*,product:products(id,name,publication_status,verified_at)').eq('id', id).maybeSingle();
  if (!p) notFound();
  const product = p.product as { id: string; name: string; publication_status: string; verified_at: string | null } | null;
  const [{ data: media }, { data: assets }] = await Promise.all([
    product ? db.from('product_media').select('id,alt_text').eq('product_id', product.id).eq('media_type', 'image') : Promise.resolve({ data: [] as { id: string; alt_text: string | null }[] }),
    db.from('content_assets').select('id,title,mime_type,width,height,duration_seconds,file_size_bytes,status,created_at').eq('content_project_id', id).order('created_at', { ascending: false }),
  ]);
  const copy = (p.copy_draft ?? {}) as Copy;
  const design = ((p.brief as { design?: Design } | null)?.design ?? null) as Design | null;
  const w = can(ctx.role, 'content.write');
  const approve = can(ctx.role, 'content.approve');
  const previewFormat = IMAGE_FORMATS.find((f) => f.key === sp.format)?.key ?? 'portrait';
  const version = encodeURIComponent(p.updated_at);

  return (
    <>
      <Link href="/admin/content" className="mb-4 inline-flex items-center gap-2 text-xs font-semibold text-muted hover:text-accent"><ArrowLeft size={14} aria-hidden /> Content Studio</Link>
      <PageHeader eyebrow={`${p.content_type.replace('_', ' ')} · ${p.channel ?? ''}`} title={p.title}
        description={<span className="flex flex-wrap gap-2"><Badge tone={p.status === 'approved' ? 'green' : p.status === 'in_review' ? 'amber' : 'neutral'}>{p.status.replace('_', ' ')}</Badge>{p.approved_at && <Badge tone="green">approved {fmtDate(p.approved_at)}</Badge>}{product && <Badge>{product.name}</Badge>}</span>}
        actions={<div className="flex flex-wrap gap-2">
          {w && p.status === 'draft' && <ActionForm action={setProjectStatus} className=""><input type="hidden" name="id" value={p.id} /><input type="hidden" name="to" value="in_review" /><SubmitButton variant="outline">Submit for review</SubmitButton></ActionForm>}
          {approve && p.status === 'in_review' && <ActionForm action={setProjectStatus} className="" confirm="Approve this content? Confirm all facts are verified."><input type="hidden" name="id" value={p.id} /><input type="hidden" name="to" value="approved" /><SubmitButton>Approve</SubmitButton></ActionForm>}
          {w && p.status !== 'draft' && p.status !== 'archived' && <ActionForm action={setProjectStatus} className=""><input type="hidden" name="id" value={p.id} /><input type="hidden" name="to" value="draft" /><SubmitButton variant="ghost">Back to draft</SubmitButton></ActionForm>}
        </div>} />

      {product && (!product.verified_at || product.publication_status !== 'published') && (
        <Alert tone="warning" className="mb-6" title="Product not verified/published">Content about unverified products must stay internal. Do not publish externally until the product is verified.</Alert>
      )}

      <div className="grid gap-6 xl:grid-cols-[1fr_420px]">
        <div className="grid gap-6">
          <section className="card p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="font-semibold">1 · Copy draft</h2>
              {w && <ActionForm action={generateProjectCopy} className="flex items-end gap-2"><input type="hidden" name="id" value={p.id} /><SelectInput name="language" label="Language" options={[{ value: 'en', label: 'English' }, { value: 'id', label: 'Bahasa Indonesia' }]} /><SubmitButton variant="outline">Generate from product facts</SubmitButton></ActionForm>}
            </div>
            {copy.generator ? <p className="mt-2 text-xs text-muted">Generator: {copy.generator} · sources: {copy.sources?.join(', ')} · {fmtDate(copy.generated_at, true)}</p> : null}
            {copy.warnings?.length ? <Alert tone="warning" className="mt-4" title="Review needed"><ul className="list-disc pl-5">{copy.warnings.map((x) => <li key={x}>{x}</li>)}</ul></Alert> : null}
            <fieldset disabled={!w} className="mt-4">
              <ActionForm action={saveCaption}>
                <input type="hidden" name="id" value={p.id} />
                <TextArea name="caption" label="Caption" defaultValue={copy.caption ?? ''} rows={8} maxLength={3000} />
                <TextInput name="hashtags" label="Hashtags" defaultValue={(copy.hashtags ?? []).join(' ')} maxLength={400} />
                {w && <SubmitButton variant="outline">Save caption</SubmitButton>}
              </ActionForm>
            </fieldset>
          </section>

          <section className="card p-6">
            <h2 className="font-semibold">2 · Design (editable template)</h2>
            <fieldset disabled={!w} className="mt-4">
              <ActionForm action={saveDesign}>
                <input type="hidden" name="id" value={p.id} />
                <div className="grid gap-4 sm:grid-cols-3">
                  <SelectInput name="template" label="Template" defaultValue={design?.template ?? 'product-launch'} options={TEMPLATES.map((t) => ({ value: t.key, label: t.label }))} />
                  <SelectInput name="theme" label="Theme" defaultValue={design?.theme ?? 'forest'} options={[{ value: 'forest', label: 'Deep Forest' }, { value: 'light', label: 'Off White' }, { value: 'lime', label: 'Lime' }]} />
                  <SelectInput name="media_id" label="Screenshot" defaultValue={design?.media_id ?? ''} options={[{ value: '', label: 'None' }, ...(media ?? []).map((m) => ({ value: m.id, label: m.alt_text ?? m.id.slice(0, 8) }))]} />
                </div>
                <TextInput name="headline" label="Headline" required defaultValue={design?.headline ?? ''} maxLength={120} />
                <TextInput name="subline" label="Subline" defaultValue={design?.subline ?? ''} maxLength={220} />
                <TextArea name="bullets" label="Bullets (max 4, one per line)" defaultValue={(design?.bullets ?? []).join('\n')} rows={4} maxLength={400} />
                <div className="grid gap-4 sm:grid-cols-3">
                  <TextInput name="cta" label="CTA" defaultValue={design?.cta ?? ''} maxLength={40} />
                  <TextInput name="slide_index" label="Slide #" type="number" defaultValue={design?.slide_index ?? ''} hint="Carousel only" />
                  <TextInput name="slide_total" label="of" type="number" defaultValue={design?.slide_total ?? ''} />
                </div>
                {w && <SubmitButton>Save design</SubmitButton>}
              </ActionForm>
            </fieldset>
          </section>

          <section className="card p-6">
            <h2 className="font-semibold">3 · Video infographic (MP4)</h2>
            <p className="mt-1 text-xs text-muted">Storyboard from verified product facts → rendered by the background worker with FFmpeg (H.264). Output is verified (codec, size, duration) before it can be downloaded.</p>
            {w && (
              <ActionForm action={queueVideo} className="mt-4 grid gap-3 sm:grid-cols-4 sm:items-end">
                <input type="hidden" name="id" value={p.id} />
                <SelectInput name="format_key" label="Aspect" options={VIDEO_FORMATS.map((f) => ({ value: f.key, label: f.label }))} />
                <SelectInput name="duration" label="Duration" options={VIDEO_DURATIONS.map((d) => ({ value: String(d), label: `${d} seconds` }))} />
                <SelectInput name="theme" label="Theme" options={[{ value: 'forest', label: 'Deep Forest' }, { value: 'light', label: 'Off White' }, { value: 'lime', label: 'Lime' }]} />
                <SubmitButton variant="outline">Queue video</SubmitButton>
              </ActionForm>
            )}
          </section>

          <section className="card p-6">
            <h2 className="font-semibold">Assets</h2>
            {assets?.length ? (
              <ul className="mt-4 divide-y divide-line">{assets.map((a) => (
                <li key={a.id} className="flex flex-wrap items-center justify-between gap-2 py-3 text-sm">
                  <span>{a.mime_type} · {a.width}×{a.height}{a.duration_seconds ? ` · ${a.duration_seconds}s` : ''} · {Math.round((a.file_size_bytes ?? 0) / 1024)} KB <span className="text-xs text-muted">· {fmtDate(a.created_at, true)}</span></span>
                  <span className="flex items-center gap-3">
                    {a.status === 'ready' ? <a href={`/api/admin/assets/${a.id}`} className="inline-flex items-center gap-1 text-xs font-semibold text-accent"><Download size={13} aria-hidden /> Download</a> : <span className="text-xs text-muted">{a.status}</span>}
                    {w && <ActionForm action={deleteAsset} className="" confirm="Delete this asset file?"><input type="hidden" name="id" value={a.id} /><SubmitButton variant="ghost" className="min-h-[30px] text-xs text-red-600">Delete</SubmitButton></ActionForm>}
                  </span>
                </li>
              ))}</ul>
            ) : <p className="mt-3 text-sm text-muted">No exports yet.</p>}
          </section>

          {p.status === 'approved' && w && (
            <section className="card p-6">
              <h2 className="font-semibold">4 · Schedule</h2>
              <ActionForm action={addCalendarEntry} className="mt-4 grid gap-3 sm:grid-cols-3 sm:items-end" resetOnSuccess>
                <input type="hidden" name="content_project_id" value={p.id} />
                <SelectInput name="channel" label="Channel" defaultValue={p.channel ?? 'instagram'} options={PLATFORMS.map((v) => ({ value: v, label: v }))} />
                <TextInput name="scheduled_at" label="Publish at" type="datetime-local" required />
                <input type="hidden" name="caption" value={copy.caption ?? ''} />
                <SubmitButton variant="outline">Add to calendar</SubmitButton>
              </ActionForm>
            </section>
          )}
        </div>

        <aside className="grid h-fit gap-4 xl:sticky xl:top-6">
          <section className="card p-5">
            <div className="flex items-center justify-between"><h2 className="font-semibold">Preview</h2>
              <nav aria-label="Preview format" className="flex flex-wrap gap-1">{IMAGE_FORMATS.map((f) => <Link key={f.key} href={`?format=${f.key}`} scroll={false} className={`rounded-full px-2 py-1 text-[10px] ${previewFormat === f.key ? 'bg-forest text-white dark:bg-lime dark:text-forest' : 'border border-line'}`}>{f.width}×{f.height}</Link>)}</nav>
            </div>
            {design ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={`/api/admin/content/preview?project=${p.id}&format=${previewFormat}&v=${version}`} alt="Design preview" className="mt-4 w-full rounded-xl border border-line" />
            ) : <p className="mt-4 flex items-center gap-2 text-sm text-muted"><AlertTriangle size={14} aria-hidden /> Generate copy or save a design to see a preview.</p>}
          </section>
          {design && w && (
            <section className="card p-5">
              <h2 className="font-semibold">Export image</h2>
              <ActionForm action={exportImage} className="mt-3 grid gap-3">
                <input type="hidden" name="id" value={p.id} />
                <SelectInput name="format_key" label="Size" defaultValue={previewFormat} options={IMAGE_FORMATS.map((f) => ({ value: f.key, label: f.label }))} />
                <SelectInput name="file_type" label="File type" options={[{ value: 'png', label: 'PNG' }, { value: 'jpg', label: 'JPG' }]} />
                <SubmitButton>Render & save</SubmitButton>
              </ActionForm>
            </section>
          )}
        </aside>
      </div>
    </>
  );
}
