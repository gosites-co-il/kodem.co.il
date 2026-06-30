import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { KodemEvent } from '@kodem/contracts';
import { EVENT_TYPES } from '@kodem/events';
import {
  PrismaEventStore,
  WorkspaceRepository,
  BusinessProfileRepository,
  InsightRepository,
  RecommendationRepository,
  getPrismaClient,
} from '@kodem/database';
import { runEnginePipeline } from '@kodem/engines/pipeline';
import {
  toInsight,
  toRecommendation,
  prioritize,
} from '@kodem/workspace/bkm';

@Injectable()
export class EventProcessorService implements OnModuleInit {
  private readonly logger = new Logger(EventProcessorService.name);
  private readonly eventStore = new PrismaEventStore();
  private readonly workspaceRepo = new WorkspaceRepository();
  private readonly profileRepo = new BusinessProfileRepository();
  private readonly insightRepo = new InsightRepository();
  private readonly recommendationRepo = new RecommendationRepository();
  private interval?: ReturnType<typeof setInterval>;
  private processing = false;

  onModuleInit() {
    const pollMs = Number(process.env.WORKER_POLL_MS ?? 2000);
    this.logger.log(`Event processor started (poll every ${pollMs}ms)`);
    this.interval = setInterval(() => void this.processPending(), pollMs);
  }

  onModuleDestroy() {
    if (this.interval) clearInterval(this.interval);
  }

  async processPending(): Promise<number> {
    if (this.processing) return 0;
    this.processing = true;

    try {
      const events = await this.eventStore.findPending(5);
      for (const event of events) {
        await this.processEvent(event);
      }
      return events.length;
    } finally {
      this.processing = false;
    }
  }

  private async processEvent(event: KodemEvent): Promise<void> {
    await this.eventStore.markProcessing(event.id);

    try {
      const workspace = await this.workspaceRepo.findById(event.workspaceId);
      if (!workspace) {
        throw new Error(`Workspace ${event.workspaceId} not found`);
      }

      const db = getPrismaClient();
      const eventCount = await db.event.count({
        where: { workspaceId: event.workspaceId },
      });

      const existingProfile = await this.profileRepo.findByWorkspace(
        event.workspaceId,
      );

      const result = await runEnginePipeline(event, {
        workspaceName: workspace.name,
        websiteUrl: workspace.websiteUrl,
        existingProfile,
        eventCount,
      });

      if (result.profile) {
        await this.profileRepo.upsert(result.profile);
      }

      if (result.insightDrafts.length > 0) {
        const insights = result.insightDrafts.map((draft) =>
          toInsight(event.workspaceId, draft),
        );
        await this.insightRepo.saveMany(insights);
      }

      if (result.recommendationDrafts.length > 0) {
        const recommendations = prioritize(result.recommendationDrafts).map(
          (draft) => toRecommendation(event.workspaceId, draft),
        );
        await this.recommendationRepo.saveMany(recommendations);
      }

      if (event.type === EVENT_TYPES.WORKSPACE_CREATED) {
        await db.workspace.update({
          where: { id: event.workspaceId },
          data: { status: 'active' },
        });
      }

      await this.eventStore.markCompleted(event.id);
      this.logger.log(
        `Processed ${event.type} for workspace ${event.workspaceId}`,
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      await this.eventStore.markFailed(event.id, message);
      this.logger.error(`Failed event ${event.id}: ${message}`);
    }
  }
}
