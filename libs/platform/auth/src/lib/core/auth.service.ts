import {
  AuthResult,
  JwtPayload,
  LoginInput,
  PlatformContext,
  RegisterInput,
  User,
} from '@kodem/contracts';
import { UserService } from '@kodem/platform/identity';
import {
  WorkspaceResolver,
  ResolvedWorkspace,
  WorkspaceService,
} from '@kodem/platform/workspace';
import { JwtService } from '../jwt/jwt.service';

export class AuthService {
  private readonly userService = new UserService();
  private readonly workspaceResolver = new WorkspaceResolver();
  private readonly workspaceService = new WorkspaceService();
  private readonly jwtService: JwtService;

  constructor(jwtService: JwtService) {
    this.jwtService = jwtService;
  }

  async register(input: RegisterInput): Promise<AuthResult> {
    const user = await this.userService.createWithPassword(input);
    const resolved = await this.workspaceResolver.resolveForUser(user);
    return this.issueAuthResult(user, resolved);
  }

  async login(input: LoginInput): Promise<AuthResult> {
    const user = await this.userService.verifyPassword(
      input.email,
      input.password,
    );
    if (!user) {
      throw new Error('Invalid email or password');
    }
    const resolved = await this.workspaceResolver.resolveForUser(user);
    return this.issueAuthResult(user, resolved);
  }

  issueAuthResult(
    user: User,
    resolved: ResolvedWorkspace,
  ): AuthResult {
    const token = this.jwtService.sign({
      sub: user.id,
      email: user.email,
      workspaceId: resolved.workspace.id,
      role: resolved.role,
    });

    return {
      token,
      user,
      workspace: resolved.workspace,
      role: resolved.role,
    };
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
