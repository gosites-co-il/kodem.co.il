import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import {
  AuthService,
  JwtService,
  OAuthService,
} from '@kodem/platform/auth';
import {
  LoginInput,
  OAuthProfile,
  RegisterInput,
  User,
  UserId,
} from '@kodem/contracts';

@Injectable()
export class ApiAuthService {
  private readonly jwtService: JwtService;
  readonly authService: AuthService;
  readonly oauthService: OAuthService;

  constructor() {
    const secret =
      process.env['JWT_SECRET'] ?? 'kodem-dev-secret-change-in-production';
    this.jwtService = new JwtService({ secret });
    this.authService = new AuthService(this.jwtService);
    this.oauthService = new OAuthService(this.authService);
  }

  register(input: RegisterInput) {
    return this.authService.register(input);
  }

  login(input: LoginInput, rateKey?: string) {
    return this.authService.login(input, rateKey);
  }

  refresh(rawRefreshToken: string) {
    return this.authService.refresh(rawRefreshToken);
  }

  logout(userId: UserId) {
    return this.authService.logout(userId);
  }

  requestPasswordReset(email: string, rateKey?: string) {
    return this.authService.requestPasswordReset(email, rateKey);
  }

  confirmPasswordReset(token: string, password: string) {
    return this.authService.confirmPasswordReset(token, password);
  }

  verifyEmail(token: string) {
    return this.authService.verifyEmail(token);
  }

  sendEmailVerification(user: User, rateKey?: string) {
    return this.authService.sendEmailVerification(user, rateKey);
  }

  async handleOAuth(profile: OAuthProfile) {
    return this.oauthService.handleOAuthCallback(profile);
  }

  stripRefresh<T extends { refreshToken?: string }>(
    result: T,
  ): Omit<T, 'refreshToken'> {
    const { refreshToken: _, ...rest } = result;
    return rest;
  }

  wrapError(error: unknown): never {
    const message =
      error instanceof Error ? error.message : 'Authentication failed';
    if (
      message.includes('already exists') ||
      message.includes('Invalid email') ||
      message.includes('Too many') ||
      message.includes('required') ||
      message.includes('Invalid or expired')
    ) {
      throw new BadRequestException(message);
    }
    throw new UnauthorizedException(message);
  }
}
