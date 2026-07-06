import { Module } from '@nestjs/common';
import { EntryController } from './entry.controller';
import { WorkspaceSetupController } from './workspace-setup.controller';
import { WorkspaceOverviewController } from './workspace-overview.controller';

@Module({
  controllers: [
    EntryController,
    WorkspaceSetupController,
    WorkspaceOverviewController,
  ],
})
export class EntryModule {}
