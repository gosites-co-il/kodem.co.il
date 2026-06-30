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
import { LoginInput, OAuthProfile, RegisterInput } from '@kodem/contracts';

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

  login(input: LoginInput) {
    return this.authService.login(input);
  }

  async handleOAuth(profile: OAuthProfile) {
    return this.oauthService.handleOAuthCallback(profile);
  }

  wrapError(error: unknown): never {
    const message =
      error instanceof Error ? error.message : 'Authentication failed';
    if (
      message.includes('already exists') ||
      message.includes('Invalid email')
    ) {
      throw new BadRequestException(message);
    }
    throw new UnauthorizedException(message);
  }
}
