import 'server-only';
import type { CopyBrief, CopyDraft, ProductFacts } from './copy';

/**
 * Provider-agnostic AI interface. DISABLED until the owner selects a provider and approves a budget
 * (docs/OWNER_INPUT_CHECKLIST.md). Implementations must:
 *  - receive only verified product facts (never free-form web content),
 *  - return structured JSON validated before use,
 *  - record provider, model and estimated cost on the content project,
 *  - never mark output as approved (human approval is required).
 */
export interface AiCopyProvider {
  readonly id: string;
  readonly model: string;
  generateCopy(facts: ProductFacts, brief: CopyBrief): Promise<CopyDraft & { costEstimateUsd: number | null }>;
}

export function getAiProvider(): AiCopyProvider | null {
  const enabled = process.env.AI_PROVIDER_ENABLED === 'true' && !!process.env.AI_PROVIDER && !!process.env.AI_PROVIDER_API_KEY;
  if (!enabled) return null;
  // Intentionally no concrete provider bundled: add an adapter here after owner approval.
  return null;
}

export function aiStatus(): { enabled: boolean; reason: string } {
  return getAiProvider()
    ? { enabled: true, reason: 'AI provider configured' }
    : { enabled: false, reason: 'No AI provider approved yet. Copy suggestions use the deterministic rules-v1 generator from verified product facts.' };
}
