import { Module } from '@nestjs/common';
import { HealthController } from './health.controller';
import { WorkspaceModule } from './workspace/workspace.module';
import { AuthModule } from './auth/auth.module';
import { PlatformWorkspaceModule } from './platform-workspace/platform-workspace.module';

@Module({
  imports: [AuthModule, PlatformWorkspaceModule, WorkspaceModule],
  controllers: [HealthController],
})
export class AppModule {}
