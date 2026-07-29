import { Controller, Post, Get, Put, Delete, Param, Body } from '@nestjs/common';
import { ServicesService } from './services.service';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';
import { Public } from '../auth/decorators/public.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserRole } from '@prisma/client';

@Controller()
export class ServicesController {
  constructor(private readonly servicesService: ServicesService) {}

  @Roles(UserRole.ADMIN, UserRole.SCHOOL)
  @Post('schools/:schoolId/services')
  async createService(
    @Param('schoolId') schoolId: string,
    @Body() dto: CreateServiceDto,
    @CurrentUser() user: any,
  ) {
    return this.servicesService.createService(schoolId, dto, user.id, user.role);
  }

  @Public()
  @Get('schools/:schoolId/services')
  async getServicesBySchool(@Param('schoolId') schoolId: string) {
    return this.servicesService.getServicesBySchool(schoolId);
  }

  @Public()
  @Get('services/:id')
  async getServiceById(@Param('id') id: string) {
    return this.servicesService.getServiceById(id);
  }

  @Roles(UserRole.ADMIN, UserRole.SCHOOL)
  @Put('services/:id')
  async updateService(
    @Param('id') id: string,
    @Body() dto: UpdateServiceDto,
    @CurrentUser() user: any,
  ) {
    return this.servicesService.updateService(id, dto, user.id, user.role);
  }

  @Roles(UserRole.ADMIN, UserRole.SCHOOL)
  @Delete('services/:id')
  async deleteService(@Param('id') id: string, @CurrentUser() user: any) {
    return this.servicesService.deleteService(id, user.id, user.role);
  }
}
