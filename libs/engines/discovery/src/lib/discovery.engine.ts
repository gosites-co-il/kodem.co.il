import {
  DiscoveryInput,
  DiscoveryOutput,
  Engine,
  EngineResult,
} from '@kodem/contracts';
import { discoveryRunner } from './application/discovery-runner';

export type { DiscoveryInput, DiscoveryOutput } from '@kodem/contracts';

export class DiscoveryEngine implements Engine<DiscoveryInput, DiscoveryOutput> {
  readonly name = 'discovery';

  async run(input: DiscoveryInput): Promise<EngineResult<DiscoveryOutput>> {
    try {
      const result = await discoveryRunner.run({
        workspaceId: input.workspaceId,
        businessName: input.businessName,
        websiteUrl: input.websiteUrl,
      });

      return {
        success: true,
        data: {
          profile: result.profile,
          hypotheses: result.hypotheses,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Discovery failed',
      };
    }
  }
}

export const discoveryEngine = new DiscoveryEngine();
