import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { ConnectionsController } from './connections.controller';
import { ConnectionsOAuthController } from './connections-oauth.controller';

@Module({
  imports: [AuthModule],
  controllers: [ConnectionsController, ConnectionsOAuthController],
})
export class ConnectionsModule {}
