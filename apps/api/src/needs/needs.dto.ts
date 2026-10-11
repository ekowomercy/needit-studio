import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateNeedDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(1000)
  rawText: string;
}

export class RefineNeedDto {
  @IsOptional()
  @IsString()
  @MaxLength(500)
  text?: string;

  @IsOptional()
  @IsString()
  budget?: string;

  @IsOptional()
  @IsString()
  location?: string;
}

export class ContactNeedDto {
  @IsString()
  @IsNotEmpty()
  providerId!: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  message?: string;
}
