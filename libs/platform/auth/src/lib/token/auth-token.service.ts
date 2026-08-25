import { createHash, randomBytes } from 'crypto';
import {
  AuthTokenType,
  UserId,
} from '@kodem/contracts';
import { AuthTokenRepository } from '@kodem/database';

function ttlMs(envKey: string, fallbackHours: number): number {
  const raw = process.env[envKey];
  if (raw) {
    const n = Number(raw);
    if (!Number.isNaN(n) && n > 0) return n;
  }
  return fallbackHours * 60 * 60 * 1000;
}

export function hashToken(raw: string): string {
  return createHash('sha256').update(raw).digest('hex');
}

export function generateRawToken(): string {
  return randomBytes(32).toString('base64url');
}

export class AuthTokenService {
  private readonly repo = new AuthTokenRepository();

  async issue(
    userId: UserId,
    type: AuthTokenType,
  ): Promise<{ raw: string; expiresAt: Date }> {
    if (type === 'refresh') {
      await this.repo.revokeAllForUser(userId, 'refresh');
    }

    const raw = generateRawToken();
    const expiresAt = new Date(Date.now() + this.ttlFor(type));
    await this.repo.create({
      userId,
      type,
      tokenHash: hashToken(raw),
      expiresAt,
    });
    return { raw, expiresAt };
  }

  async consume(
    raw: string,
    type: AuthTokenType,
  ): Promise<{ userId: UserId } | null> {
    const record = await this.repo.findValidByHash(hashToken(raw), type);
    if (!record) return null;
    await this.repo.markUsed(record.id);
    return { userId: record.userId };
  }

  async validateRefresh(
    raw: string,
  ): Promise<{ userId: UserId; tokenId: string } | null> {
    const record = await this.repo.findValidByHash(hashToken(raw), 'refresh');
    if (!record) return null;
    return { userId: record.userId, tokenId: record.id };
  }

  async rotateRefresh(
    userId: UserId,
    previousTokenId: string,
  ): Promise<{ raw: string; expiresAt: Date }> {
    await this.repo.markUsed(previousTokenId);
    return this.issue(userId, 'refresh');
  }

  async revokeRefresh(userId: UserId): Promise<void> {
    await this.repo.revokeAllForUser(userId, 'refresh');
  }

  private ttlFor(type: AuthTokenType): number {
    switch (type) {
      case 'password_reset':
        return ttlMs('PASSWORD_RESET_TOKEN_TTL', 1);
      case 'email_verification':
        return ttlMs('EMAIL_VERIFICATION_TOKEN_TTL', 24);
      case 'refresh':
        return ttlMs('REFRESH_TOKEN_TTL', 24 * 14);
      default:
        return 60 * 60 * 1000;
    }
  }
}
