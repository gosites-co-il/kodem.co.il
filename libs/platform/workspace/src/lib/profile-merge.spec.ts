import type { BusinessProfile } from '@kodem/contracts';
import { mergeProfileFacts, recordSyncStatus } from './profile-merge';

function profile(partial: Partial<BusinessProfile> = {}): BusinessProfile {
  return {
    workspaceId: 'ws_1' as BusinessProfile['workspaceId'],
    name: 'BizMedia',
    emails: [],
    phones: ['050-1111111'],
    addresses: [],
    socialProfiles: [],
    services: [],
    products: [],
    communicationChannels: [],
    hypotheses: [],
    verifiedFields: [],
    version: 1,
    createdAt: new Date(),
    updatedAt: new Date(),
    sourceData: {
      fieldProvenance: {
        fields: {
          phone: { source: 'WEBSITE', verified: false },
        },
      },
    },
    ...partial,
  };
}

describe('mergeProfileFacts', () => {
  it('replaces a website phone with Facebook', () => {
    const result = mergeProfileFacts(profile(), [
      {
        field: 'phone',
        value: '050-2222222',
        source: 'FACEBOOK',
        connectionId: 'conn_fb',
        resourceId: 'page_1',
      },
    ]);
    expect(result.profile.phones[0]).toBe('050-2222222');
    expect(result.updated).toContain('phone');
  });

  it('keeps a user-verified phone when Facebook refreshes', () => {
    const verified = profile({
      phones: ['050-3333333'],
      verifiedFields: ['phone'],
      sourceData: {
        fieldProvenance: {
          fields: {
            phone: { source: 'USER', verified: true },
          },
        },
      },
    });
    const result = mergeProfileFacts(verified, [
      { field: 'phone', value: '050-2222222', source: 'FACEBOOK', connectionId: 'conn_fb' },
    ]);
    expect(result.profile.phones[0]).toBe('050-3333333');
    expect(result.updated).not.toContain('phone');
  });

  it('keeps an imported Facebook phone after disconnect', () => {
    const imported = mergeProfileFacts(profile(), [
      { field: 'phone', value: '050-2222222', source: 'FACEBOOK', connectionId: 'conn_fb' },
    ]);
    const afterDisconnect = mergeProfileFacts(imported.profile, []);
    expect(afterDisconnect.profile.phones[0]).toBe('050-2222222');
  });

  it('leaves the phone in place when sync records a failure', () => {
    const current = profile();
    const next = recordSyncStatus(current, 'failed', 'Google Business could not be refreshed');
    expect(next.phones).toEqual(current.phones);
    const again = mergeProfileFacts(next, []);
    expect(again.profile.phones[0]).toBe('050-1111111');
  });
});
