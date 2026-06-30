import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { PrismaEventStore, WorkspaceRepository } from '@kodem/database';
import {
  BusinessProfileRepository,
  InsightRepository,
  RecommendationRepository,
} from '@kodem/database';
import { runEnginePipeline } from '@kodem/engines';
import { KodemEvent, EVENT_TYPES } from '@kodem/events';
import { getPrismaClient } from '@kodem/database';

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

      if (result.insights.length > 0) {
        await this.insightRepo.saveMany(result.insights);
      }

      if (result.recommendations.length > 0) {
        await this.recommendationRepo.saveMany(result.recommendations);
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
