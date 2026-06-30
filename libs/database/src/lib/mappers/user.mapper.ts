import { User } from '@kodem/contracts';
import { UserId } from '@kodem/contracts';

type UserRow = {
  id: string;
  email: string;
  name: string;
  passwordHash: string | null;
  activeWorkspaceId: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export function mapUserRowToDomain(row: UserRow): User {
  return {
    id: row.id as UserId,
    email: row.email,
    name: row.name,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export type UserRowWithSecrets = UserRow;
