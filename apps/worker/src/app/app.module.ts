import { Module } from '@nestjs/common';
import { WorkerController } from './worker.controller';
import { EventProcessorService } from './event-processor.service';

@Module({
  controllers: [WorkerController],
  providers: [EventProcessorService],
})
export class AppModule {}
