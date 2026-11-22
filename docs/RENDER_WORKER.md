# Render worker (MP4 video & queued images)

The web app never renders video inside a request. Staff queue jobs in **Admin → Content Studio**; a separate worker process claims them from `public.render_jobs`, renders, verifies and uploads.

## What it produces
- **MP4**: H.264 (`libx264`, `yuv420p`, 30 fps) + silent AAC track, `+faststart`, sizes 1080×1920 (9:16), 1080×1080 (1:1), 1920×1080 (16:9), durations 15/30/60 s.
- Storyboard built only from verified product fields (`buildStoryboard`); scenes rendered with the same template engine as image exports.
- Every output is checked with `ffprobe` (codec, pixel format, size, duration ±0.2 s, MP4 container). A mismatch fails the job — no fake or renamed files.
- `complete_render_job()` re-checks MIME and dimensions in the database before creating the `content_assets` row; downloads are served only via 60-second signed URLs.

Measured locally (2 vCPU): 15 s video ≈ 7–8 s render, 60 s 16:9 ≈ 20 s.

## Requirements
- Node 22, `ffmpeg` + `ffprobe` on PATH (or `FFMPEG_PATH` / `FFPROBE_PATH`).
- `npm ci` in the repository.
- Environment (worker host only — never the web app or browser):
  - `SUPABASE_URL=https://ijkazeukjooauwsvwtiq.supabase.co`
  - `SUPABASE_SERVICE_ROLE_KEY=…` (secret; set in the host's secret manager)
  - optional `WORKER_POLL_MS=5000`

## Run
```bash
npm run worker                       # queue mode (polls render_jobs)
npm run worker -- --local job.json --out ./worker/out   # offline test, no Supabase needed
```
Example `job.json` for local mode: see `.tmp`-style sample in `tests/unit/content.test.ts` or:
```json
{"id":"local-1","job_type":"video","output_format":"mp4","width":1080,"height":1920,"duration_seconds":15,"template_key":"storyboard-v1",
 "input":{"theme":"forest","cta":"Book a consultation","facts":{"name":"Sample","short_description":"…","features":["A","B"]}}}
```

## Reliability
- `claim_render_job` uses `FOR UPDATE SKIP LOCKED` (safe with several workers) and re-queues jobs whose lock is older than 15 minutes.
- Failures re-queue automatically until `max_attempts` (default 3), then the job is `failed` with a safe error message. Staff can cancel or retry within limits; they cannot mark a job completed (DB trigger).
- Hosting options (owner decision & budget): a small VM/container (Railway, Render, Fly.io, a VPS) with ffmpeg. Vercel serverless functions are **not** suitable for video rendering.
