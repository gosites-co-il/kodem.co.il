import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  NotFoundException,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import type {
  CreateTaskInput,
  PlatformContext,
  TaskStatus,
  UpdateTaskInput,
} from '@kodem/contracts';
import { TaskService } from '@kodem/modules/crm';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ModuleGuard } from '../auth/guards/module.guard';
import { RequireModule } from '../auth/decorators/require-module.decorator';
import { CurrentContext } from '../auth/decorators/current-context.decorator';

@Controller('crm/tasks')
@UseGuards(JwtAuthGuard, ModuleGuard)
@RequireModule('crm')
export class CrmTasksController {
  private readonly tasks = new TaskService();

  @Get()
  async list(
    @CurrentContext() context: PlatformContext,
    @Query('leadId') leadId?: string,
    @Query('contactId') contactId?: string,
    @Query('status') status?: TaskStatus,
  ) {
    const tasks = await this.tasks.list(context.workspace.id, {
      leadId,
      contactId,
      status,
    });
    return { tasks };
  }

  @Get(':id')
  async get(
    @CurrentContext() context: PlatformContext,
    @Param('id') id: string,
  ) {
    const task = await this.tasks.get(context.workspace.id, id);
    if (!task) throw new NotFoundException('Task not found');
    return { task };
  }

  @Post()
  async create(
    @CurrentContext() context: PlatformContext,
    @Body() body: CreateTaskInput,
  ) {
    try {
      const task = await this.tasks.create(context.workspace.id, body);
      return { task };
    } catch (error) {
      throw new BadRequestException(
        error instanceof Error ? error.message : 'Failed to create task',
      );
    }
  }

  @Patch(':id')
  async update(
    @CurrentContext() context: PlatformContext,
    @Param('id') id: string,
    @Body() body: UpdateTaskInput,
  ) {
    try {
      const task = await this.tasks.update(context.workspace.id, id, body);
      return { task };
    } catch (error) {
      if (error instanceof Error && error.message === 'Task not found') {
        throw new NotFoundException(error.message);
      }
      throw new BadRequestException(
        error instanceof Error ? error.message : 'Failed to update task',
      );
    }
  }

  @Post(':id/complete')
  async complete(
    @CurrentContext() context: PlatformContext,
    @Param('id') id: string,
  ) {
    try {
      const task = await this.tasks.complete(context.workspace.id, id);
      return { task };
    } catch (error) {
      if (error instanceof Error && error.message === 'Task not found') {
        throw new NotFoundException(error.message);
      }
      throw new BadRequestException(
        error instanceof Error ? error.message : 'Failed to complete task',
      );
    }
  }

  @Delete(':id')
  @HttpCode(204)
  async remove(
    @CurrentContext() context: PlatformContext,
    @Param('id') id: string,
  ) {
    try {
      await this.tasks.delete(context.workspace.id, id);
    } catch (error) {
      if (error instanceof Error && error.message === 'Task not found') {
        throw new NotFoundException(error.message);
      }
      throw new BadRequestException(
        error instanceof Error ? error.message : 'Failed to delete task',
      );
    }
  }
}
