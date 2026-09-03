import { Controller, Post, Get, Patch, Body, Param, Req } from '@nestjs/common';
import { DisputesService } from './disputes.service';
import { CreateDisputeDto } from './dto/create-dispute.dto';
import { ResolveDisputeDto } from './dto/resolve-dispute.dto';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

@Controller('disputes')
export class DisputesController {
  constructor(private readonly disputesService: DisputesService) {}

  @Roles(UserRole.PARENT)
  @Post()
  async createDispute(@Req() req: any, @Body() dto: CreateDisputeDto) {
    return this.disputesService.createDispute(req.user.id, dto);
  }

  @Roles(UserRole.PARENT)
  @Get('my')
  async getMyDisputes(@Req() req: any) {
    return this.disputesService.getParentDisputes(req.user.id);
  }

  @Roles(UserRole.ADMIN)
  @Get('admin')
  async getAdminDisputes() {
    return this.disputesService.getAdminDisputes();
  }

  @Roles(UserRole.SCHOOL)
  @Get('school')
  async getSchoolDisputes(@Req() req: any) {
    return this.disputesService.getSchoolDisputes(req.user.id);
  }

  @Roles(UserRole.ADMIN, UserRole.SCHOOL)
  @Patch(':id/resolve')
  async resolveDispute(
    @Param('id') disputeId: string,
    @Req() req: any,
    @Body() dto: ResolveDisputeDto,
  ) {
    return this.disputesService.resolveDispute(disputeId, req.user.id, dto);
  }

  @Roles(UserRole.PARENT)
  @Patch(':id/escalate')
  async escalateDispute(
    @Param('id') disputeId: string,
    @Req() req: any,
  ) {
    return this.disputesService.escalateDispute(disputeId, req.user.id);
  }
}
