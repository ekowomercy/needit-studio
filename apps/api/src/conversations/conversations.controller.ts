import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ConversationsService } from './conversations.service';
import { SendMessageDto } from './dto/conversation.dto';
import { AuthGuard } from '../auth/auth.guard';
import { CurrentUser } from '../common/current-user.decorator';
import type { AuthUser } from '../auth/auth.guard';

@Controller('conversations')
@UseGuards(AuthGuard)
export class ConversationsController {
  constructor(private readonly conversations: ConversationsService) {}

  @Get()
  list(@CurrentUser() user: AuthUser) {
    return this.conversations.listForUser(user.id);
  }

  @Get(':id')
  get(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.conversations.get(id, user.id);
  }

  @Get(':id/messages')
  messages(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.conversations.listMessages(id, user.id);
  }

  @Post(':id/messages')
  send(@Param('id') id: string, @Body() dto: SendMessageDto, @CurrentUser() user: AuthUser) {
    return this.conversations.send(id, user.id, dto);
  }

  @Post(':id/read')
  read(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.conversations.markRead(id, user.id);
  }
}
