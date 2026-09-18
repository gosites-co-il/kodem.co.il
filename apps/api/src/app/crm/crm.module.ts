import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { CrmLeadsController } from './leads.controller';
import { CrmContactsController } from './contacts.controller';
import { CrmTasksController } from './tasks.controller';
import { CrmOverviewController } from './overview.controller';
import { CrmBoardsController } from './boards.controller';

@Module({
  imports: [AuthModule],
  controllers: [
    CrmOverviewController,
    CrmBoardsController,
    CrmLeadsController,
    CrmContactsController,
    CrmTasksController,
  ],
})
export class CrmModule {}
