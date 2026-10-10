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
  budget?: string;

  @IsOptional()
  @IsString()
  location?: string;
}
