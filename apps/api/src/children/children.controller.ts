import { Controller, Post, Get, Put, Delete, Body, Param } from '@nestjs/common';
import { ChildrenService } from './children.service';
import { CreateChildDto } from './dto/create-child.dto';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserRole } from '@prisma/client';

@Roles(UserRole.PARENT)
@Controller('children')
export class ChildrenController {
  constructor(private readonly childrenService: ChildrenService) {}

  @Post()
  async createChild(@Body() dto: CreateChildDto, @CurrentUser('id') parentId: string) {
    return this.childrenService.createChild(parentId, dto);
  }

  @Get()
  async getMyChildren(@CurrentUser('id') parentId: string) {
    return this.childrenService.getChildrenByParent(parentId);
  }

  @Put(':id')
  async updateChild(
    @Param('id') childId: string,
    @CurrentUser('id') parentId: string,
    @Body() dto: CreateChildDto,
  ) {
    return this.childrenService.updateChild(childId, parentId, dto);
  }

  @Delete(':id')
  async deleteChild(
    @Param('id') childId: string,
    @CurrentUser('id') parentId: string,
  ) {
    return this.childrenService.deleteChild(childId, parentId);
  }
}
