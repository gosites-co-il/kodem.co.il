import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { PlatformWorkspaceController } from './platform-workspace.controller';

@Module({
  imports: [AuthModule],
  controllers: [PlatformWorkspaceController],
})
export class PlatformWorkspaceModule {}
