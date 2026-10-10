import { Module } from '@nestjs/common';
import { NeedsController } from './needs.controller';
import { NeedsService } from './needs.service';
import { OpenAiIntentClient } from './llm-intent.client';
import { DatabaseModule } from '../database/database.module';

@Module({
  imports: [DatabaseModule],
  controllers: [NeedsController],
  providers: [NeedsService, OpenAiIntentClient],
})
export class NeedsModule {}
