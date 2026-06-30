import { Module } from '@nestjs/common';
import { HealthController } from './health.controller';
import { WorkspaceModule } from './workspace/workspace.module';

@Module({
  imports: [WorkspaceModule],
  controllers: [HealthController],
})
export class AppModule {}
