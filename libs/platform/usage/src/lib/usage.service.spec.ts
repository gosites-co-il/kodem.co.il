import type {
  TrackUsageInput,
  UsageEvent,
  UsageMetric,
  WorkspaceId,
} from '@kodem/contracts';
import { UsageService } from './usage.service';
import { EntitlementsService } from '@kodem/platform/subscription';

describe('UsageService', () => {
  it('assertAndTrack records usage when under limit', async () => {
    const created: TrackUsageInput[] = [];
    const usage = new UsageService(
      {
        create: async (input) => {
          created.push(input);
          return {
            id: 'ue_1',
            workspaceId: input.workspaceId,
            metric: input.metric,
            quantity: input.quantity ?? 1,
            createdAt: new Date(),
          } satisfies UsageEvent;
        },
        sumQuantity: async () => 0,
      },
      {
        assertLimit: async () => undefined,
        resolve: async () => ({
          planId: 'free',
          modules: [],
          limits: { members: 2, events: 500, ai_requests: 100, workspaces: 1 },
        }),
        hasModule: async () => true,
        getLimit: async () => 500,
      } as unknown as EntitlementsService,
      {
        getByWorkspace: async () => ({
          id: 'sub_1',
          workspaceId: 'ws_1' as WorkspaceId,
          planId: 'free',
          status: 'active',
          currentPeriodStart: new Date('2026-01-01'),
          currentPeriodEnd: new Date('2026-02-01'),
          createdAt: new Date(),
          updatedAt: new Date(),
        }),
        ensureForWorkspace: async () => {
          throw new Error('unused');
        },
      } as never,
    );

    await usage.assertAndTrack({
      workspaceId: 'ws_1' as WorkspaceId,
      metric: 'events' satisfies UsageMetric,
      quantity: 2,
    });

    expect(created).toHaveLength(1);
    expect(created[0]?.quantity).toBe(2);
  });

  it('assertAndTrack rejects when period limit exceeded', async () => {
    const usage = new UsageService(
      {
        create: async () => {
          throw new Error('should not create');
        },
        sumQuantity: async () => 500,
      },
      {
        assertLimit: async (
          _ws: WorkspaceId,
          metric: UsageMetric,
          current: number,
        ) => {
          if (current >= 500) {
            throw new Error(`Usage limit exceeded for ${metric}: ${current}/500`);
          }
        },
        resolve: async () => ({
          planId: 'free',
          modules: [],
          limits: { members: 2, events: 500, ai_requests: 100, workspaces: 1 },
        }),
        hasModule: async () => true,
        getLimit: async () => 500,
      } as unknown as EntitlementsService,
      {
        getByWorkspace: async () => null,
        ensureForWorkspace: async () => {
          throw new Error('unused');
        },
      } as never,
    );

    await expect(
      usage.assertAndTrack({
        workspaceId: 'ws_1' as WorkspaceId,
        metric: 'events',
      }),
    ).rejects.toThrow(/Usage limit exceeded/);
  });
});
