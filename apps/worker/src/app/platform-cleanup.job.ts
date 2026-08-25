import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { PlatformCleanupService } from '@kodem/platform/auth';

@Injectable()
export class PlatformCleanupJob implements OnModuleInit {
  private readonly logger = new Logger(PlatformCleanupJob.name);
  private readonly cleanup = new PlatformCleanupService();
  private interval?: ReturnType<typeof setInterval>;

  onModuleInit() {
    const ms = Number(process.env['PLATFORM_CLEANUP_MS'] ?? 60 * 60 * 1000);
    this.logger.log(`Platform cleanup scheduled every ${ms}ms`);
    void this.run();
    this.interval = setInterval(() => void this.run(), ms);
  }

  onModuleDestroy() {
    if (this.interval) clearInterval(this.interval);
  }

  private async run() {
    try {
      const result = await this.cleanup.run();
      this.logger.log(
        `Cleanup done: tokens=${result.authTokens} invites=${result.invites} outbox=${result.outbox}`,
      );
    } catch (err) {
      this.logger.warn(
        `Cleanup failed: ${err instanceof Error ? err.message : String(err)}`,
      );
    }
  }
}
