export type { Lead, CrmLead } from '@kodem/contracts';

export const LEAD_STATUSES = [
  'new',
  'contacted',
  'qualified',
  'lost',
] as const;

export type LeadStatus = (typeof LEAD_STATUSES)[number];
