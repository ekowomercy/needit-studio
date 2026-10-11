import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ContactNeedDto, CreateNeedDto, RefineNeedDto } from './needs.dto';
import { NeedsService } from './needs.service';
import { AuthGuard } from '../auth/auth.guard';
import { CurrentUser } from '../common/current-user.decorator';
import { Public } from '../common/public.decorator';
import type { AuthUser } from '../auth/auth.guard';

@Controller('needs')
@UseGuards(AuthGuard)
export class NeedsController {
  constructor(private readonly needs: NeedsService) {}

  @Post()
  async create(@Body() dto: CreateNeedDto, @CurrentUser() user: AuthUser) {
    return this.needs.create(user.id, dto.rawText);
  }

  @Get('mine')
  async mine(@CurrentUser() user: AuthUser) {
    return this.needs.mine(user.id);
  }

  @Public()
  @Get('popular')
  async popular() {
    return this.needs.popular();
  }

  @Get(':id')
  async get(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.needs.get(id, user.id);
  }

  @Get(':id/results')
  async results(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.needs.results(id, user.id);
  }

  @Patch(':id')
  async refine(
    @Param('id') id: string,
    @Body() dto: RefineNeedDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.needs.refine(id, user.id, dto);
  }

  @Post(':id/contact')
  async contact(
    @Param('id') id: string,
    @Body() dto: ContactNeedDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.needs.contact(user.id, id, dto.providerId, dto.message);
  }
}
