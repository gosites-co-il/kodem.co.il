import { Controller, Get, Post } from '@nestjs/common';
import { EventProcessorService } from './event-processor.service';

@Controller()
export class WorkerController {
  constructor(private readonly processor: EventProcessorService) {}

  @Get('health')
  health() {
    return { status: 'ok', service: 'kodem-worker' };
  }

  @Post('process')
  async triggerProcess() {
    const processed = await this.processor.processPending();
    return { processed };
  }
}
