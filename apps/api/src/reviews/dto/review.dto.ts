import { IsInt, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';

export class CreateReviewDto {
  @IsString()
  bookingId!: string;

  @IsInt()
  @Min(1)
  @Max(5)
  rating!: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  quality?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  communication?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  reliability?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  value?: number;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  comment?: string;
}
