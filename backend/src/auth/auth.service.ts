import {
  Injectable,
  UnauthorizedException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import * as bcrypt from 'bcryptjs';
import { JwtService } from '@nestjs/jwt';
import { RoleName } from '@prisma/client';
import { randomBytes } from 'crypto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
  ) {}

  async register(dto: RegisterDto) {
    // Check for duplicate email (case-insensitive)
    const existingEmail = await this.prisma.user.findFirst({
      where: { email: { equals: dto.email, mode: 'insensitive' } },
    });
    if (existingEmail) {
      throw new ConflictException('Email already registered');
    }

    // Check for duplicate phone number
    const existingPhone = await this.prisma.user.findUnique({
      where: { phoneNumber: dto.phoneNumber },
    });
    if (existingPhone) {
      throw new ConflictException('Phone number already registered');
    }

    const role = await this.prisma.role.findFirst({
      where: { name: RoleName.USER },
    });
    if (!role) throw new Error('USER role missing');

    const passwordHash = await bcrypt.hash(dto.password, 10);
    const referralCode = `REF-${randomBytes(4).toString('hex').toUpperCase()}`;

    const referredBy = dto.referralCode
      ? await this.prisma.user.findFirst({
          where: { referralCode: dto.referralCode },
        })
      : null;

    // Store email in lowercase for consistency
    const user = await this.prisma.user.create({
      data: {
        email: dto.email.toLowerCase(),
        username: dto.username,
        phoneNumber: dto.phoneNumber,
        passwordHash,
        referralCode,
        roleId: role.id,
      },
    });

    await this.prisma.wallet.create({ data: { userId: user.id } });

    if (referredBy) {
      await this.prisma.referral.create({
        data: {
          referrerId: referredBy.id,
          referredUserId: user.id,
        },
      });
    }

    const tokens = await this.createTokens(user.id, user.email, RoleName.USER);
    await this.storeRefresh(user.id, tokens.refreshToken);
    return { user, ...tokens };
  }

  async login(dto: LoginDto) {
    // Check if identifier is an email or username
    const isEmail = dto.identifier.includes('@');

    let user;
    if (isEmail) {
      // Login with email (case-insensitive)
      user = await this.prisma.user.findFirst({
        where: { email: { equals: dto.identifier, mode: 'insensitive' } },
      });
    } else {
      // Login with username - find the first matching user
      // Since usernames can be duplicated, we find by username
      user = await this.prisma.user.findFirst({
        where: { username: dto.identifier },
      });
    }

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const valid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!valid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const role = await this.prisma.role.findUnique({
      where: { id: user.roleId },
    });

    const tokens = await this.createTokens(
      user.id,
      user.email,
      role?.name ?? RoleName.USER,
    );
    await this.storeRefresh(user.id, tokens.refreshToken);
    return { user, ...tokens };
  }

  async refresh(refreshToken: string) {
    try {
      // Verify the refresh token
      const payload = await this.jwt.verifyAsync(refreshToken, {
        secret: process.env.JWT_REFRESH_SECRET,
      });

      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
      });

      if (!user || !user.refreshTokenHash) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      // Verify the refresh token matches the stored hash
      const valid = await bcrypt.compare(refreshToken, user.refreshTokenHash);
      if (!valid) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      const role = await this.prisma.role.findUnique({
        where: { id: user.roleId },
      });

      // Generate new tokens
      const tokens = await this.createTokens(
        user.id,
        user.email,
        role?.name ?? RoleName.USER,
      );

      // Store the new refresh token hash
      await this.storeRefresh(user.id, tokens.refreshToken);

      return tokens;
    } catch (error) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }
  }

  async requestPasswordReset(identifier: string) {
    const isEmail = identifier.includes('@');

    const user = isEmail
      ? await this.prisma.user.findFirst({
          where: { email: { equals: identifier, mode: 'insensitive' } },
        })
      : await this.prisma.user.findFirst({
          where: { phoneNumber: identifier },
        });

    if (user) {
      await this.prisma.user.update({
        where: { id: user.id },
        data: { passwordResetRequestedAt: new Date() },
      });
    }

    return { success: true };
  }

  private async storeRefresh(userId: string, token: string) {
    const hash = await bcrypt.hash(token, 10);
    await this.prisma.user.update({
      where: { id: userId },
      data: { refreshTokenHash: hash },
    });
  }

  private async createTokens(sub: string, email: string, role: RoleName) {
    const payload = { sub, email, role: role as string };

    // Use proper time format strings for JWT expiry
    // Parse environment variables or use defaults
    const accessExpiry = this.parseExpiry(process.env.TOKEN_EXPIRY, '1h');
    const refreshExpiry = this.parseExpiry(
      process.env.REFRESH_TOKEN_EXPIRY,
      '7d',
    );

    const accessToken = await this.jwt.signAsync(payload, {
      secret: process.env.JWT_ACCESS_SECRET,
      expiresIn: accessExpiry,
    } as any);

    const refreshToken = await this.jwt.signAsync(payload, {
      secret: process.env.JWT_REFRESH_SECRET,
      expiresIn: refreshExpiry,
    } as any);

    return { accessToken, refreshToken };
  }

  // Helper to parse expiry - if it's a number, convert to seconds string
  private parseExpiry(value: string | undefined, defaultValue: string): string {
    if (!value) return defaultValue;

    // If it's already a string with time unit (e.g., '1h', '7d'), use as-is
    if (/^\d+[smhd]$/i.test(value)) {
      return value;
    }

    // If it's a plain number, treat as seconds
    const num = parseInt(value, 10);
    if (!isNaN(num)) {
      return `${num}s`;
    }

    return defaultValue;
  }
}
