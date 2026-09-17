import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { EntryController } from './entry.controller';
import { WorkspaceSetupController } from './workspace-setup.controller';
import { WorkspaceOverviewController } from './workspace-overview.controller';

@Module({
  imports: [AuthModule],
  controllers: [
    EntryController,
    WorkspaceSetupController,
    WorkspaceOverviewController,
  ],
})
export class EntryModule {}
