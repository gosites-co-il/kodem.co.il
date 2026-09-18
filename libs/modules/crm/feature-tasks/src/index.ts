import {
  CreateTaskInput,
  Task,
  TaskStatus,
  UpdateTaskInput,
  WorkspaceId,
} from '@kodem/contracts';
import { CrmTaskRepository, PrismaEventStore } from '@kodem/database';
import { EVENT_TYPES, KodemEventBus } from '@kodem/events';

export type { Task } from '@kodem/contracts';
export { TASK_STATUSES, TASK_PRIORITIES } from '@kodem/contracts';
export type { TaskStatus, TaskPriority } from '@kodem/contracts';

export class TaskService {
  private readonly tasks = new CrmTaskRepository();
  private readonly eventBus = new KodemEventBus(new PrismaEventStore());

  create(workspaceId: WorkspaceId, input: CreateTaskInput): Promise<Task> {
    if (!input.title?.trim()) {
      throw new Error('Task title is required');
    }
    return this.tasks.create(workspaceId, input);
  }

  list(
    workspaceId: WorkspaceId,
    filters?: { leadId?: string; contactId?: string; status?: TaskStatus },
  ): Promise<Task[]> {
    return this.tasks.findByWorkspace(workspaceId, filters);
  }

  get(workspaceId: WorkspaceId, id: string): Promise<Task | null> {
    return this.tasks.findById(workspaceId, id);
  }

  async update(
    workspaceId: WorkspaceId,
    id: string,
    input: UpdateTaskInput,
  ): Promise<Task> {
    const updated = await this.tasks.update(workspaceId, id, input);
    if (!updated) {
      throw new Error('Task not found');
    }
    return updated;
  }

  async complete(workspaceId: WorkspaceId, id: string): Promise<Task> {
    const task = await this.tasks.findById(workspaceId, id);
    if (!task) {
      throw new Error('Task not found');
    }
    if (task.status === 'completed') {
      return task;
    }

    const completed = await this.tasks.update(workspaceId, id, {
      status: 'completed',
    });
    if (!completed) {
      throw new Error('Task not found');
    }

    await this.eventBus.emit({
      type: EVENT_TYPES.TASK_COMPLETED,
      workspaceId,
      payload: {
        taskId: completed.id,
        title: completed.title,
        leadId: completed.leadId ?? null,
        contactId: completed.contactId ?? null,
      },
    });

    return completed;
  }

  async delete(workspaceId: WorkspaceId, id: string): Promise<void> {
    const deleted = await this.tasks.delete(workspaceId, id);
    if (!deleted) {
      throw new Error('Task not found');
    }
  }

  count(workspaceId: WorkspaceId, status?: TaskStatus): Promise<number> {
    return this.tasks.countByWorkspace(workspaceId, status);
  }
}
