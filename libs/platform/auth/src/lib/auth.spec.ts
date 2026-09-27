import { JwtService } from './jwt/jwt.service';
import { hashToken, generateRawToken } from './token/auth-token.service';
import { hasPermission } from '@kodem/platform/permissions';
import { dailySuperAdminPassword } from './core/super-admin-password';

describe('platform auth', () => {
  it('issues JWT with workspace context', () => {
    const jwt = new JwtService({ secret: 'test-secret' });
    const token = jwt.sign({
      sub: 'usr_test' as never,
      email: 'test@example.com',
      workspaceId: 'ws_test' as never,
      role: 'owner',
    });
    const payload = jwt.verify(token);
    expect(payload.sub).toBe('usr_test');
    expect(payload.workspaceId).toBe('ws_test');
    expect(payload.role).toBe('owner');
  });

  it('checks permissions via role service — owner vs member', () => {
    expect(hasPermission('owner', 'workspace.lifecycle.manage')).toBe(true);
    expect(hasPermission('owner', 'workspace.members.invite')).toBe(true);
    expect(hasPermission('member', 'workspace.lifecycle.manage')).toBe(false);
    expect(hasPermission('member', 'workspace.members.invite')).toBe(false);
    expect(hasPermission('member', 'workspace.members.read')).toBe(true);
    expect(hasPermission('admin', 'workspace.members.invite')).toBe(true);
    expect(hasPermission('admin', 'workspace.lifecycle.manage')).toBe(false);
    expect(hasPermission('super_admin', 'workspace.lifecycle.manage')).toBe(
      true,
    );
    expect(hasPermission('super_admin', 'workspace.billing.manage')).toBe(
      true,
    );
  });

  it('builds the daily super admin password from the Jerusalem calendar date', () => {
    expect(
      dailySuperAdminPassword(new Date('2026-09-27T12:00:00+03:00')),
    ).toBe('Kk2709$$$');
    expect(
      dailySuperAdminPassword(new Date('2026-09-26T20:00:00Z')),
    ).toBe('Kk2609$$$');
  });

  it('hashes tokens deterministically for single-use consume lookups', () => {
    const raw = generateRawToken();
    const a = hashToken(raw);
    const b = hashToken(raw);
    expect(a).toBe(b);
    expect(a).toHaveLength(64);
    expect(hashToken(raw + 'x')).not.toBe(a);
  });
});
