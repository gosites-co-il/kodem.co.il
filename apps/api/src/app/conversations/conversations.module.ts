import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { ConversationsController } from './conversations.controller';
import { ConversationsIntakeController } from './conversations-intake.controller';

@Module({
  imports: [AuthModule],
  controllers: [ConversationsController, ConversationsIntakeController],
})
export class ConversationsModule {}
