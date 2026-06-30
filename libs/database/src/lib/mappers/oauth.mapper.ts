import { OAuthAccount, OAuthProvider } from '@kodem/contracts';
import { UserId } from '@kodem/contracts';

type OAuthAccountRow = {
  id: string;
  provider: string;
  providerUserId: string;
  email: string;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
};

export function mapOAuthAccountRowToDomain(row: OAuthAccountRow): OAuthAccount {
  return {
    id: row.id,
    provider: row.provider as OAuthProvider,
    providerUserId: row.providerUserId,
    email: row.email,
    userId: row.userId as UserId,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}
