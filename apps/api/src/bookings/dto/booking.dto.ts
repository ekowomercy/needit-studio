import {
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';
import type { BookingStatus } from '@needit/shared';

export class CreateBookingDto {
  @IsString()
  @IsNotEmpty()
  providerId!: string;

  @IsOptional()
  @IsString()
  listingId?: string;

  @IsOptional()
  @IsString()
  needRequestId?: string;

  @IsOptional()
  @IsIn(['booking', 'order', 'request_fill'])
  type?: 'booking' | 'order' | 'request_fill';

  @IsOptional()
  @IsString()
  scheduledAt?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  quoteKobo?: number;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string;
}

export class UpdateBookingDto {
  @IsIn(['confirmed', 'in_progress', 'completed', 'cancelled'])
  status!: BookingStatus;

  @IsOptional()
  @IsInt()
  @Min(0)
  quoteKobo?: number;

  @IsOptional()
  @IsString()
  scheduledAt?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string;
}
