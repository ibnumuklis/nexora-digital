import type { Metadata } from 'next';
import { LegalPage } from '@/components/site/legal';

export const metadata: Metadata = { title: 'Demo disclaimer', alternates: { canonical: '/demo-disclaimer' } };

export default function DemoDisclaimerPage() {
  return (
    <LegalPage title="Demo disclaimer">
      <ul>
        <li><strong>Sample data only.</strong> Demos use synthetic, randomly generated data and are isolated from every production system and customer database.</li>
        <li><strong>Illustrative workspace.</strong> The NEXORA sandbox shows representative modules and workflows of a product. It is not the full product; the final configuration, features and integrations are agreed in a written proposal.</li>
        <li><strong>Time-limited.</strong> A session lasts 7 minutes by default (configurable between 5 and 10 minutes per product) and ends after about 90 seconds of inactivity, with warnings at 60 and 30 seconds. Time is measured on our server — changing your device clock has no effect.</li>
        <li><strong>Fair use.</strong> One active demo session per visitor; capacity and the number of sessions per hour are limited, so a demo may occasionally be unavailable.</li>
        <li><strong>Restricted functions.</strong> Administrative, billing, export and destructive functions are disabled.</li>
        <li><strong>Watermark.</strong> Demo screens show “DEMO VERSION · NEXORA DIGITAL”, a session reference and a timestamp. Watermarks discourage misuse but <strong>cannot prevent</strong> screenshots, screen recording or browser inspection. Demo content may not be copied or reused.</li>
        <li><strong>No personal data.</strong> Do not enter real personal, financial or confidential information into a demo.</li>
        <li><strong>Availability.</strong> Demos are provided “as is” and may be changed, reset or withdrawn without notice.</li>
      </ul>
    </LegalPage>
  );
}
