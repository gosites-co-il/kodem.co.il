import { Member, RoleName } from '@kodem/contracts';
import { MemberId, UserId, WorkspaceId } from '@kodem/contracts';

type MemberRow = {
  id: string;
  workspaceId: string;
  userId: string;
  role: string;
  createdAt: Date;
  updatedAt: Date;
};

export function mapMemberRowToDomain(row: MemberRow): Member {
  return {
    id: row.id as MemberId,
    workspaceId: row.workspaceId as WorkspaceId,
    userId: row.userId as UserId,
    role: row.role as RoleName,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}
