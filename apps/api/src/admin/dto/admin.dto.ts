import { IsIn } from 'class-validator';
import { UserRole } from '@needit/shared';

export class UpdateUserRoleDto {
  @IsIn([...UserRole])
  role!: UserRole;
}
