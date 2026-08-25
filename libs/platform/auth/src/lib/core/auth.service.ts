import {
  AuthResult,
  JwtPayload,
  LoginInput,
  PlatformContext,
  RegisterInput,
  RefreshResult,
  User,
  UserId,
} from '@kodem/contracts';
import { UserService } from '@kodem/platform/identity';
import { NotificationService } from '@kodem/platform/notifications';
import { AuditService } from '@kodem/platform/audit';
import {
  WorkspaceResolver,
  ResolvedWorkspace,
  WorkspaceService,
} from '@kodem/platform/workspace';
import { JwtService } from '../jwt/jwt.service';
import { AuthTokenService } from '../token/auth-token.service';
import { RateLimitService } from '../rate-limit/rate-limit.service';
import * as bcrypt from 'bcryptjs';
import { UserRepository } from '@kodem/database';

const accessTtl = process.env['ACCESS_TOKEN_TTL'] ?? '15m';

export class AuthService {
  private readonly userService = new UserService();
  private readonly userRepo = new UserRepository();
  private readonly workspaceResolver = new WorkspaceResolver();
  private readonly workspaceService = new WorkspaceService();
  private readonly tokenService = new AuthTokenService();
  private readonly notifications = new NotificationService();
  private readonly audit = new AuditService();
  private readonly loginLimiter = new RateLimitService(20, 15 * 60 * 1000);
  private readonly resetLimiter = new RateLimitService(5, 15 * 60 * 1000);
  private readonly verifyLimiter = new RateLimitService(5, 15 * 60 * 1000);
  private readonly jwtService: JwtService;

  constructor(jwtService: JwtService) {
    this.jwtService = jwtService;
  }

  async register(
    input: RegisterInput,
  ): Promise<AuthResult & { refreshToken: string }> {
    const user = await this.userService.createWithPassword(input);
    const resolved = await this.workspaceResolver.resolveForUser(user);
    await this.sendEmailVerification(user);
    return this.issueSession(user, resolved);
  }

  async login(
    input: LoginInput,
    rateKey?: string,
  ): Promise<AuthResult & { refreshToken: string }> {
    const key = `auth.login:${(rateKey ?? input.email).toLowerCase()}`;
    const limit = this.loginLimiter.check(key);
    if (!limit.allowed) {
      throw new Error('Too many login attempts. Try again later.');
    }

    const user = await this.userService.verifyPassword(
      input.email,
      input.password,
    );
    if (!user) {
      throw new Error('Invalid email or password');
    }
    const resolved = await this.workspaceResolver.resolveForUser(user);
    return this.issueSession(user, resolved);
  }

  issueAuthResult(user: User, resolved: ResolvedWorkspace): AuthResult {
    const accessToken = this.jwtService.sign(
      {
        sub: user.id,
        email: user.email,
        workspaceId: resolved.workspace.id,
        role: resolved.role,
      },
      accessTtl,
    );

    return {
      accessToken,
      token: accessToken,
      user,
      workspace: resolved.workspace,
      role: resolved.role,
      emailVerified: Boolean(user.emailVerifiedAt),
    };
  }

  async issueSession(
    user: User,
    resolved: ResolvedWorkspace,
  ): Promise<AuthResult & { refreshToken: string }> {
    const auth = this.issueAuthResult(user, resolved);
    const refresh = await this.tokenService.issue(user.id, 'refresh');
    return { ...auth, refreshToken: refresh.raw };
  }

  async refresh(
    rawRefreshToken: string,
  ): Promise<RefreshResult & { refreshToken: string }> {
    const valid = await this.tokenService.validateRefresh(rawRefreshToken);
    if (!valid) {
      throw new Error('Invalid or expired refresh token');
    }

    const user = await this.userService.findById(valid.userId);
    if (!user) {
      throw new Error('User not found');
    }

    const rotated = await this.tokenService.rotateRefresh(
      user.id,
      valid.tokenId,
    );
    const resolved = await this.workspaceResolver.resolveForUser(user);
    const auth = this.issueAuthResult(user, resolved);
    return { ...auth, refreshToken: rotated.raw };
  }

  async logout(userId: UserId): Promise<void> {
    await this.tokenService.revokeRefresh(userId);
  }

  async requestPasswordReset(email: string, rateKey?: string): Promise<void> {
    const key = `auth.reset:${(rateKey ?? email).toLowerCase()}`;
    const limit = this.resetLimiter.check(key);
    if (!limit.allowed) {
      return;
    }

    const user = await this.userService.findByEmail(email);
    if (!user) {
      return;
    }

    const { raw } = await this.tokenService.issue(user.id, 'password_reset');
    const appUrl = process.env['APP_URL'] ?? 'http://localhost:3000';
    await this.notifications.notify({
      type: 'auth.password_reset',
      to: user.email,
      subject: 'Reset your Kodem password',
      userId: user.id,
      data: {
        resetUrl: `${appUrl}/login/reset?token=${encodeURIComponent(raw)}`,
      },
    });
    await this.audit.record({
      actorId: user.id,
      action: 'auth.password_reset_requested',
      metadata: { email: user.email },
    });
  }

  async confirmPasswordReset(token: string, password: string): Promise<void> {
    const consumed = await this.tokenService.consume(token, 'password_reset');
    if (!consumed) {
      throw new Error('Invalid or expired reset token');
    }

    const passwordHash = await bcrypt.hash(password, 12);
    await this.userRepo.setPasswordHash(consumed.userId, passwordHash);
    await this.tokenService.revokeRefresh(consumed.userId);
    await this.audit.record({
      actorId: consumed.userId,
      action: 'auth.password_reset_completed',
    });
  }

  async sendEmailVerification(user: User, rateKey?: string): Promise<void> {
    if (user.emailVerifiedAt) return;

    const key = `auth.verify:${(rateKey ?? user.email).toLowerCase()}`;
    const limit = this.verifyLimiter.check(key);
    if (!limit.allowed) {
      throw new Error('Too many verification emails. Try again later.');
    }

    const { raw } = await this.tokenService.issue(
      user.id,
      'email_verification',
    );
    const appUrl = process.env['APP_URL'] ?? 'http://localhost:3000';
    await this.notifications.notify({
      type: 'auth.email_verification',
      to: user.email,
      subject: 'Verify your Kodem email',
      userId: user.id,
      data: {
        verifyUrl: `${appUrl}/auth/verify-email?token=${encodeURIComponent(raw)}`,
      },
    });
  }

  async verifyEmail(token: string): Promise<User> {
    const consumed = await this.tokenService.consume(
      token,
      'email_verification',
    );
    if (!consumed) {
      throw new Error('Invalid or expired verification token');
    }

    const user = await this.userRepo.setEmailVerifiedAt(consumed.userId);
    await this.audit.record({
      actorId: user.id,
      action: 'auth.email_verified',
    });
    return user;
  }

  async resolveContext(payload: JwtPayload): Promise<PlatformContext> {
    const user = await this.userService.findById(payload.sub);
    if (!user) {
      throw new Error('User not found');
    }

    const workspace = await this.workspaceService.findById(payload.workspaceId);
    if (!workspace) {
      throw new Error('Workspace not found');
    }

    if (workspace.status === 'deactivated') {
      throw new Error('Workspace is deactivated');
    }

    const membership = await this.workspaceService.assertMembership(
      user.id,
      workspace.id,
    );

    if (membership.role !== payload.role) {
      throw new Error('Token role does not match current membership');
    }

    return {
      user,
      workspace,
      role: membership.role,
      membership,
    };
  }
}
