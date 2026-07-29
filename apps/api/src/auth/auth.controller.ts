import { Controller, Post, Body, Get } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { Public } from './decorators/public.decorator';
import { CurrentUser } from './decorators/current-user.decorator';
import { Roles } from './decorators/roles.decorator';
import { UserRole } from '@prisma/client';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('register')
  async register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Public()
  @Post('login')
  async login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Public()
  @Post('refresh')
  async refreshTokens(@Body() dto: RefreshTokenDto) {
    return this.authService.refreshTokens(dto.refreshToken);
  }

  @Post('logout')
  async logout(@CurrentUser('id') userId: string) {
    return this.authService.logout(userId);
  }

  @Post('change-password')
  async changePassword(
    @CurrentUser('id') userId: string,
    @Body('newPassword') newPassword: string,
  ) {
    return this.authService.changePassword(userId, newPassword);
  }

  @Get('me')
  async getMe(@CurrentUser('id') userId: string) {
    return this.authService.getMe(userId);
  }

  @Roles(UserRole.ADMIN)
  @Get('admin-test')
  async adminTest(@CurrentUser() user: any) {
    return {
      message: 'Access granted to admin-only endpoint',
      user,
    };
  }
}
