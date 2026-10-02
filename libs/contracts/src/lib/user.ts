import { Auditable } from './types';
import { UserId } from './ids';
import { SystemRole } from './role';

/** Platform operator roles. A user with no platform role is null. */
export type PlatformRole = typeof SystemRole.SuperAdmin;

export interface User extends Auditable {
  id: UserId;
  email: string;
  name: string;
  emailVerifiedAt?: Date | null;
  /** Platform operator. Independent of workspace membership role. */
  platformRole?: PlatformRole | null;
}
