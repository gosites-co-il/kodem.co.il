import { getPrismaClient } from '@kodem/database';

/**
 * Deletes expired auth tokens, invites, and old notification outbox rows.
 * Intended to run periodically from the worker (no separate job framework).
 */
export class PlatformCleanupService {
  private readonly db = getPrismaClient();

  async run(): Promise<{
    authTokens: number;
    invites: number;
    outbox: number;
  }> {
    const now = new Date();
    const outboxCutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const [authTokens, invites, outbox] = await Promise.all([
      this.db.authToken.deleteMany({
        where: {
          OR: [
            { expiresAt: { lt: now }, usedAt: { not: null } },
            { expiresAt: { lt: now }, revokedAt: { not: null } },
            { expiresAt: { lt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } },
          ],
        },
      }),
      this.db.workspaceInvite.updateMany({
        where: {
          status: 'pending',
          expiresAt: { lt: now },
        },
        data: { status: 'expired' },
      }),
      this.db.notificationOutbox.deleteMany({
        where: {
          status: { in: ['sent', 'failed'] },
          createdAt: { lt: outboxCutoff },
        },
      }),
    ]);

    return {
      authTokens: authTokens.count,
      invites: invites.count,
      outbox: outbox.count,
    };
  }
}
