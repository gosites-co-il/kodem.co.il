import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { AuthController } from './auth.controller';
import { ApiAuthService } from './auth.service';
import { GoogleStrategy } from './strategies/google.strategy';
import { GitHubStrategy } from './strategies/github.strategy';
import { FacebookStrategy } from './strategies/facebook.strategy';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

@Module({
  imports: [PassportModule.register({ session: false })],
  controllers: [AuthController],
  providers: [
    ApiAuthService,
    GoogleStrategy,
    GitHubStrategy,
    FacebookStrategy,
    JwtAuthGuard,
  ],
  exports: [ApiAuthService, JwtAuthGuard],
})
export class AuthModule {}
