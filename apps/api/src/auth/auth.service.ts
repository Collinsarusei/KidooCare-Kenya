import { Injectable, ConflictException, UnauthorizedException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { UserRole, SchoolStatus } from '@prisma/client';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async register(dto: RegisterDto) {
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase().trim() },
    });
    if (existing) {
      throw new ConflictException('User with this email already exists');
    }


    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(dto.password, saltRounds);

    const user = await this.prisma.user.create({
      data: {
        email: dto.email.toLowerCase().trim(),
        phone: dto.phone,
        role: UserRole.PARENT, // Public self-registration is strictly for PARENTS
        passwordHash,
        mustChangePassword: false,
      },
    });

    const tokens = await this.getTokens(user.id, user.email, user.role, user.phone);
    await this.updateRefreshTokenHash(user.id, tokens.refreshToken);

    const { passwordHash: _, refreshTokenHash: __, ...sanitizedUser } = user;

    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      user: sanitizedUser,
    };
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase().trim() },
      include: {
        school: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const isMatch = await bcrypt.compare(dto.password, user.passwordHash);
    if (!isMatch) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const tokens = await this.getTokens(user.id, user.email, user.role, user.phone);
    await this.updateRefreshTokenHash(user.id, tokens.refreshToken);

    const { passwordHash: _, refreshTokenHash: __, ...sanitizedUser } = user;

    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      user: sanitizedUser,
    };
  }

  async refreshTokens(refreshToken: string) {
    let payload: any;
    try {
      const secret = this.configService.get<string>('JWT_REFRESH_SECRET') || 'daycare-refresh-secret-key-2026';
      payload = this.jwtService.verify(refreshToken, { secret });
    } catch (e) {
      throw new ForbiddenException('Invalid or expired refresh token');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
    });

    if (!user || !user.refreshTokenHash) {
      throw new ForbiddenException('Access denied or user logged out');
    }

    const refreshTokenMatches = await bcrypt.compare(refreshToken, user.refreshTokenHash);
    if (!refreshTokenMatches) {
      throw new ForbiddenException('Invalid refresh token');
    }

    const tokens = await this.getTokens(user.id, user.email, user.role, user.phone);
    await this.updateRefreshTokenHash(user.id, tokens.refreshToken);

    return tokens;
  }

  async changePassword(userId: string, newPassword: string) {
    if (!newPassword || newPassword.length < 6) {
      throw new BadRequestException('Password must be at least 6 characters long');
    }
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(newPassword, saltRounds);

    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: {
        passwordHash,
        mustChangePassword: false,
      },
      include: { school: true },
    });

    const { passwordHash: _, refreshTokenHash: __, ...sanitizedUser } = updatedUser;
    return sanitizedUser;
  }

  async logout(userId: string) {
    await this.prisma.user.update({
      where: { id: userId },
      data: { refreshTokenHash: null },
    });
    return { message: 'Logged out successfully' };
  }

  async getMe(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        school: true,
      },
    });
    if (!user) {
      throw new UnauthorizedException('User not found');
    }
    const { passwordHash, refreshTokenHash, ...sanitizedUser } = user;
    return sanitizedUser;
  }

  private async updateRefreshTokenHash(userId: string, refreshToken: string) {
    const hash = await bcrypt.hash(refreshToken, 10);
    await this.prisma.user.update({
      where: { id: userId },
      data: { refreshTokenHash: hash },
    });
  }

  private async getTokens(userId: string, email: string, role: UserRole, phone: string) {
    const jwtPayload = {
      sub: userId,
      email,
      role,
      phone,
    };

    const accessSecret = this.configService.get<string>('JWT_SECRET') || 'daycare-super-secret-jwt-key-change-in-production-2026';
    const refreshSecret = this.configService.get<string>('JWT_REFRESH_SECRET') || 'daycare-refresh-secret-key-2026';

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(jwtPayload, {
        secret: accessSecret,
        expiresIn: '30m', // 30 minutes access token
      }),
      this.jwtService.signAsync(jwtPayload, {
        secret: refreshSecret,
        expiresIn: '7d', // 7 days refresh token
      }),
    ]);

    return {
      accessToken,
      refreshToken,
    };
  }
}
