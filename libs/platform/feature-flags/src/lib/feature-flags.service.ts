import type {
  FeatureFlagContext,
  FeatureFlagOverride,
  FeatureFlagScope,
} from '@kodem/contracts';
import { FeatureFlagOverrideRepository as DbFeatureFlagOverrideRepository } from '@kodem/database';

export interface FeatureFlagOverrideRepository {
  listByKey(key: string): Promise<FeatureFlagOverride[]>;
}

const SCOPE_PRECEDENCE: FeatureFlagScope[] = [
  'workspace',
  'plan',
  'environment',
  'global',
];

/** Keys that default to enabled when no override matches. Empty by default. */
const DEFAULT_TRUE_FLAGS = new Set<string>();

export class FeatureFlagsService {
  private readonly memoryOverrides = new Map<string, FeatureFlagOverride[]>();
  private readonly overrideRepo: FeatureFlagOverrideRepository | null;

  constructor(overrideRepo?: FeatureFlagOverrideRepository | null) {
    // Prefer injected repo; when omitted, try DB. Pass null to force memory-only.
    if (overrideRepo === undefined) {
      this.overrideRepo = new DbFeatureFlagOverrideRepository();
    } else {
      this.overrideRepo = overrideRepo;
    }
  }

  /** Register an in-memory override (useful when no DB repo is wired). */
  setMemoryOverrides(key: string, overrides: FeatureFlagOverride[]): void {
    this.memoryOverrides.set(key, overrides);
  }

  async isEnabled(
    key: string,
    context: FeatureFlagContext = {},
  ): Promise<boolean> {
    const overrides = await this.loadOverrides(key);

    for (const scope of SCOPE_PRECEDENCE) {
      const match = overrides.find((o) => this.matches(o, scope, context));
      if (match) return match.enabled;
    }

    return DEFAULT_TRUE_FLAGS.has(key);
  }

  private async loadOverrides(key: string): Promise<FeatureFlagOverride[]> {
    if (this.overrideRepo) {
      try {
        return await this.overrideRepo.listByKey(key);
      } catch {
        // Fall through to memory when DB is unavailable.
      }
    }
    return this.memoryOverrides.get(key) ?? [];
  }

  private matches(
    override: FeatureFlagOverride,
    scope: FeatureFlagScope,
    context: FeatureFlagContext,
  ): boolean {
    if (override.scope !== scope) return false;

    switch (scope) {
      case 'workspace':
        return (
          !!context.workspaceId &&
          override.workspaceId === context.workspaceId
        );
      case 'plan':
        return !!context.planId && override.planId === context.planId;
      case 'environment':
        return (
          !!context.environment &&
          override.environment === context.environment
        );
      case 'global':
        return true;
      default:
        return false;
    }
  }
}
