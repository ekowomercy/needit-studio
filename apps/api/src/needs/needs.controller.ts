import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
import { ContactNeedDto, CreateNeedDto, RefineNeedDto } from './needs.dto';
import { NeedsService } from './needs.service';
import { AuthGuard } from '../auth/auth.guard';
import { Public } from '../common/public.decorator';

interface AuthedRequest extends Request {
  user: { sub: string };
}

@Controller('needs')
@UseGuards(AuthGuard)
export class NeedsController {
  constructor(private readonly needs: NeedsService) {}

  @Post()
  async create(@Body() dto: CreateNeedDto, @Req() req: AuthedRequest) {
    return this.needs.create(req.user.sub, dto.rawText);
  }

  @Get('mine')
  async mine(@Req() req: AuthedRequest) {
    return this.needs.mine(req.user.sub);
  }

  @Public()
  @Get('popular')
  async popular() {
    return this.needs.popular();
  }

  @Get(':id')
  async get(@Param('id') id: string, @Req() req: AuthedRequest) {
    return this.needs.get(id, req.user.sub);
  }

  @Get(':id/results')
  async results(@Param('id') id: string, @Req() req: AuthedRequest) {
    return this.needs.results(id, req.user.sub);
  }

  @Patch(':id')
  async refine(
    @Param('id') id: string,
    @Body() dto: RefineNeedDto,
    @Req() req: AuthedRequest,
  ) {
    return this.needs.refine(id, req.user.sub, dto);
  }

  @Post(':id/contact')
  async contact(
    @Param('id') id: string,
    @Body() dto: ContactNeedDto,
    @Req() req: AuthedRequest,
  ) {
    return this.needs.contact(req.user.sub, id, dto.providerId, dto.message);
  }
}
