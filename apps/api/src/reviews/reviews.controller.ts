import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { ReviewsService } from './reviews.service';
import { CreateReviewDto } from './dto/review.dto';
import { AuthGuard } from '../auth/auth.guard';
import { CurrentUser } from '../common/current-user.decorator';
import type { AuthUser } from '../auth/auth.guard';
import { Public } from '../common/public.decorator';

@Controller()
export class ReviewsController {
  constructor(private readonly reviews: ReviewsService) {}

  @UseGuards(AuthGuard)
  @Post('reviews')
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateReviewDto) {
    return this.reviews.create(user.id, dto.bookingId, dto);
  }

  @Public()
  @Get('providers/:id/reviews')
  list(
    @Param('id') id: string,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ) {
    return this.reviews.forProvider(id, page ? parseInt(page, 10) : 1, pageSize ? parseInt(pageSize, 10) : 20);
  }
}
