import type { Metadata } from 'next';
import { LegalPage } from '@/components/site/legal';

export const metadata: Metadata = { title: 'Demo disclaimer', alternates: { canonical: '/demo-disclaimer' } };

export default function DemoDisclaimerPage() {
  return (
    <LegalPage title="Demo disclaimer" updated="22 November 2026">
      <ul>
        <li>Demos use <strong>synthetic sample data</strong> and are isolated from any production system or customer data.</li>
        <li>Sessions are <strong>time-limited</strong> (default 7 minutes, configurable 5–10 minutes per product) and end after about 90 seconds of inactivity, with warnings at 60 and 30 seconds. Time is measured by our server; changing your device clock has no effect.</li>
        <li>Only one active demo session per visitor is allowed by default. Capacity is limited, so a demo may occasionally be unavailable.</li>
        <li>Administrative, billing, export and destructive functions are disabled in demos.</li>
        <li>Demo screens carry a “DEMO VERSION · NEXORA DIGITAL” watermark. Watermarks discourage misuse but <strong>cannot prevent</strong> screenshots, screen recording or browser inspection. Please do not reuse demo content.</li>
        <li>Do not enter real personal, financial or confidential information into a demo.</li>
        <li>A demo shows representative workflows; the delivered product configuration is agreed in writing.</li>
      </ul>
    </LegalPage>
  );
}
