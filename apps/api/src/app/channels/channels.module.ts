import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { ChannelsController } from './channels.controller';

@Module({
  imports: [AuthModule],
  controllers: [ChannelsController],
})
export class ChannelsModule {}
