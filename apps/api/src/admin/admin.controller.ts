import { Body, Controller, Get, Param, Patch, UseGuards } from '@nestjs/common';
import { AdminService } from './admin.service';
import { AdminGuard } from '../common/admin.guard';
import { AuthGuard } from '../auth/auth.guard';
import { UpdateUserRoleDto } from './dto/admin.dto';

@UseGuards(AuthGuard, AdminGuard)
@Controller('admin')
export class AdminController {
  constructor(private readonly admin: AdminService) {}

  @Get('users')
  listUsers() {
    return this.admin.listUsers();
  }

  @Patch('users/:id/role')
  setRole(@Param('id') id: string, @Body() dto: UpdateUserRoleDto) {
    return this.admin.setRole(id, dto.role);
  }
}
