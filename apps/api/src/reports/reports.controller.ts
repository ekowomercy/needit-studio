import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { CreateReportDto, UpdateReportDto } from './dto/report.dto';
import { AuthGuard } from '../auth/auth.guard';
import { CurrentUser } from '../common/current-user.decorator';
import type { AuthUser } from '../auth/auth.guard';

@Controller('reports')
@UseGuards(AuthGuard)
export class ReportsController {
  constructor(private readonly reports: ReportsService) {}

  @Post()
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateReportDto) {
    return this.reports.create(user.id, dto);
  }

  @Get()
  list() {
    return this.reports.list();
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateReportDto) {
    return this.reports.update(id, dto);
  }
}
