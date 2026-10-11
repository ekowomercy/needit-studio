import {
  Body,
  Controller,
  Delete,
  Get,
  NotFoundException,
  Param,
  Patch,
  Post,
  Query,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { CatalogService } from './catalog.service';
import { CreateListingDto, ListListingsDto, UpdateListingDto } from './dto/listing.dto';
import { AuthGuard } from '../auth/auth.guard';
import { CurrentUser } from '../common/current-user.decorator';
import { ProviderGuard } from '../common/provider.guard';
import { Public } from '../common/public.decorator';
import type { AuthUser } from '../auth/auth.guard';

@Controller()
export class CatalogController {
  constructor(private readonly catalog: CatalogService) {}

  @Public()
  @Get('categories')
  categories() {
    return this.catalog.categories();
  }

  @Public()
  @Get('categories/tree')
  categoryTree() {
    return this.catalog.categoryTree();
  }

  @Public()
  @Get('listings')
  listings(@Query() query: ListListingsDto) {
    return this.catalog.listListings({
      q: query.q,
      type: query.type,
      categorySlug: query.categorySlug,
      city: query.city,
      status: query.status,
      page: query.page,
      pageSize: query.pageSize,
    });
  }

  @Public()
  @Get('listings/:id')
  async listing(@Param('id') id: string) {
    const listing = await this.catalog.getListing(id);
    if (!listing) throw new NotFoundException('Listing not found');
    return listing;
  }

  @UseGuards(AuthGuard, ProviderGuard)
  @Post('listings')
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateListingDto) {
    return this.catalog.createListing(user.id, dto);
  }

  @UseGuards(AuthGuard, ProviderGuard)
  @Patch('listings/:id')
  async update(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: UpdateListingDto,
  ) {
    const row = await this.catalog.updateListing(id, user.id, dto);
    if (!row) throw new UnauthorizedException('Not your listing');
    return row;
  }

  @UseGuards(AuthGuard, ProviderGuard)
  @Delete('listings/:id')
  async remove(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    const ok = await this.catalog.deleteListing(id, user.id);
    if (!ok) throw new UnauthorizedException('Not your listing');
    return { ok: true };
  }

  @Public()
  @Get('providers')
  providers(@Query() query: { q?: string; city?: string; page?: number; pageSize?: number }) {
    return this.catalog.providerProfiles(query);
  }

  @Public()
  @Get('providers/:id')
  async provider(@Param('id') id: string) {
    const profile = await this.catalog.providerProfile(id);
    if (!profile) throw new NotFoundException('Provider not found');
    return profile;
  }

  @Public()
  @Get('providers/:id/reviews')
  reviews(@Param('id') id: string, @Query() query: { page?: number; pageSize?: number }) {
    return this.catalog.listReviews(id, Number(query.page ?? 1), Number(query.pageSize ?? 20));
  }

  @Public()
  @Get('providers/:id/listings')
  providerListings(@Param('id') id: string) {
    return this.catalog.providerListings(id);
  }
}