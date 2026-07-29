import { Controller, Get, Param, Query } from '@nestjs/common';
import { SchoolsService } from './schools.service';
import { Public } from '../auth/decorators/public.decorator';

@Controller('public/schools')
export class PublicSchoolsController {
  constructor(private readonly schoolsService: SchoolsService) {}

  @Public()
  @Get()
  async getPublicSchools(
    @Query('search') search?: string,
    @Query('location') location?: string,
  ) {
    return this.schoolsService.getPublicSchoolsList(search, location);
  }

  @Public()
  @Get(':id')
  async getPublicSchoolDetail(@Param('id') id: string) {
    return this.schoolsService.getPublicSchoolDetail(id);
  }
}
