import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { EntryFlowService } from '@kodem/contracts';
import { WorkspaceService } from '@kodem/platform/workspace';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentContext } from '../auth/decorators/current-context.decorator';
import type { PlatformContext } from '@kodem/contracts';

@Controller('entry')
export class EntryController {
  private readonly entryFlow = new EntryFlowService();
  private readonly workspaceService = new WorkspaceService();

  @Get('resolve')
  @UseGuards(JwtAuthGuard)
  async resolve(
    @CurrentContext() context: PlatformContext,
    @Query('workspaceSelected') workspaceSelected?: string,
  ) {
    const memberships = await this.workspaceService.listForUser(
      context.user.id,
    );

    const resolution = this.entryFlow.resolve({
      isAuthenticated: true,
      user: context.user,
      activeWorkspace: context.workspace,
      memberships,
      workspaceSelected: workspaceSelected === 'true',
    });

    return resolution;
  }
}
