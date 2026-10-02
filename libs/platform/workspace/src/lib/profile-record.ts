import type {
  BusinessProfile,
  BusinessRecordField,
  BusinessRecordView,
  BusinessReport,
  BusinessReportDraft,
  ProfileFieldSource,
  ProfileProvenanceState,
  WorkspaceSetupData,
} from '@kodem/contracts';
import { readProvenance } from './profile-merge';

export type { BusinessRecordField, BusinessRecordView };

const SOURCE_LABELS: Record<ProfileFieldSource, string> = {
  USER: 'אומת על ידך',
  GOOGLE_BUSINESS: 'Google Business',
  FACEBOOK: 'Facebook',
  INSTAGRAM: 'Instagram',
  WEBSITE: 'האתר',
};

export function sourceLabel(
  source?: ProfileFieldSource,
  verified?: boolean,
): string {
  if (verified || source === 'USER') return SOURCE_LABELS.USER;
  if (!source) return '';
  return SOURCE_LABELS[source] ?? '';
}

function field(
  key: string,
  label: string,
  value: string | undefined,
  sourceLabelText: string,
): BusinessRecordField | null {
  const trimmed = value?.trim();
  if (!trimmed) return null;
  return { key, label, value: trimmed, sourceLabel: sourceLabelText };
}

function textValue(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() ? value : undefined;
}

function join(values: string[] | undefined): string {
  return (values ?? []).map((item) => item.trim()).filter(Boolean).join(', ');
}

export function recordFromProfile(
  profile: BusinessProfile,
  report?: Pick<BusinessReport, 'understanding'> | null,
  crawling = false,
): BusinessRecordView {
  const provenance = readProvenance(profile);
  const labelFor = (key: keyof ProfileProvenanceState['fields']) => {
    const item = provenance.fields[key];
    return sourceLabel(item?.source, item?.verified);
  };

  const identity = [
    field('name', 'שם', profile.name, labelFor('name')),
    field('industry', 'תחום', profile.industry, labelFor('industry')),
    field('website', 'אתר', profile.website, labelFor('website')),
    field('description', 'תיאור', profile.description, labelFor('description')),
  ].filter((item): item is BusinessRecordField => !!item);

  const contacts = [
    field('phone', 'טלפון', join(profile.phones), labelFor('phone')),
    field('email', 'אימייל', join(profile.emails), labelFor('email')),
    field('address', 'כתובת', join(profile.addresses), labelFor('address')),
    field('social', 'רשתות', join(profile.socialProfiles), labelFor('socialProfile')),
  ].filter((item): item is BusinessRecordField => !!item);

  const offers = [
    field('services', 'שירותים', join(profile.services.filter((item) => item !== 'שירות ליבה')), labelFor('services')),
  ].filter((item): item is BusinessRecordField => !!item);

  const hours = [
    field('openingHours', 'שעות פתיחה', provenance.extras?.openingHours, labelFor('openingHours')),
  ].filter((item): item is BusinessRecordField => !!item);

  return {
    crawling,
    syncStatus: provenance.lastSyncStatus,
    syncMessage: provenance.lastSyncMessage,
    syncedAt: provenance.lastSyncAt,
    sections: { identity, contacts, offers, hours },
    understandingSummary: report?.understanding?.businessSummary?.value,
  };
}

export function recordFromSetup(setup: WorkspaceSetupData): BusinessRecordView {
  const report = setup.businessReport;
  const discovered = setup.discovered;
  const draft = setup.confirmedProfile;
  const crawling = isCrawling(setup);

  const discoveredName = textValue(discovered?.businessName?.value);
  const discoveredIndustry = textValue(discovered?.industry?.value);
  const discoveredWebsite = textValue(discovered?.website?.value);
  const discoveredDescription = textValue(discovered?.description?.value);

  const identity = [
    field(
      'name',
      'שם',
      draft?.businessName ?? discoveredName,
      discoveredName ? 'האתר' : '',
    ),
    field(
      'industry',
      'תחום',
      draft?.industry ?? discoveredIndustry,
      discoveredIndustry ? 'האתר' : '',
    ),
    field(
      'website',
      'אתר',
      draft?.website ?? discoveredWebsite,
      discoveredWebsite ? 'האתר' : '',
    ),
    field(
      'description',
      'תיאור',
      draft?.description ?? discoveredDescription,
      discoveredDescription ? 'האתר' : '',
    ),
  ].filter((item): item is BusinessRecordField => !!item);

  const contacts = [
    field(
      'phone',
      'טלפון',
      join(draft?.phones ?? discovered?.phones?.value),
      discovered?.phones?.value?.length ? 'האתר' : '',
    ),
    field(
      'email',
      'אימייל',
      join(draft?.emails ?? discovered?.emails?.value),
      discovered?.emails?.value?.length ? 'האתר' : '',
    ),
    field(
      'address',
      'כתובת',
      join(draft?.addresses ?? discovered?.addresses?.value),
      discovered?.addresses?.value?.length ? 'האתר' : '',
    ),
    field(
      'social',
      'רשתות',
      join(draft?.socialProfiles ?? discovered?.socialProfiles?.value),
      discovered?.socialProfiles?.value?.length ? 'האתר' : '',
    ),
  ].filter((item): item is BusinessRecordField => !!item);

  const serviceValues =
    draft?.services ??
    discovered?.services?.value ??
    valuesFromFacts(report, 'services');
  const offers = [
    field(
      'services',
      'שירותים',
      join(serviceValues),
      discovered?.services?.value?.length || valuesFromFacts(report, 'services').length
        ? 'האתר'
        : '',
    ),
  ].filter((item): item is BusinessRecordField => !!item);

  return {
    crawling,
    sections: { identity, contacts, offers, hours: [] },
    understandingSummary: report?.understanding?.businessSummary?.value,
  };
}

function valuesFromFacts(
  report: BusinessReportDraft | undefined,
  fieldName: string,
): string[] {
  const fact = report?.facts?.find((item) => item.field === fieldName);
  if (!fact) return [];
  if (Array.isArray(fact.value)) return fact.value.map(String);
  if (typeof fact.value === 'string') return [fact.value];
  return [];
}

export function isCrawling(setup: WorkspaceSetupData): boolean {
  const sources = setup.earlyDiscovery?.sources ?? [];
  return (
    setup.businessReport?.status === 'running' ||
    setup.discovered?.status === 'running' ||
    sources.some((source) => source.status === 'pending' || source.status === 'running')
  );
}

export function factValue(value: unknown): string {
  if (Array.isArray(value)) return value.map(String).join(', ');
  if (typeof value === 'string') return value;
  if (value == null) return '';
  return JSON.stringify(value);
}
