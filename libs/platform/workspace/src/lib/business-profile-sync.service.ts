import type {
  BusinessProfile,
  ProfileProvenanceField,
  ProfileProvenanceState,
  WorkspaceConnection,
  WorkspaceId,
} from '@kodem/contracts';
import {
  BusinessProfileRepository,
  PrismaEventStore,
  WorkspaceConnectionRepository,
} from '@kodem/database';
import { EVENT_TYPES, KodemEventBus } from '@kodem/events';
import {
  readOfficialBusinessLocation,
  readOfficialFacebookPage,
  readOfficialInstagramProfile,
} from '@kodem/integrations';
import type { ConnectionService } from '@kodem/platform/connections';
import {
  mergeProfileFacts,
  readProvenance,
  recordSyncStatus,
  type NormalizedProfileFact,
} from './profile-merge';

const PROFILE_INTEGRATIONS = new Set(['google_business', 'facebook', 'instagram']);

const FAILURE_COPY: Record<string, string> = {
  google_business: 'Google Business could not be refreshed. Your existing information was kept.',
  facebook: 'Facebook could not be refreshed. Your existing information was kept.',
  instagram: 'Instagram could not be refreshed. Your existing information was kept.',
};

export interface BusinessProfileView {
  profile: BusinessProfile | null;
  provenance: ProfileProvenanceState;
  syncing: boolean;
}

export class BusinessProfileSyncService {
  private readonly profiles = new BusinessProfileRepository();
  private readonly connections = new WorkspaceConnectionRepository();
  private readonly events = new KodemEventBus(new PrismaEventStore());

  constructor(private readonly connectionService: ConnectionService) {}

  async refresh(workspaceId: WorkspaceId): Promise<BusinessProfileView> {
    const current = await this.profiles.findByWorkspace(workspaceId);
    if (!current) {
      return { profile: null, provenance: { fields: {} }, syncing: false };
    }

    await this.events.emit({
      type: EVENT_TYPES.BUSINESS_PROFILE_SYNC_STARTED,
      workspaceId,
      payload: { workspaceId },
    });

    const bound = (await this.connections.findByWorkspace(workspaceId)).filter(
      (connection) =>
        connection.status === 'connected' &&
        PROFILE_INTEGRATIONS.has(connection.integrationId),
    );

    const facts: NormalizedProfileFact[] = [];
    const failures: string[] = [];

    for (const connection of bound) {
      try {
        facts.push(...(await this.factsFor(workspaceId, connection)));
      } catch {
        const message = FAILURE_COPY[connection.integrationId] ?? FAILURE_COPY['google_business'];
        failures.push(message);
        console.error(`business profile sync failed for ${connection.integrationId}`);
      }
    }

    const merged = mergeProfileFacts(current, facts);
    let next = merged.profile;
    if (failures.length > 0) {
      next = recordSyncStatus(next, facts.length > 0 ? 'partial' : 'failed', failures[0]);
      await this.events.emit({
        type: EVENT_TYPES.BUSINESS_PROFILE_SYNC_FAILED,
        workspaceId,
        payload: { workspaceId },
      });
    } else {
      next = recordSyncStatus(next, 'success');
      await this.events.emit({
        type: EVENT_TYPES.BUSINESS_PROFILE_SYNC_COMPLETED,
        workspaceId,
        payload: { workspaceId },
      });
    }

    await Promise.all(
      merged.updated.map(() =>
        this.events.emit({
          type: EVENT_TYPES.BUSINESS_PROFILE_FIELD_UPDATED,
          workspaceId,
          payload: { workspaceId },
        }),
      ),
    );

    next = { ...next, updatedAt: new Date(), version: current.version + 1 };
    await this.profiles.upsert(next);
    return { profile: next, provenance: readProvenance(next), syncing: false };
  }

  async refreshConnection(workspaceId: WorkspaceId, connectionId: string): Promise<void> {
    const connection = (await this.connections.findByWorkspace(workspaceId)).find(
      (item) => item.id === connectionId,
    );
    if (!connection || !PROFILE_INTEGRATIONS.has(connection.integrationId)) return;
    if (connection.status !== 'connected') return;
    await this.refresh(workspaceId);
  }

  private async factsFor(
    workspaceId: WorkspaceId,
    connection: WorkspaceConnection,
  ): Promise<NormalizedProfileFact[]> {
    const token = await this.connectionService.getValidAccessToken(workspaceId, connection.id);
    const metadata = (connection.metadata ?? {}) as Record<string, unknown>;
    const text = (key: string) => (typeof metadata[key] === 'string' ? (metadata[key] as string) : '');
    const facts: NormalizedProfileFact[] = [];
    const push = (field: ProfileProvenanceField, value: string | undefined, resourceId?: string) => {
      if (!value?.trim()) return;
      facts.push({
        field,
        value: value.trim(),
        source:
          connection.integrationId === 'google_business'
            ? 'GOOGLE_BUSINESS'
            : connection.integrationId === 'facebook'
              ? 'FACEBOOK'
              : 'INSTAGRAM',
        connectionId: connection.id,
        resourceId,
      });
    };

    if (connection.integrationId === 'google_business') {
      const locationName = text('locationName');
      if (!locationName) return [];
      const location = await readOfficialBusinessLocation(token, locationName);
      push('name', location.title, location.locationName);
      push('phone', location.phone, location.locationName);
      push('website', location.website, location.locationName);
      push('address', location.address, location.locationName);
      push('description', location.description, location.locationName);
      push('industry', location.category, location.locationName);
      push('openingHours', location.openingHours, location.locationName);
      return facts;
    }

    if (connection.integrationId === 'facebook') {
      const pageId = text('pageId');
      if (!pageId) return [];
      const page = await readOfficialFacebookPage(token, pageId);
      push('name', page.name, page.pageId);
      push('description', page.about, page.pageId);
      push('industry', page.category, page.pageId);
      push('phone', page.phone, page.pageId);
      push('email', page.email, page.pageId);
      push('website', page.website, page.pageId);
      push('address', page.address, page.pageId);
      push('openingHours', page.openingHours, page.pageId);
      push('socialProfile', page.link, page.pageId);
      return facts;
    }

    const igUserId = text('igUserId');
    if (!igUserId) return [];
    const profile = await readOfficialInstagramProfile(token, igUserId);
    push('name', profile.name, profile.igUserId);
    push('description', profile.biography, profile.igUserId);
    push('website', profile.website, profile.igUserId);
    push('socialProfile', profile.profileUrl, profile.igUserId);
    return facts;
  }
}
