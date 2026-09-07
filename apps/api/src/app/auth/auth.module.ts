import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { AuthController } from './auth.controller';
import { ApiAuthService } from './auth.service';
import { GoogleStrategy } from './strategies/google.strategy';
import { GitHubStrategy } from './strategies/github.strategy';
import { FacebookStrategy } from './strategies/facebook.strategy';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { PermissionsGuard } from './guards/permissions.guard';
import { ModuleGuard } from './guards/module.guard';

@Module({
  imports: [PassportModule.register({ session: false })],
  controllers: [AuthController],
  providers: [
    ApiAuthService,
    GoogleStrategy,
    GitHubStrategy,
    FacebookStrategy,
    JwtAuthGuard,
    PermissionsGuard,
    ModuleGuard,
  ],
  exports: [ApiAuthService, JwtAuthGuard, PermissionsGuard, ModuleGuard],
})
export class AuthModule {}
