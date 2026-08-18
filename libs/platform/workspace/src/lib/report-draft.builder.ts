import type {
  BusinessProfileDraft,
  BusinessReport,
  BusinessReportDraft,
  DiscoveredBusinessInfo,
} from '@kodem/contracts';

/** Build a reviewable profile draft from BI report + discovery snapshot. */
export function buildProfileDraftFromReport(
  report: BusinessReport | BusinessReportDraft,
  discovered?: DiscoveredBusinessInfo,
): BusinessProfileDraft {
  const u = report.understanding;
  const nameFact = report.facts.find((f) => f.field === 'businessName');
  const websiteFact = report.facts.find((f) => f.field === 'website');

  const emails = report.facts
    .filter((f) => f.field === 'emails' && Array.isArray(f.value))
    .flatMap((f) => f.value as string[]);
  const phones = report.facts
    .filter((f) => f.field === 'phones' && Array.isArray(f.value))
    .flatMap((f) => f.value as string[]);

  const draft: BusinessProfileDraft = {
    businessName:
      (typeof nameFact?.value === 'string' ? nameFact.value : undefined) ??
      u.businessSummary.value.split(':').pop()?.trim() ??
      discovered?.businessName?.value ??
      '',
    legalName: discovered?.legalName?.value,
    description: u.businessSummary.value,
    industry: u.industry.value,
    subIndustry: u.subIndustry?.value,
    website:
      (typeof websiteFact?.value === 'string' ? websiteFact.value : undefined) ??
      discovered?.website?.value,
    logo: discovered?.logo?.value ?? discovered?.logoUrl,
    language: discovered?.language?.value,
    timezone: 'Asia/Jerusalem',
    emails: emails.length ? emails : (discovered?.emails?.value ?? []),
    phones: phones.length ? phones : (discovered?.phones?.value ?? []),
    addresses: discovered?.addresses?.value ?? [],
    socialProfiles: discovered?.socialProfiles?.value ?? [],
    services: u.mainServices.value.length
      ? u.mainServices.value
      : (discovered?.services?.value ?? []),
    products: u.products.value.length
      ? u.products.value
      : (discovered?.products?.value ?? []),
    fieldStatus: {},
  };

  const fields: Array<[string, unknown]> = [
    ['businessName', draft.businessName],
    ['description', draft.description],
    ['industry', draft.industry],
    ['website', draft.website],
    ['services', draft.services],
    ['products', draft.products],
  ];

  for (const [key, value] of fields) {
    const hasValue = Array.isArray(value)
      ? value.length > 0
      : typeof value === 'string'
        ? value.trim().length > 0
        : Boolean(value);
    draft.fieldStatus[key] = hasValue ? 'detected' : 'missing';
  }

  return draft;
}

export function reportFromDraft(draft: BusinessReportDraft): BusinessReport {
  const { status: _status, fieldApprovals: _approvals, ...report } = draft;
  return report;
}
