export const LEAD_STAGES = ['new', 'contacted', 'qualified', 'negotiation', 'proposal_sent', 'won', 'lost'] as const;
export type LeadStage = (typeof LEAD_STAGES)[number];
export const STAGE_LABELS: Record<LeadStage, string> = { new: 'New', contacted: 'Contacted', qualified: 'Qualified', negotiation: 'Negotiation', proposal_sent: 'Proposal sent', won: 'Won', lost: 'Lost' };

export const QUOTE_STATUSES = ['new', 'qualifying', 'drafting', 'pending_approval', 'approved', 'sent', 'accepted', 'rejected', 'closed'] as const;
export const QUOTE_LABELS: Record<(typeof QUOTE_STATUSES)[number], string> = {
  new: 'New', qualifying: 'Qualifying', drafting: 'Drafting proposal', pending_approval: 'Pending approval', approved: 'Approved', sent: 'Sent to client', accepted: 'Accepted', rejected: 'Rejected', closed: 'Closed',
};
/** Allowed next states (UI guidance; DB trigger enforces approval/sent rules). */
export const QUOTE_NEXT: Record<string, string[]> = {
  new: ['qualifying', 'closed'], qualifying: ['drafting', 'closed'], drafting: ['pending_approval', 'closed'],
  pending_approval: ['approved', 'drafting'], approved: ['sent', 'drafting'], sent: ['accepted', 'rejected'], accepted: ['closed'], rejected: ['closed', 'drafting'], closed: [],
};

export const ACTIVITY_TYPES = ['note', 'call', 'meeting', 'email_logged', 'whatsapp_logged', 'follow_up', 'quote'] as const;
export const ACTIVITY_LABELS: Record<string, string> = { note: 'Note', call: 'Call', meeting: 'Meeting', email_logged: 'Email (logged)', whatsapp_logged: 'WhatsApp (logged)', follow_up: 'Follow-up', quote: 'Quote', status_change: 'Stage change', system: 'System' };

export const SCORE_RULE_LABELS: Record<string, string> = {
  product_specified: 'Named a product', company_provided: 'Company provided', phone_provided: 'Phone provided', detailed_need: 'Detailed requirement', repeat_inquiry: 'Repeat inquiry',
};
export function scoreRuleLabel(rule: string) {
  if (rule.startsWith('inquiry_type:')) return `Request type: ${rule.split(':')[1].replace('_', ' ')}`;
  return SCORE_RULE_LABELS[rule] ?? rule;
}

/** RFC 4180 CSV with formula-injection protection (=, +, -, @ prefixes). */
export function toCsv(rows: Record<string, unknown>[], columns: string[]): string {
  const esc = (v: unknown) => {
    let s = v === null || v === undefined ? '' : typeof v === 'object' ? JSON.stringify(v) : String(v);
    if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
    return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  return [columns.join(','), ...rows.map((r) => columns.map((c) => esc(r[c])).join(','))].join('\r\n') + '\r\n';
}
