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
  UseGuards,
} from '@nestjs/common';
import type {
  CreateCrmBoardInput,
  CreateCrmBoardItemInput,
  PlatformContext,
  UpdateCrmBoardColumnInput,
  UpdateCrmBoardInput,
  UpdateCrmBoardItemInput,
} from '@kodem/contracts';
import { BoardService } from '@kodem/modules/crm';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ModuleGuard } from '../auth/guards/module.guard';
import { RequireModule } from '../auth/decorators/require-module.decorator';
import { CurrentContext } from '../auth/decorators/current-context.decorator';

@Controller('crm')
@UseGuards(JwtAuthGuard, ModuleGuard)
@RequireModule('crm')
export class CrmBoardsController {
  private readonly boards = new BoardService();

  @Get('presets')
  listPresets() {
    return { presets: this.boards.listPresets() };
  }

  @Get('boards')
  async list(@CurrentContext() context: PlatformContext) {
    const boards = await this.boards.list(context.workspace.id);
    return { boards };
  }

  @Post('boards')
  async create(
    @CurrentContext() context: PlatformContext,
    @Body() body: CreateCrmBoardInput,
  ) {
    try {
      const board = await this.boards.create(context.workspace.id, body);
      return { board };
    } catch (error) {
      throw new BadRequestException(
        error instanceof Error ? error.message : 'Failed to create board',
      );
    }
  }

  @Get('boards/:boardId')
  async get(
    @CurrentContext() context: PlatformContext,
    @Param('boardId') boardId: string,
  ) {
    const board = await this.boards.get(context.workspace.id, boardId);
    if (!board) throw new NotFoundException('Board not found');
    return { board };
  }

  @Patch('boards/:boardId')
  async update(
    @CurrentContext() context: PlatformContext,
    @Param('boardId') boardId: string,
    @Body() body: UpdateCrmBoardInput,
  ) {
    try {
      const board = await this.boards.update(
        context.workspace.id,
        boardId,
        body,
      );
      return { board };
    } catch (error) {
      if (error instanceof Error && error.message === 'Board not found') {
        throw new NotFoundException(error.message);
      }
      throw new BadRequestException(
        error instanceof Error ? error.message : 'Failed to update board',
      );
    }
  }

  @Delete('boards/:boardId')
  @HttpCode(204)
  async remove(
    @CurrentContext() context: PlatformContext,
    @Param('boardId') boardId: string,
  ) {
    try {
      await this.boards.delete(context.workspace.id, boardId);
    } catch (error) {
      if (error instanceof Error && error.message === 'Board not found') {
        throw new NotFoundException(error.message);
      }
      throw new BadRequestException(
        error instanceof Error ? error.message : 'Failed to delete board',
      );
    }
  }

  @Patch('boards/:boardId/columns/:columnId')
  async updateColumn(
    @CurrentContext() context: PlatformContext,
    @Param('boardId') boardId: string,
    @Param('columnId') columnId: string,
    @Body() body: UpdateCrmBoardColumnInput,
  ) {
    try {
      const column = await this.boards.updateColumn(
        context.workspace.id,
        boardId,
        columnId,
        body,
      );
      return { column };
    } catch (error) {
      if (error instanceof Error && error.message === 'Column not found') {
        throw new NotFoundException(error.message);
      }
      throw new BadRequestException(
        error instanceof Error ? error.message : 'Failed to update column',
      );
    }
  }

  @Post('boards/:boardId/items')
  async createItem(
    @CurrentContext() context: PlatformContext,
    @Param('boardId') boardId: string,
    @Body() body: CreateCrmBoardItemInput,
  ) {
    try {
      const item = await this.boards.createItem(
        context.workspace.id,
        boardId,
        body,
      );
      return { item };
    } catch (error) {
      if (error instanceof Error && error.message === 'Board not found') {
        throw new NotFoundException(error.message);
      }
      throw new BadRequestException(
        error instanceof Error ? error.message : 'Failed to create item',
      );
    }
  }

  @Patch('boards/:boardId/items/:itemId')
  async updateItem(
    @CurrentContext() context: PlatformContext,
    @Param('boardId') boardId: string,
    @Param('itemId') itemId: string,
    @Body() body: UpdateCrmBoardItemInput,
  ) {
    try {
      const item = await this.boards.updateItem(
        context.workspace.id,
        boardId,
        itemId,
        body,
      );
      return { item };
    } catch (error) {
      if (error instanceof Error && error.message === 'Item not found') {
        throw new NotFoundException(error.message);
      }
      throw new BadRequestException(
        error instanceof Error ? error.message : 'Failed to update item',
      );
    }
  }

  @Delete('boards/:boardId/items/:itemId')
  @HttpCode(204)
  async removeItem(
    @CurrentContext() context: PlatformContext,
    @Param('boardId') boardId: string,
    @Param('itemId') itemId: string,
  ) {
    try {
      await this.boards.deleteItem(context.workspace.id, boardId, itemId);
    } catch (error) {
      if (error instanceof Error && error.message === 'Item not found') {
        throw new NotFoundException(error.message);
      }
      throw new BadRequestException(
        error instanceof Error ? error.message : 'Failed to delete item',
      );
    }
  }
}
