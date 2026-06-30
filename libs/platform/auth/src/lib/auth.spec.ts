import { JwtService } from './jwt/jwt.service';
import { AuthService } from './core/auth.service';
import { hasPermission } from '@kodem/platform/permissions';

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

  it('checks permissions via role service', () => {
    expect(hasPermission('owner', 'workspace:admin')).toBe(true);
    expect(hasPermission('member', 'workspace:admin')).toBe(false);
  });

  it('creates auth service', () => {
    const jwt = new JwtService({ secret: 'test-secret' });
    expect(new AuthService(jwt)).toBeDefined();
  });
});
