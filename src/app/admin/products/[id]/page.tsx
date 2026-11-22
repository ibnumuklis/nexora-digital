import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, ExternalLink } from 'lucide-react';
import { requirePagePermission } from '@/lib/auth/session';
import { can } from '@/lib/auth/rbac';
import { formatPrice, publicMediaUrl, STATUS_LABELS, PRICING_MODEL_LABELS, faqItems } from '@/lib/catalog';
import { PageHeader, Badge, Alert } from '@/components/ui';
import { fmtDate } from '@/components/admin/table';
import { ActionForm, Checkbox, SelectInput, SubmitButton, TextArea, TextInput } from '@/components/admin/form';
import { addFeature, deleteFeature, deleteMedia, deletePricing, deleteProduct, saveDemoPolicy, savePricing, setPublication, setVerification, updateProduct, uploadMedia } from '../actions';

export const metadata = { title: 'Edit product' };

export default async function EditProduct({ params }: { params: Promise<{ id: string }> }) {
  const ctx = await requirePagePermission('catalog.read');
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/.test(id)) notFound();
  const db = ctx.supabase;
  const [{ data: p }, { data: categories }, { data: features }, { data: media }, { data: pricing }, { data: policy }] = await Promise.all([
    db.from('products').select('*').eq('id', id).maybeSingle(),
    db.from('product_categories').select('id,name').order('sort_order'),
    db.from('product_features').select('*').eq('product_id', id).order('sort_order'),
    db.from('product_media').select('*').eq('product_id', id).order('sort_order'),
    db.from('pricing_packages').select('*').eq('product_id', id).order('sort_order'),
    db.from('demo_policies').select('*').eq('product_id', id).maybeSingle(),
  ]);
  if (!p) notFound();
  const w = can(ctx.role, 'catalog.write');
  const m = can(ctx.role, 'catalog.media');
  const dm = can(ctx.role, 'demo.manage');
  const faqText = faqItems(p.faq).map((f) => `${f.q}\n${f.a}`).join('\n\n');

  return (
    <>
      <Link href="/admin/products" className="mb-4 inline-flex items-center gap-2 text-xs font-semibold text-muted hover:text-accent"><ArrowLeft size={14} aria-hidden /> Products</Link>
      <PageHeader eyebrow={STATUS_LABELS[p.status]} title={p.name}
        description={<span className="flex flex-wrap items-center gap-2"><Badge tone={p.publication_status === 'published' ? 'green' : 'amber'}>{p.publication_status}</Badge>{p.verified_at ? <Badge tone="green">verified {fmtDate(p.verified_at)}</Badge> : <Badge tone="amber">not verified</Badge>}{p.demo_enabled && <Badge tone="lime">demo on</Badge>}</span>}
        actions={p.publication_status === 'published' ? <Link href={`/products/${p.slug}`} target="_blank" className="inline-flex min-h-[44px] items-center gap-2 rounded-full border border-line px-4 text-sm font-semibold">View public page <ExternalLink size={14} aria-hidden /></Link> : undefined} />

      {!w && <Alert tone="info" className="mb-6">Read-only: your role can view products{m ? ' and manage features/media' : ''}, but only admins can edit product details.</Alert>}

      <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
        <div className="grid gap-6">
          <section className="card p-6" aria-labelledby="details-h">
            <h2 id="details-h" className="text-lg font-semibold">Details</h2>
            <p className="mt-1 text-xs text-muted">Only enter facts verified from source code or owner-approved material. No invented metrics, customers or certifications.</p>
            <fieldset disabled={!w} className="mt-5">
              <ActionForm action={updateProduct}>
                <input type="hidden" name="id" value={p.id} />
                <div className="grid gap-4 md:grid-cols-2">
                  <TextInput name="name" label="Name" required defaultValue={p.name} maxLength={120} />
                  <TextInput name="slug" label="Slug" required defaultValue={p.slug} maxLength={100} />
                  <SelectInput name="category_id" label="Category" defaultValue={p.category_id ?? ''} options={[{ value: '', label: 'None' }, ...(categories ?? []).map((c) => ({ value: c.id, label: c.name }))]} />
                  <SelectInput name="status" label="Development stage" defaultValue={p.status} options={Object.entries(STATUS_LABELS).map(([value, label]) => ({ value, label }))} />
                  <SelectInput name="pricing_model" label="Commercial model" defaultValue={p.pricing_model ?? ''} options={[{ value: '', label: 'Not set' }, ...Object.entries(PRICING_MODEL_LABELS).map(([value, label]) => ({ value, label }))]} />
                  <TextInput name="target_market" label="Target audience" defaultValue={p.target_market} maxLength={200} />
                </div>
                <TextInput name="short_description" label="Short description" defaultValue={p.short_description} maxLength={240} hint="Shown on cards (max 240)." />
                <TextArea name="problem_statement" label="Problem it solves" defaultValue={p.problem_statement} maxLength={1000} rows={3} />
                <TextArea name="description" label="Full description" defaultValue={p.description} maxLength={8000} rows={6} />
                <div className="grid gap-4 md:grid-cols-2">
                  <TextArea name="benefits" label="Benefits (one per line)" defaultValue={p.benefits.join('\n')} rows={5} />
                  <TextArea name="technology_stack" label="Verified technology stack (one per line)" defaultValue={p.technology_stack.join('\n')} rows={5} />
                </div>
                <TextArea name="faq" label="FAQ" hint="Question on one line, answer on the next; blank line between items." defaultValue={faqText} rows={6} />
                <div className="grid gap-4 md:grid-cols-3">
                  <TextInput name="application_url" label="Product URL" type="url" defaultValue={p.application_url} placeholder="https://" />
                  <TextInput name="demo_url" label="Demo URL (isolated)" type="url" defaultValue={p.demo_url} placeholder="https://" />
                  <TextInput name="demo_video_url" label="Demo video URL" type="url" defaultValue={p.demo_video_url} placeholder="https://" />
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <TextInput name="seo_title" label="SEO title" defaultValue={p.seo_title} maxLength={70} />
                  <TextInput name="seo_description" label="SEO description" defaultValue={p.seo_description} maxLength={170} />
                </div>
                <Checkbox name="is_featured" label="Feature on home page" defaultChecked={p.is_featured} />
                {w && <SubmitButton>Save details</SubmitButton>}
              </ActionForm>
            </fieldset>
          </section>

          <section className="card p-6" aria-labelledby="features-h">
            <h2 id="features-h" className="text-lg font-semibold">Features</h2>
            <ul className="mt-4 divide-y divide-line">
              {(features ?? []).map((f) => (
                <li key={f.id} className="flex items-start justify-between gap-4 py-3">
                  <div><p className="font-medium">{f.title}</p>{f.description && <p className="text-sm text-muted">{f.description}</p>}</div>
                  {w && <ActionForm action={deleteFeature} className="" confirm={`Remove feature “${f.title}”?`}><input type="hidden" name="id" value={f.id} /><SubmitButton variant="ghost" className="min-h-[36px] text-xs text-red-600">Remove</SubmitButton></ActionForm>}
                </li>
              ))}
              {!features?.length && <li className="py-3 text-sm text-muted">No features yet.</li>}
            </ul>
            {m && (
              <div className="mt-4 rounded-2xl bg-surface-2/50 p-4">
                <ActionForm action={addFeature} resetOnSuccess>
                  <input type="hidden" name="product_id" value={p.id} />
                  <div className="grid gap-4 md:grid-cols-[1fr_100px]"><TextInput name="title" label="Feature title" required maxLength={120} /><TextInput name="sort_order" label="Order" type="number" defaultValue={(features?.length ?? 0) * 10} /></div>
                  <TextArea name="description" label="Description" rows={2} maxLength={600} />
                  <SubmitButton variant="outline">Add feature</SubmitButton>
                </ActionForm>
              </div>
            )}
          </section>

          <section className="card p-6" aria-labelledby="media-h">
            <h2 id="media-h" className="text-lg font-semibold">Screenshots & media</h2>
            <p className="mt-1 text-xs text-muted">Only upload approved real screenshots. “Public” images go to the public bucket and become visible once the product is published.</p>
            <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {(media ?? []).map((md) => {
                const url = publicMediaUrl(md.storage_path);
                return (
                  <figure key={md.id} className="overflow-hidden rounded-2xl border border-line">
                    {url ? <img src={url} alt={md.alt_text ?? ''} className="aspect-video w-full object-cover" /> : <div className="grid aspect-video place-items-center bg-surface-2 text-xs text-muted">Private file</div>}
                    <figcaption className="flex items-center justify-between gap-2 p-3 text-xs"><span className="truncate">{md.alt_text}</span>{w && <ActionForm action={deleteMedia} className="" confirm="Delete this image permanently?"><input type="hidden" name="id" value={md.id} /><SubmitButton variant="ghost" className="min-h-[32px] text-xs text-red-600">Delete</SubmitButton></ActionForm>}</figcaption>
                  </figure>
                );
              })}
            </div>
            {m && (
              <div className="mt-4 rounded-2xl bg-surface-2/50 p-4">
                <ActionForm action={uploadMedia} resetOnSuccess>
                  <input type="hidden" name="product_id" value={p.id} />
                  <div className="grid gap-1.5"><label htmlFor="file" className="text-xs font-semibold">Image (PNG, JPG, WebP · max 5 MB)</label><input id="file" name="file" type="file" accept="image/png,image/jpeg,image/webp" required className="text-sm" /></div>
                  <TextInput name="alt_text" label="Alt text" required maxLength={200} />
                  <Checkbox name="is_public" label="Public (approved for the website)" defaultChecked />
                  <SubmitButton variant="outline">Upload</SubmitButton>
                </ActionForm>
              </div>
            )}
          </section>

          <section className="card p-6" aria-labelledby="pricing-h">
            <h2 id="pricing-h" className="text-lg font-semibold">Pricing packages</h2>
            <p className="mt-1 text-xs text-muted">Leave the amount empty for “price on request”. Never enter a price the owner has not approved.</p>
            <ul className="mt-4 grid gap-3">
              {(pricing ?? []).map((pk) => (
                <li key={pk.id} className="rounded-2xl border border-line p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2"><p className="font-semibold">{pk.name} <span className="text-xs font-normal text-muted">({pk.tier ?? '—'} · {pk.billing_period})</span></p><span className="text-sm">{formatPrice(pk.price_amount, pk.currency) ?? 'On request'} {pk.is_public ? <Badge tone="green">public</Badge> : <Badge>internal</Badge>}</span></div>
                  {w && <ActionForm action={deletePricing} className="mt-2" confirm={`Delete package “${pk.name}”?`}><input type="hidden" name="id" value={pk.id} /><SubmitButton variant="ghost" className="min-h-[32px] text-xs text-red-600">Delete</SubmitButton></ActionForm>}
                </li>
              ))}
            </ul>
            {w && (
              <div className="mt-4 rounded-2xl bg-surface-2/50 p-4">
                <ActionForm action={savePricing} resetOnSuccess>
                  <input type="hidden" name="product_id" value={p.id} />
                  <div className="grid gap-4 md:grid-cols-3">
                    <TextInput name="name" label="Package name" required maxLength={80} />
                    <SelectInput name="tier" label="Tier" options={['starter', 'professional', 'enterprise', 'custom'].map((v) => ({ value: v, label: v[0].toUpperCase() + v.slice(1) }))} />
                    <SelectInput name="billing_period" label="Billing" options={[{ value: 'custom', label: 'Custom' }, { value: 'monthly', label: 'Monthly' }, { value: 'yearly', label: 'Yearly' }, { value: 'one_time', label: 'One-time' }]} />
                    <TextInput name="price_amount" label="Amount" hint="Empty = on request" />
                    <SelectInput name="currency" label="Currency" options={[{ value: 'IDR', label: 'IDR' }, { value: 'USD', label: 'USD' }]} />
                    <TextInput name="sort_order" label="Order" type="number" defaultValue={0} />
                  </div>
                  <TextArea name="description" label="Description" rows={2} maxLength={500} />
                  <Checkbox name="is_public" label="Show on website" />
                  <SubmitButton variant="outline">Add package</SubmitButton>
                </ActionForm>
              </div>
            )}
          </section>
        </div>

        <aside className="grid h-fit gap-6">
          <section className="card p-6">
            <h2 className="font-semibold">1 · Verification</h2>
            <p className="mt-1 text-xs leading-5 text-muted">Confirms facts, screenshots, URLs and readiness were checked against owner-approved sources.</p>
            {w && (
              <ActionForm action={setVerification} className="mt-4 grid gap-3">
                <input type="hidden" name="id" value={p.id} />
                <input type="hidden" name="verified" value={p.verified_at ? 'false' : 'true'} />
                {!p.verified_at && <Checkbox name="attest" label="I verified this product's facts, assets and URLs." />}
                <SubmitButton variant={p.verified_at ? 'outline' : 'primary'}>{p.verified_at ? 'Remove verification' : 'Mark verified'}</SubmitButton>
              </ActionForm>
            )}
          </section>
          <section className="card p-6">
            <h2 className="font-semibold">2 · Publication</h2>
            {w && (
              <ActionForm action={setPublication} className="mt-4 grid gap-3" confirm="Change the public visibility of this product?">
                <input type="hidden" name="id" value={p.id} />
                <SelectInput name="publication_status" label="Visibility" defaultValue={p.publication_status} options={[{ value: 'draft', label: 'Draft (hidden)' }, { value: 'published', label: 'Published (public)' }, { value: 'archived', label: 'Archived (hidden)' }]} />
                <SubmitButton>Apply</SubmitButton>
              </ActionForm>
            )}
            {!p.verified_at && <p className="mt-3 text-xs text-amber-700 dark:text-amber-200">Publishing is blocked until the product is verified.</p>}
          </section>
          <section className="card p-6">
            <h2 className="font-semibold">3 · Demo policy</h2>
            <p className="mt-1 text-xs leading-5 text-muted">Demos run in the NEXORA sandbox (synthetic data) or embed an isolated, allowlisted demo deployment. Never a production system.</p>
            <fieldset disabled={!dm} className="mt-4">
              <ActionForm action={saveDemoPolicy} className="grid gap-3">
                <input type="hidden" name="product_id" value={p.id} />
                <Checkbox name="enabled" label="Demo enabled" defaultChecked={!!policy?.enabled} />
                <div className="grid grid-cols-2 gap-3">
                  <TextInput name="duration_minutes" label="Minutes (5–10)" type="number" min={5} max={10} defaultValue={policy?.duration_minutes ?? 7} />
                  <TextInput name="idle_timeout_seconds" label="Idle sec" type="number" min={30} max={600} defaultValue={policy?.idle_timeout_seconds ?? 90} />
                  <TextInput name="max_active_sessions" label="Per visitor" type="number" min={1} max={3} defaultValue={policy?.max_active_sessions ?? 1} />
                  <TextInput name="max_concurrent_sessions" label="Capacity" type="number" min={1} max={500} defaultValue={policy?.max_concurrent_sessions ?? 10} />
                </div>
                <TextInput name="sessions_per_visitor_per_hour" label="Starts per visitor / hour" type="number" min={1} max={60} defaultValue={policy?.sessions_per_visitor_per_hour ?? 6} />
                <SelectInput name="mode" label="Mode" defaultValue={policy?.mode ?? 'sandbox'} options={[{ value: 'sandbox', label: 'NEXORA sandbox (synthetic)' }, { value: 'iframe', label: 'Isolated demo deployment (iframe)' }]} />
                <TextInput name="iframe_url" label="Iframe URL" type="url" defaultValue={policy?.iframe_url} placeholder="https://demo.example.com" hint="Host must be in DEMO_IFRAME_HOSTS." />
                <TextInput name="watermark_text" label="Watermark" defaultValue={policy?.watermark_text ?? 'DEMO VERSION · NEXORA DIGITAL'} maxLength={80} />
                {dm && <SubmitButton>Save demo policy</SubmitButton>}
              </ActionForm>
            </fieldset>
          </section>
          {w && (
            <section className="card border-red-200 p-6 dark:border-red-400/30">
              <h2 className="font-semibold text-red-700 dark:text-red-300">Delete product</h2>
              <p className="mt-1 text-xs text-muted">Permanently removes the product, its features, media records, pricing and demo policy. Unpublish first.</p>
              <ActionForm action={deleteProduct} className="mt-4 grid gap-3" confirm="Permanently delete this product? This cannot be undone.">
                <input type="hidden" name="id" value={p.id} />
                <TextInput name="confirm_slug" label={`Type “${p.slug}” to confirm`} required />
                <SubmitButton variant="danger">Delete permanently</SubmitButton>
              </ActionForm>
            </section>
          )}
        </aside>
      </div>
    </>
  );
}
