import { Module } from '@nestjs/common';
import { HealthController } from './health.controller';
import { WorkspaceModule } from './workspace/workspace.module';
import { AuthModule } from './auth/auth.module';
import { PlatformWorkspaceModule } from './platform-workspace/platform-workspace.module';
import { EntryModule } from './entry/entry.module';
import { BillingModule } from './billing/billing.module';
import { CatalogController } from './catalog/catalog.controller';
import { PlatformConfigController } from './platform/platform-config.controller';
import { FeatureFlagsController } from './feature-flags/feature-flags.controller';

@Module({
  imports: [
    AuthModule,
    PlatformWorkspaceModule,
    WorkspaceModule,
    EntryModule,
    BillingModule,
  ],
  controllers: [
    HealthController,
    CatalogController,
    PlatformConfigController,
    FeatureFlagsController,
  ],
})
export class AppModule {}
