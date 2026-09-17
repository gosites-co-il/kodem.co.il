import { FeatureFlagsService } from './feature-flags.service';
import type { FeatureFlagOverride, WorkspaceId } from '@kodem/contracts';

function override(
  partial: Partial<FeatureFlagOverride> &
    Pick<FeatureFlagOverride, 'key' | 'scope' | 'enabled'>,
): FeatureFlagOverride {
  return {
    id: partial.id ?? 'ffo_1',
    planId: partial.planId ?? null,
    workspaceId: partial.workspaceId ?? null,
    environment: partial.environment ?? null,
    ...partial,
  };
}

describe('FeatureFlagsService precedence', () => {
  it('prefers workspace over plan/environment/global', async () => {
    const flags = new FeatureFlagsService(null);
    flags.setMemoryOverrides('beta', [
      override({ key: 'beta', scope: 'global', enabled: false }),
      override({
        key: 'beta',
        scope: 'environment',
        enabled: false,
        environment: 'development',
      }),
      override({ key: 'beta', scope: 'plan', enabled: false, planId: 'free' }),
      override({
        key: 'beta',
        scope: 'workspace',
        enabled: true,
        workspaceId: 'ws_1' as WorkspaceId,
      }),
    ]);

    await expect(
      flags.isEnabled('beta', {
        workspaceId: 'ws_1' as WorkspaceId,
        planId: 'free',
        environment: 'development',
      }),
    ).resolves.toBe(true);
  });

  it('falls back to plan when workspace missing', async () => {
    const flags = new FeatureFlagsService(null);
    flags.setMemoryOverrides('beta', [
      override({ key: 'beta', scope: 'global', enabled: false }),
      override({ key: 'beta', scope: 'plan', enabled: true, planId: 'starter' }),
    ]);

    await expect(
      flags.isEnabled('beta', { planId: 'starter' }),
    ).resolves.toBe(true);
  });
});
