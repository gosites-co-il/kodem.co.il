import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { ChannelsController } from './channels.controller';
import { MetaWebhookController } from './meta-webhook.controller';

@Module({
  imports: [AuthModule],
  controllers: [ChannelsController, MetaWebhookController],
})
export class ChannelsModule {}
