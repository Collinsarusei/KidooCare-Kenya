import { Controller, Get, Param } from '@nestjs/common';
import { BalancesService } from './balances.service';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserRole } from '@prisma/client';

@Controller()
export class BalancesController {
  constructor(private readonly balancesService: BalancesService) {}

  @Roles(UserRole.PARENT)
  @Get('balances/my')
  async getMyLedger(@CurrentUser('id') parentId: string) {
    return this.balancesService.getParentLedger(parentId);
  }

  @Roles(UserRole.ADMIN, UserRole.SCHOOL)
  @Get('schools/:schoolId/balances')
  async getSchoolFinancialOverview(@Param('schoolId') schoolId: string, @CurrentUser() user: any) {
    return this.balancesService.getSchoolFinancialOverview(schoolId, user.id, user.role);
  }
}
