import { Module } from '@nestjs/common';
import { WorkerController } from './worker.controller';
import { EventProcessorService } from './event-processor.service';
import { PlatformCleanupJob } from './platform-cleanup.job';

@Module({
  controllers: [WorkerController],
  providers: [EventProcessorService, PlatformCleanupJob],
})
export class AppModule {}
