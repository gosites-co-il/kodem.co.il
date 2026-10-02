import type {
  BusinessProfile,
  ProfileFieldProvenance,
  ProfileFieldSource,
  ProfileProvenanceField,
  ProfileProvenanceState,
  ProfileSyncStatus,
} from '@kodem/contracts';

export interface NormalizedProfileFact {
  field: ProfileProvenanceField;
  value: string;
  source: Exclude<ProfileFieldSource, 'USER'>;
  connectionId?: string;
  resourceId?: string;
}

const RANK: Record<ProfileFieldSource, number> = {
  USER: 3,
  GOOGLE_BUSINESS: 2,
  FACEBOOK: 2,
  INSTAGRAM: 2,
  WEBSITE: 1,
};

const PROVENANCE_KEY = 'fieldProvenance';

export function readProvenance(profile: BusinessProfile): ProfileProvenanceState {
  const raw = profile.sourceData?.[PROVENANCE_KEY];
  if (!raw || typeof raw !== 'object') {
    return { fields: {} };
  }
  const record = raw as ProfileProvenanceState;
  return {
    fields: record.fields ?? {},
    lastSyncAt: record.lastSyncAt,
    lastSyncStatus: record.lastSyncStatus,
    lastSyncMessage: record.lastSyncMessage,
    extras: record.extras,
  };
}

export function writeProvenance(
  profile: BusinessProfile,
  state: ProfileProvenanceState,
): BusinessProfile {
  return {
    ...profile,
    sourceData: {
      ...(profile.sourceData ?? {}),
      [PROVENANCE_KEY]: state,
    },
  };
}

function isVerified(profile: BusinessProfile, field: ProfileProvenanceField, current?: ProfileFieldProvenance): boolean {
  if (current?.verified || current?.source === 'USER') return true;
  const aliases: Record<string, string[]> = {
    name: ['name', 'businessName'],
    phone: ['phone', 'phones'],
    email: ['email', 'emails'],
    address: ['address', 'addresses'],
  };
  const names = aliases[field] ?? [field];
  return names.some((name) => profile.verifiedFields.includes(name));
}

function applyValue(profile: BusinessProfile, fact: NormalizedProfileFact): BusinessProfile {
  const value = fact.value.trim();
  if (!value) return profile;
  switch (fact.field) {
    case 'name':
      return { ...profile, name: value };
    case 'description':
      return { ...profile, description: value };
    case 'industry':
      return { ...profile, industry: value };
    case 'website':
      return { ...profile, website: value };
    case 'phone':
      return { ...profile, phones: [value, ...profile.phones.filter((item) => item !== value)].slice(0, 5) };
    case 'email':
      return { ...profile, emails: [value, ...profile.emails.filter((item) => item !== value)].slice(0, 5) };
    case 'address':
      return {
        ...profile,
        addresses: [value, ...profile.addresses.filter((item) => item !== value)].slice(0, 5),
      };
    case 'socialProfile':
      return {
        ...profile,
        socialProfiles: [value, ...profile.socialProfiles.filter((item) => item !== value)].slice(0, 8),
      };
    case 'services':
      return profile;
    case 'openingHours':
      return profile;
    default:
      return profile;
  }
}

function currentValue(profile: BusinessProfile, field: ProfileProvenanceField, state: ProfileProvenanceState): string {
  switch (field) {
    case 'name':
      return profile.name?.trim() ?? '';
    case 'description':
      return profile.description?.trim() ?? '';
    case 'industry':
      return profile.industry?.trim() ?? '';
    case 'website':
      return profile.website?.trim() ?? '';
    case 'phone':
      return profile.phones[0]?.trim() ?? '';
    case 'email':
      return profile.emails[0]?.trim() ?? '';
    case 'address':
      return profile.addresses[0]?.trim() ?? '';
    case 'socialProfile':
      return profile.socialProfiles[0]?.trim() ?? '';
    case 'services':
      return profile.services.filter((item) => item && item !== 'שירות ליבה').join(', ');
    case 'openingHours':
      return state.extras?.openingHours?.trim() ?? '';
    default:
      return '';
  }
}

/**
 * Deterministic field merge.
 * User-verified wins. The same integration may refresh its own value.
 * A connected account replaces website discovery. Failures are not applied here.
 */
export function mergeProfileFacts(
  profile: BusinessProfile,
  facts: NormalizedProfileFact[],
  syncedAt = new Date().toISOString(),
): { profile: BusinessProfile; updated: ProfileProvenanceField[] } {
  let next = profile;
  const state = readProvenance(profile);
  const updated: ProfileProvenanceField[] = [];

  for (const fact of facts) {
    const value = fact.value.trim();
    if (!value) continue;
    const current = state.fields[fact.field];
    if (isVerified(next, fact.field, current)) continue;

    const existingRank = current ? RANK[current.source] : 0;
    const incomingRank = RANK[fact.source];
    const sameIntegration =
      current?.source === fact.source &&
      (!current.connectionId || !fact.connectionId || current.connectionId === fact.connectionId);
    const empty = !currentValue(next, fact.field, state);

    const accept =
      empty ||
      sameIntegration ||
      (incomingRank > existingRank);

    if (!accept) continue;

    next = applyValue(next, fact);
    state.fields[fact.field] = {
      source: fact.source,
      connectionId: fact.connectionId,
      resourceId: fact.resourceId,
      verified: false,
      lastSyncedAt: syncedAt,
    };
    if (fact.field === 'openingHours') {
      state.extras = { ...state.extras, openingHours: value };
    }
    updated.push(fact.field);
  }

  return { profile: writeProvenance(next, state), updated };
}

export function markFieldVerified(
  profile: BusinessProfile,
  field: ProfileProvenanceField,
  value: string,
): BusinessProfile {
  const merged = mergeProfileFacts(profile, []);
  const state = readProvenance(merged.profile);
  const applied = applyValue(
    { ...merged.profile, verifiedFields: [...new Set([...merged.profile.verifiedFields, field])] },
    { field, value, source: 'WEBSITE' },
  );
  state.fields[field] = {
    source: 'USER',
    verified: true,
    lastSyncedAt: new Date().toISOString(),
  };
  if (field === 'openingHours') {
    state.extras = { ...state.extras, openingHours: value.trim() };
  }
  return writeProvenance(applied, state);
}

export function recordSyncStatus(
  profile: BusinessProfile,
  status: ProfileSyncStatus,
  message?: string,
): BusinessProfile {
  const state = readProvenance(profile);
  state.lastSyncAt = new Date().toISOString();
  state.lastSyncStatus = status;
  state.lastSyncMessage = message;
  return writeProvenance(profile, state);
}

export function seedWebsiteProvenance(profile: BusinessProfile): BusinessProfile {
  const facts: NormalizedProfileFact[] = [];
  const push = (field: ProfileProvenanceField, value?: string) => {
    if (value?.trim()) facts.push({ field, value: value.trim(), source: 'WEBSITE' });
  };
  push('name', profile.name);
  push('description', profile.description);
  push('industry', profile.industry);
  push('website', profile.website);
  push('phone', profile.phones[0]);
  push('email', profile.emails[0]);
  push('address', profile.addresses[0]);
  push('socialProfile', profile.socialProfiles[0]);
  const seeded = mergeProfileFacts(profile, facts).profile;
  const services = profile.services.filter((item) => item && item !== 'שירות ליבה');
  if (services.length === 0) return seeded;
  const state = readProvenance(seeded);
  if (!state.fields.services) {
    state.fields.services = { source: 'WEBSITE', verified: false };
  }
  return writeProvenance(seeded, state);
}
