import {
  Controller,
  Get,
  UseGuards,
} from '@nestjs/common';
import type { PlatformContext } from '@kodem/contracts';
import {
  BoardService,
  ContactService,
  LeadService,
  TaskService,
} from '@kodem/modules/crm';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ModuleGuard } from '../auth/guards/module.guard';
import { RequireModule } from '../auth/decorators/require-module.decorator';
import { CurrentContext } from '../auth/decorators/current-context.decorator';

@Controller('crm')
@UseGuards(JwtAuthGuard, ModuleGuard)
@RequireModule('crm')
export class CrmOverviewController {
  private readonly leads = new LeadService();
  private readonly contacts = new ContactService();
  private readonly tasks = new TaskService();
  private readonly boards = new BoardService();

  @Get('overview')
  async overview(@CurrentContext() context: PlatformContext) {
    const workspaceId = context.workspace.id;
    const [leadCount, contactCount, openTaskCount, boardCount, leads, tasks, boards] =
      await Promise.all([
        this.leads.count(workspaceId),
        this.contacts.count(workspaceId),
        this.tasks.count(workspaceId, 'pending'),
        this.boards.count(workspaceId),
        this.leads.list(workspaceId),
        this.tasks.list(workspaceId),
        this.boards.list(workspaceId),
      ]);

    return {
      counts: {
        leads: leadCount,
        contacts: contactCount,
        openTasks: openTaskCount,
        boards: boardCount,
      },
      recentLeads: leads.slice(0, 5),
      recentTasks: tasks.slice(0, 5),
      recentBoards: boards.slice(0, 5),
    };
  }
}
