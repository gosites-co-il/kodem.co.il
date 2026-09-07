import { PLANS, getPlan } from './plans';
import { EntitlementsService } from './entitlements.service';
import type { Subscription, WorkspaceId } from '@kodem/contracts';

describe('subscription plans', () => {
  it('defines free plan modules and limits', () => {
    const free = getPlan('free');
    expect(free.modules).toEqual([
      'crm',
      'knowledge',
      'insights',
      'digital_card',
    ]);
    expect(free.limits).toEqual({
      members: 2,
      events: 500,
      ai_requests: 100,
      workspaces: 1,
    });
  });

  it('gives enterprise null (unlimited) limits', () => {
    expect(PLANS.enterprise.limits.members).toBeNull();
    expect(PLANS.enterprise.modules).toContain('external_ai');
  });

  it('resolves free entitlements modules when no subscription row', async () => {
    const entitlements = new EntitlementsService({
      findByWorkspaceId: async () => null,
      create: async () => {
        throw new Error('should not create');
      },
    });
    const resolved = await entitlements.resolve('ws_test' as WorkspaceId);
    expect(resolved.planId).toBe('free');
    expect(resolved.modules).toEqual(PLANS.free.modules);
    expect(await entitlements.hasModule('ws_test' as WorkspaceId, 'crm')).toBe(
      true,
    );
    expect(
      await entitlements.hasModule('ws_test' as WorkspaceId, 'automation'),
    ).toBe(false);
  });

  it('uses subscription plan when present', async () => {
    const sub: Subscription = {
      id: 'sub_1',
      workspaceId: 'ws_test' as WorkspaceId,
      planId: 'starter',
      status: 'active',
      currentPeriodStart: new Date(),
      currentPeriodEnd: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    const entitlements = new EntitlementsService({
      findByWorkspaceId: async () => sub,
      create: async () => sub,
    });
    expect(
      await entitlements.hasModule('ws_test' as WorkspaceId, 'campaign_manager'),
    ).toBe(true);
  });
});
