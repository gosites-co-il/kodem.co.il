import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { PlatformWorkspaceController } from './platform-workspace.controller';
import { WorkspaceMembersController } from './workspace-members.controller';
import { InvitesController } from './invites.controller';

@Module({
  imports: [AuthModule],
  controllers: [
    PlatformWorkspaceController,
    WorkspaceMembersController,
    InvitesController,
  ],
})
export class PlatformWorkspaceModule {}
