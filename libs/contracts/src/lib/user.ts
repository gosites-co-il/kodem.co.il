import { Auditable } from './types';
import { UserId } from './ids';

export type PlatformRole = 'super_admin';

export interface User extends Auditable {
  id: UserId;
  email: string;
  name: string;
  emailVerifiedAt?: Date | null;
  /** Platform operator. Independent of workspace membership role. */
  platformRole?: PlatformRole | null;
}
