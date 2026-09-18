import {
  CreateCrmBoardItemInput,
  CreateCrmBoardInput,
  CrmBoard,
  CrmBoardColumn,
  CrmBoardDetail,
  CrmBoardItem,
  CrmBoardPresetId,
  UpdateCrmBoardColumnInput,
  UpdateCrmBoardInput,
  UpdateCrmBoardItemInput,
  WorkspaceId,
  createId,
  getCrmBoardPreset,
} from '@kodem/contracts';
import { getPrismaClient } from './client';

type BoardRow = {
  id: string;
  workspaceId: string;
  name: string;
  preset: string;
  position: number;
  createdAt: Date;
  updatedAt: Date;
};

type ColumnRow = {
  id: string;
  workspaceId: string;
  boardId: string;
  key: string;
  label: string;
  position: number;
  createdAt: Date;
  updatedAt: Date;
};

type ItemRow = {
  id: string;
  workspaceId: string;
  boardId: string;
  columnId: string;
  title: string;
  description: string | null;
  position: number;
  leadId: string | null;
  contactId: string | null;
  taskId: string | null;
  createdAt: Date;
  updatedAt: Date;
};

function mapBoard(row: BoardRow): CrmBoard {
  return {
    id: row.id,
    workspaceId: row.workspaceId as WorkspaceId,
    name: row.name,
    preset: row.preset as CrmBoardPresetId,
    position: row.position,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

function mapColumn(row: ColumnRow): CrmBoardColumn {
  return {
    id: row.id,
    workspaceId: row.workspaceId as WorkspaceId,
    boardId: row.boardId,
    key: row.key,
    label: row.label,
    position: row.position,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

function mapItem(row: ItemRow): CrmBoardItem {
  return {
    id: row.id,
    workspaceId: row.workspaceId as WorkspaceId,
    boardId: row.boardId,
    columnId: row.columnId,
    title: row.title,
    description: row.description ?? undefined,
    position: row.position,
    leadId: row.leadId ?? undefined,
    contactId: row.contactId ?? undefined,
    taskId: row.taskId ?? undefined,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

function optionalString(value: string | undefined | null): string | null {
  if (value === undefined || value === null) return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export class CrmBoardRepository {
  private readonly db = getPrismaClient();

  async createWithColumns(
    workspaceId: WorkspaceId,
    input: CreateCrmBoardInput,
  ): Promise<CrmBoardDetail> {
    const preset = getCrmBoardPreset(input.preset);
    const maxPosition = await this.db.crmBoard.aggregate({
      where: { workspaceId },
      _max: { position: true },
    });
    const boardId = createId('brd');

    await this.db.$transaction(async (tx) => {
      await tx.crmBoard.create({
        data: {
          id: boardId,
          workspaceId,
          name: input.name.trim(),
          preset: input.preset,
          position: (maxPosition._max.position ?? -1) + 1,
        },
      });

      await tx.crmBoardColumn.createMany({
        data: preset.columns.map((column, index) => ({
          id: createId('bcol'),
          workspaceId,
          boardId,
          key: column.key,
          label: column.label,
          position: index,
        })),
      });
    });

    const detail = await this.findDetail(workspaceId, boardId);
    if (!detail) {
      throw new Error('Board not found after create');
    }
    return detail;
  }

  async list(workspaceId: WorkspaceId): Promise<CrmBoard[]> {
    const rows = await this.db.crmBoard.findMany({
      where: { workspaceId },
      orderBy: [{ position: 'asc' }, { createdAt: 'asc' }],
    });
    return rows.map(mapBoard);
  }

  async findById(
    workspaceId: WorkspaceId,
    id: string,
  ): Promise<CrmBoard | null> {
    const row = await this.db.crmBoard.findFirst({
      where: { id, workspaceId },
    });
    return row ? mapBoard(row) : null;
  }

  async findDetail(
    workspaceId: WorkspaceId,
    id: string,
  ): Promise<CrmBoardDetail | null> {
    const board = await this.findById(workspaceId, id);
    if (!board) return null;

    const [columns, items] = await Promise.all([
      this.db.crmBoardColumn.findMany({
        where: { boardId: id, workspaceId },
        orderBy: { position: 'asc' },
      }),
      this.db.crmBoardItem.findMany({
        where: { boardId: id, workspaceId },
        orderBy: [{ columnId: 'asc' }, { position: 'asc' }],
      }),
    ]);

    return {
      ...board,
      columns: columns.map(mapColumn),
      items: items.map(mapItem),
    };
  }

  async update(
    workspaceId: WorkspaceId,
    id: string,
    input: UpdateCrmBoardInput,
  ): Promise<CrmBoard | null> {
    const existing = await this.findById(workspaceId, id);
    if (!existing) return null;

    const row = await this.db.crmBoard.update({
      where: { id },
      data: {
        ...(input.name !== undefined ? { name: input.name.trim() } : {}),
        ...(input.position !== undefined ? { position: input.position } : {}),
      },
    });
    return mapBoard(row);
  }

  async delete(workspaceId: WorkspaceId, id: string): Promise<boolean> {
    const existing = await this.findById(workspaceId, id);
    if (!existing) return false;
    await this.db.crmBoard.delete({ where: { id } });
    return true;
  }

  async updateColumn(
    workspaceId: WorkspaceId,
    boardId: string,
    columnId: string,
    input: UpdateCrmBoardColumnInput,
  ): Promise<CrmBoardColumn | null> {
    const existing = await this.db.crmBoardColumn.findFirst({
      where: { id: columnId, boardId, workspaceId },
    });
    if (!existing) return null;

    const row = await this.db.crmBoardColumn.update({
      where: { id: columnId },
      data: {
        ...(input.label !== undefined ? { label: input.label.trim() } : {}),
        ...(input.position !== undefined ? { position: input.position } : {}),
      },
    });
    return mapColumn(row);
  }

  async createItem(
    workspaceId: WorkspaceId,
    boardId: string,
    input: CreateCrmBoardItemInput,
  ): Promise<CrmBoardItem | null> {
    const board = await this.findById(workspaceId, boardId);
    if (!board) return null;

    let columnId = input.columnId;
    if (!columnId) {
      const firstColumn = await this.db.crmBoardColumn.findFirst({
        where: { boardId, workspaceId },
        orderBy: { position: 'asc' },
      });
      if (!firstColumn) return null;
      columnId = firstColumn.id;
    } else {
      const column = await this.db.crmBoardColumn.findFirst({
        where: { id: columnId, boardId, workspaceId },
      });
      if (!column) return null;
    }

    const maxPosition = await this.db.crmBoardItem.aggregate({
      where: { columnId, workspaceId },
      _max: { position: true },
    });

    const row = await this.db.crmBoardItem.create({
      data: {
        id: createId('bitm'),
        workspaceId,
        boardId,
        columnId,
        title: input.title.trim(),
        description: optionalString(input.description),
        position: (maxPosition._max.position ?? -1) + 1,
        leadId: optionalString(input.leadId),
        contactId: optionalString(input.contactId),
        taskId: optionalString(input.taskId),
      },
    });
    return mapItem(row);
  }

  async findItem(
    workspaceId: WorkspaceId,
    boardId: string,
    itemId: string,
  ): Promise<CrmBoardItem | null> {
    const row = await this.db.crmBoardItem.findFirst({
      where: { id: itemId, boardId, workspaceId },
    });
    return row ? mapItem(row) : null;
  }

  async updateItem(
    workspaceId: WorkspaceId,
    boardId: string,
    itemId: string,
    input: UpdateCrmBoardItemInput,
  ): Promise<CrmBoardItem | null> {
    const existing = await this.findItem(workspaceId, boardId, itemId);
    if (!existing) return null;

    if (input.columnId) {
      const column = await this.db.crmBoardColumn.findFirst({
        where: { id: input.columnId, boardId, workspaceId },
      });
      if (!column) return null;
    }

    const row = await this.db.crmBoardItem.update({
      where: { id: itemId },
      data: {
        ...(input.title !== undefined ? { title: input.title.trim() } : {}),
        ...(input.description !== undefined
          ? { description: optionalString(input.description) }
          : {}),
        ...(input.columnId !== undefined ? { columnId: input.columnId } : {}),
        ...(input.position !== undefined ? { position: input.position } : {}),
        ...(input.leadId !== undefined
          ? { leadId: optionalString(input.leadId) }
          : {}),
        ...(input.contactId !== undefined
          ? { contactId: optionalString(input.contactId) }
          : {}),
        ...(input.taskId !== undefined
          ? { taskId: optionalString(input.taskId) }
          : {}),
      },
    });
    return mapItem(row);
  }

  async deleteItem(
    workspaceId: WorkspaceId,
    boardId: string,
    itemId: string,
  ): Promise<boolean> {
    const existing = await this.findItem(workspaceId, boardId, itemId);
    if (!existing) return false;
    await this.db.crmBoardItem.delete({ where: { id: itemId } });
    return true;
  }

  async countByWorkspace(workspaceId: WorkspaceId): Promise<number> {
    return this.db.crmBoard.count({ where: { workspaceId } });
  }
}
