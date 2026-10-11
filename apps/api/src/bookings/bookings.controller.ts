import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { BookingsService } from './bookings.service';
import { CreateBookingDto, UpdateBookingDto } from './dto/booking.dto';
import { AuthGuard } from '../auth/auth.guard';
import { CurrentUser } from '../common/current-user.decorator';
import type { AuthUser } from '../auth/auth.guard';

@Controller('bookings')
@UseGuards(AuthGuard)
export class BookingsController {
  constructor(private readonly bookings: BookingsService) {}

  @Post()
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateBookingDto) {
    return this.bookings.create(user.id, dto);
  }

  @Get('mine')
  mine(@CurrentUser() user: AuthUser) {
    return this.bookings.mine(user.id);
  }

  @Get('for-provider')
  forProvider(@CurrentUser() user: AuthUser) {
    return this.bookings.forProvider(user.id);
  }

  @Get(':id')
  get(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.bookings.get(id, user.id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @CurrentUser() user: AuthUser,
    @Body() dto: UpdateBookingDto,
  ) {
    return this.bookings.updateStatus(id, user.id, dto);
  }
}
