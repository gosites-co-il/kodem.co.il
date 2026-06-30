import { WorkspaceId } from '@kodem/core';
import { DiscoveryInput, DiscoveryOutput, Engine, EngineResult } from '../types';

export class DiscoveryEngine implements Engine<DiscoveryInput, DiscoveryOutput> {
  readonly name = 'discovery';

  async run(input: DiscoveryInput): Promise<EngineResult<DiscoveryOutput>> {
    const industry = input.websiteUrl?.includes('.co.il')
      ? 'Israeli SMB'
      : 'General Business';

    const profile: DiscoveryOutput['profile'] = {
      workspaceId: input.workspaceId,
      name: input.businessName,
      industry,
      services: ['Core Service'],
      classification: 'SMB',
      communicationChannels: input.websiteUrl ? ['website'] : ['manual'],
      hypotheses: [
        `Business "${input.businessName}" likely serves local customers`,
        input.websiteUrl
          ? `Website ${input.websiteUrl} suggests digital presence`
          : 'No website provided — onboarding gap detected',
      ],
      version: 1,
    };

    return {
      success: true,
      data: {
        profile,
        hypotheses: profile.hypotheses,
      },
    };
  }
}

export const discoveryEngine = new DiscoveryEngine();
