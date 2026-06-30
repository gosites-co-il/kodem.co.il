import { Auditable } from './types';
import { UserId } from './ids';

export interface User extends Auditable {
  id: UserId;
  email: string;
  name: string;
}
