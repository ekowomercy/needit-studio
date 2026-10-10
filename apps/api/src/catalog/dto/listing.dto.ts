import {
  IsArray,
  IsIn,
  IsInt,
  IsObject,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import type { Condition, ListingType, PriceType } from '@needit/shared';

export class CreateListingDto {
  @IsIn(['product', 'service'])
  listingType!: ListingType;

  @IsString()
  @MaxLength(200)
  title!: string;

  @IsOptional()
  @IsString()
  @MaxLength(5000)
  description?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  priceKobo?: number;

  @IsOptional()
  @IsIn(['starting', 'fixed', 'quote'])
  priceType?: PriceType;

  @IsOptional()
  @IsIn(['new', 'used', 'any'])
  condition?: Condition;

  @IsOptional()
  @IsArray()
  images?: string[];

  @IsOptional()
  @IsString()
  categoryId?: string;

  @IsOptional()
  @IsString()
  locationCity?: string;

  @IsOptional()
  @IsObject()
  delivery?: { localPickup: boolean; deliveryAvailable: boolean; deliveryCostKobo?: number | null };

  @IsOptional()
  @IsIn(['draft', 'active', 'paused'])
  status?: 'draft' | 'active' | 'paused';
}

export class UpdateListingDto extends CreateListingDto {}

export class ListListingsDto {
  @IsOptional()
  @Type(() => String)
  q?: string;

  @IsOptional()
  @Type(() => String)
  type?: string;

  @IsOptional()
  @Type(() => String)
  categorySlug?: string;

  @IsOptional()
  @Type(() => String)
  city?: string;

  @IsOptional()
  @Type(() => String)
  status?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  pageSize?: number;
}