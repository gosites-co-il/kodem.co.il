import { Workspace, WorkspaceId, UserId } from '@kodem/contracts';

type WorkspaceRow = {
  id: string;
  name: string;
  slug: string;
  ownerId: string;
  status: string;
  websiteUrl: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export function mapWorkspaceRowToDomain(row: WorkspaceRow): Workspace {
  return {
    id: row.id as WorkspaceId,
    name: row.name,
    slug: row.slug,
    ownerId: row.ownerId as UserId,
    status: row.status as Workspace['status'],
    websiteUrl: row.websiteUrl ?? undefined,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}
