import { User } from '@kodem/contracts';
import { UserId } from '@kodem/contracts';

type UserRow = {
  id: string;
  email: string;
  name: string;
  passwordHash: string | null;
  activeWorkspaceId: string | null;
  emailVerifiedAt?: Date | null;
  platformRole?: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export function mapUserRowToDomain(row: UserRow): User {
  return {
    id: row.id as UserId,
    email: row.email,
    name: row.name,
    emailVerifiedAt: row.emailVerifiedAt ?? null,
    platformRole: row.platformRole === 'super_admin' ? 'super_admin' : null,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export type UserRowWithSecrets = UserRow;
