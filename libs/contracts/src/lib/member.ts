import { Auditable } from './types';
import { MemberId, UserId, WorkspaceId } from './ids';
import { RoleName } from './role';

export interface Member extends Auditable {
  id: MemberId;
  workspaceId: WorkspaceId;
  userId: UserId;
  role: RoleName;
}
