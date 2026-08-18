import type {
  DiscoveryEventPublisher,
  DiscoveryProvider,
  DiscoveryRunInput,
  DiscoveryRunResult,
} from '@kodem/contracts';
import { ProviderRegistry } from '../domain/provider-registry';
import { createDefaultProviders } from '../providers';
import { DiscoveryOrchestrator } from './discovery-orchestrator';

export class DiscoveryRunner {
  private readonly orchestrator: DiscoveryOrchestrator;

  constructor(providers?: DiscoveryProvider[]) {
    const registry = new ProviderRegistry();
    registry.registerMany(providers ?? createDefaultProviders());
    this.orchestrator = new DiscoveryOrchestrator(registry);
  }

  async run(
    input: DiscoveryRunInput,
    publisher?: DiscoveryEventPublisher,
  ): Promise<DiscoveryRunResult> {
    return this.orchestrator.run(input, { publisher });
  }
}

export const discoveryRunner = new DiscoveryRunner();
