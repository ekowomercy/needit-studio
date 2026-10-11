import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';
import type { ReportReason, ReportStatus } from '@needit/shared';

export class CreateReportDto {
  @IsIn(['provider', 'listing', 'user'])
  targetType!: 'provider' | 'listing' | 'user';

  @IsString()
  targetId!: string;

  @IsIn(['fraud', 'fake_product', 'misleading_listing', 'poor_conduct', 'suspicious_account'])
  reason!: ReportReason;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  detail?: string;
}

export class UpdateReportDto {
  @IsOptional()
  @IsIn(['open', 'resolved', 'dismissed'])
  status?: ReportStatus;
}
