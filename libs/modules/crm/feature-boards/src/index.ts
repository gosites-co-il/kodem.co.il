import {
  CRM_BOARD_PRESET_IDS,
  CRM_BOARD_PRESETS,
  CreateCrmBoardInput,
  CreateCrmBoardItemInput,
  CrmBoard,
  CrmBoardColumn,
  CrmBoardDetail,
  CrmBoardItem,
  CrmBoardPresetId,
  UpdateCrmBoardColumnInput,
  UpdateCrmBoardInput,
  UpdateCrmBoardItemInput,
  WorkspaceId,
} from '@kodem/contracts';
import { CrmBoardRepository } from '@kodem/database';

export {
  CRM_BOARD_PRESETS,
  CRM_BOARD_PRESET_IDS,
  getCrmBoardPreset,
} from '@kodem/contracts';
export type {
  CrmBoard,
  CrmBoardColumn,
  CrmBoardDetail,
  CrmBoardItem,
  CrmBoardPresetId,
  CrmBoardPresetDefinition,
  CreateCrmBoardInput,
  CreateCrmBoardItemInput,
  UpdateCrmBoardInput,
  UpdateCrmBoardItemInput,
  UpdateCrmBoardColumnInput,
} from '@kodem/contracts';

export class BoardService {
  private readonly boards = new CrmBoardRepository();

  listPresets() {
    return CRM_BOARD_PRESETS;
  }

  create(
    workspaceId: WorkspaceId,
    input: CreateCrmBoardInput,
  ): Promise<CrmBoardDetail> {
    if (!input.name?.trim()) {
      throw new Error('Board name is required');
    }
    if (!CRM_BOARD_PRESET_IDS.includes(input.preset)) {
      throw new Error('Invalid board preset');
    }
    return this.boards.createWithColumns(workspaceId, input);
  }

  list(workspaceId: WorkspaceId): Promise<CrmBoard[]> {
    return this.boards.list(workspaceId);
  }

  get(
    workspaceId: WorkspaceId,
    boardId: string,
  ): Promise<CrmBoardDetail | null> {
    return this.boards.findDetail(workspaceId, boardId);
  }

  async update(
    workspaceId: WorkspaceId,
    boardId: string,
    input: UpdateCrmBoardInput,
  ): Promise<CrmBoard> {
    const updated = await this.boards.update(workspaceId, boardId, input);
    if (!updated) {
      throw new Error('Board not found');
    }
    return updated;
  }

  async delete(workspaceId: WorkspaceId, boardId: string): Promise<void> {
    const deleted = await this.boards.delete(workspaceId, boardId);
    if (!deleted) {
      throw new Error('Board not found');
    }
  }

  async updateColumn(
    workspaceId: WorkspaceId,
    boardId: string,
    columnId: string,
    input: UpdateCrmBoardColumnInput,
  ): Promise<CrmBoardColumn> {
    const updated = await this.boards.updateColumn(
      workspaceId,
      boardId,
      columnId,
      input,
    );
    if (!updated) {
      throw new Error('Column not found');
    }
    return updated;
  }

  async createItem(
    workspaceId: WorkspaceId,
    boardId: string,
    input: CreateCrmBoardItemInput,
  ): Promise<CrmBoardItem> {
    if (!input.title?.trim()) {
      throw new Error('Item title is required');
    }
    const item = await this.boards.createItem(workspaceId, boardId, input);
    if (!item) {
      throw new Error('Board not found');
    }
    return item;
  }

  async updateItem(
    workspaceId: WorkspaceId,
    boardId: string,
    itemId: string,
    input: UpdateCrmBoardItemInput,
  ): Promise<CrmBoardItem> {
    const item = await this.boards.updateItem(
      workspaceId,
      boardId,
      itemId,
      input,
    );
    if (!item) {
      throw new Error('Item not found');
    }
    return item;
  }

  async moveItem(
    workspaceId: WorkspaceId,
    boardId: string,
    itemId: string,
    columnId: string,
    position?: number,
  ): Promise<CrmBoardItem> {
    return this.updateItem(workspaceId, boardId, itemId, {
      columnId,
      ...(position !== undefined ? { position } : {}),
    });
  }

  async deleteItem(
    workspaceId: WorkspaceId,
    boardId: string,
    itemId: string,
  ): Promise<void> {
    const deleted = await this.boards.deleteItem(workspaceId, boardId, itemId);
    if (!deleted) {
      throw new Error('Item not found');
    }
  }

  count(workspaceId: WorkspaceId): Promise<number> {
    return this.boards.countByWorkspace(workspaceId);
  }
}
