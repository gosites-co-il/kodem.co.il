import type {
  DiscoveryAsset,
  DiscoveryConfig,
  DiscoveryEventPublisher,
  DiscoveryRunInput,
  DiscoveryRunResult,
} from '@kodem/contracts';
import { DEFAULT_DISCOVERY_CONFIG as DEFAULT_CONFIG } from '@kodem/contracts';
import { AssetQueue } from '../domain/asset-queue';
import { createAsset, createFact } from '../domain/fact-utils';
import { MergeEngine } from '../domain/merge-engine';
import { assembleBusinessProfile } from '../domain/profile-assembler';
import type { ProviderRegistry } from '../domain/provider-registry';
import { createFetchContext } from '../infrastructure/http-client';
import { getProviderPriority } from '../infrastructure/social-detector';
import { assetKey, normalizeUrl } from '../infrastructure/url-utils';
import { toDiscoveredBusinessInfo } from './discovered-info.mapper';

export type DiscoveryStopReason = DiscoveryRunResult['stopReason'];

export class DiscoveryOrchestrator {
  constructor(private readonly registry: ProviderRegistry) {}

  async run(
    input: DiscoveryRunInput,
    options?: {
      config?: Partial<DiscoveryConfig>;
      publisher?: DiscoveryEventPublisher;
    },
  ): Promise<DiscoveryRunResult> {
    const config: DiscoveryConfig = { ...DEFAULT_CONFIG, ...options?.config };
    const publisher = options?.publisher;
    const mergeEngine = new MergeEngine();
    const queue = new AssetQueue();
    const seen = new Set<string>();
    const processed: DiscoveryAsset[] = [];
    const startedAt = Date.now();
    let stopReason: DiscoveryStopReason = 'queue_empty';
    let processedCount = 0;

    await publisher?.publish({
      type: 'discovery.started',
      payload: {
        businessName: input.businessName,
        websiteUrl: input.websiteUrl,
      },
    });

    if (input.businessName.trim()) {
      const trimmedName = input.businessName.trim();
      const isWorkspacePlaceholder = /'s workspace$/i.test(trimmedName);
      const seedFact = createFact(
        'businessName',
        trimmedName,
        'user_input',
        isWorkspacePlaceholder ? 0.4 : 0.95,
        { verified: !isWorkspacePlaceholder },
      );
      if (seedFact) {
        mergeEngine.add(seedFact);
      }
    }

    if (input.websiteUrl?.trim()) {
      const websiteUrl = normalizeUrl(input.websiteUrl.trim());
      if (websiteUrl) {
        const seedAsset = createAsset(
          'WEBSITE',
          websiteUrl,
          'seed',
          getProviderPriority('WEBSITE'),
          0,
        );
        if (seedAsset) {
          queue.push(seedAsset);
          seen.add(seedAsset.id);
          await publisher?.publish({
            type: 'asset.discovered',
            payload: { asset: pickAssetEvent(seedAsset) },
          });
        }
      }
    }

    if (queue.isEmpty()) {
      stopReason = 'no_seed';
    }

    while (!queue.isEmpty() && processedCount < config.maxAssets) {
      if (Date.now() - startedAt >= config.timeoutMs) {
        stopReason = 'timeout';
        break;
      }

      const asset = queue.pop();
      if (!asset) {
        break;
      }

      if (asset.depth > config.maxDepth) {
        stopReason = 'max_depth';
        continue;
      }

      const provider = this.registry.get(asset.type);
      asset.status = 'processing';

      if (!provider) {
        asset.status = 'skipped';
        processed.push(asset);
        continue;
      }

      const fetchContext = createFetchContext(
        config.maxPageFetches,
        config.fetchTimeoutMs,
      );

      let result;
      try {
        result = await provider.discover(asset, fetchContext);
        asset.status = 'completed';
      } catch {
        asset.status = 'failed';
        processed.push(asset);
        continue;
      }

      mergeEngine.addMany(result.facts);

      for (const newAsset of result.assets) {
        const key = assetKey(newAsset.type, newAsset.url);
        if (seen.has(key)) {
          continue;
        }
        if (newAsset.depth > config.maxDepth) {
          stopReason = 'max_depth';
          continue;
        }

        seen.add(key);
        queue.push(newAsset);
        await publisher?.publish({
          type: 'asset.discovered',
          payload: { asset: pickAssetEvent(newAsset) },
        });
      }

      processed.push(asset);
      processedCount += 1;

      await publisher?.publish({
        type: 'asset.processed',
        payload: {
          asset: {
            id: asset.id,
            type: asset.type,
            url: asset.url,
            status: asset.status,
          },
          factCount: result.facts.length,
          newAssetCount: result.assets.length,
        },
      });

      if (processedCount >= config.maxAssets) {
        stopReason = 'max_assets';
        break;
      }
    }

    const profile = assembleBusinessProfile(mergeEngine, input);
    const discovered = toDiscoveredBusinessInfo(mergeEngine, profile);
    const partial = stopReason !== 'queue_empty' && stopReason !== 'no_seed';

    await publisher?.publish({
      type: 'discovery.completed',
      payload: {
        assetsProcessed: processed.length,
        factCount: mergeEngine.getAllFacts().length,
        partial,
        stopReason,
      },
    });

    await publisher?.publish({
      type: 'business.updated',
      payload: {
        fields: Object.keys(profile.sourceData ?? {}),
        source: 'discovery_engine',
      },
    });

    return {
      workspaceId: input.workspaceId,
      profile,
      discovered,
      facts: mergeEngine.getAllFacts(),
      assetsProcessed: processed,
      hypotheses: profile.hypotheses,
      completedAt: new Date(),
      partial,
      stopReason,
    };
  }
}

function pickAssetEvent(asset: DiscoveryAsset) {
  return {
    id: asset.id,
    type: asset.type,
    url: asset.url,
    source: asset.source,
    priority: asset.priority,
    depth: asset.depth,
  };
}
