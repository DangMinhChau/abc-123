import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  NotFoundException,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { plainToInstance } from 'class-transformer';
import * as crypto from 'crypto';

import { User } from '../users/entities/user.entity';
import { UserToken } from '../tokens/entities/token.entity';
import { MailService } from 'src/common/services/mail/mail.service';

// Request DTOs
import { RegisterDto } from './dto/requests/register.dto';
import { LoginDto } from './dto/requests/login.dto';
import { RefreshTokenDto } from './dto/requests/refresh-token.dto';
import { ForgotPasswordDto } from './dto/requests/forgot-password.dto';
import { ResetPasswordDto } from './dto/requests/reset-password.dto';
import { ChangePasswordDto } from './dto/requests/change-password.dto';
import { VerifyEmailDto } from './dto/requests/verify-email.dto';
import { ResendVerificationEmailDto } from './dto/requests/resend-verification-email.dto';

// Response DTOs
import {
  AuthResponseDto,
  RegisterResponseDto,
  RefreshTokenResponseDto,
  AuthUserResponseDto,
  VerifyTokenResponseDto,
} from './dto/responses';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(UserToken)
    private readonly tokenRepository: Repository<UserToken>,
    private readonly jwtService: JwtService,
    private readonly emailService: MailService,
    private readonly configService: ConfigService,
    private readonly dataSource: DataSource,
  ) {}
  async register(registerDto: RegisterDto): Promise<RegisterResponseDto> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const { email, password, fullName } = registerDto;

      // Check if user already exists
      const existingUser = await this.userRepository.findOne({
        where: { email: email.toLowerCase().trim() },
      });

      if (existingUser) {
        throw new ConflictException('Email đã được sử dụng');
      }

      // Create user without email verification
      const user = this.userRepository.create({
        email: email.toLowerCase().trim(),
        password,
        fullName: fullName.trim(),
        phoneNumber: registerDto.phoneNumber?.trim(),
        isEmailVerified: false,
        isActive: true,
      });

      const savedUser = await queryRunner.manager.save(user);

      // Generate email verification token
      const verificationToken = this.generateSecureToken();
      const tokenExpiry = new Date();
      tokenExpiry.setHours(tokenExpiry.getHours() + 24); // 24 hours

      const emailToken = queryRunner.manager.create(UserToken, {
        user: savedUser,
        token: verificationToken,
        type: 'EMAIL_VERIFICATION',
        expiresAt: tokenExpiry,
        isActive: true,
      });
      await queryRunner.manager.save(emailToken);

      // Don't generate tokens for unverified users
      // User must verify email before getting access tokens
      await queryRunner.commitTransaction();

      // Send verification email (outside transaction)
      try {
        await this.emailService.sendVerificationEmail(
          savedUser.email,
          savedUser.fullName,
          verificationToken,
        );
      } catch (emailError) {
        this.logger.error('Failed to send verification email:', emailError);
        // Don't throw here - user is created successfully
      }

      // Return response without access tokens - user must verify email first
      return {
        user: plainToInstance(AuthUserResponseDto, savedUser),
        accessToken: null, // No access token until verified
        refreshToken: null, // No refresh token until verified
        expiresIn: 0,
        tokenType: 'Bearer',
        requiresEmailVerification: true,
      };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      this.logger.error('Registration failed:', error);

      if (error instanceof ConflictException) {
        throw error;
      }

      throw new InternalServerErrorException(
        'Đăng ký thất bại. Vui lòng thử lại.',
      );
    } finally {
      await queryRunner.release();
    }
  }

  async login(loginDto: LoginDto): Promise<AuthResponseDto> {
    try {
      const { email, password } = loginDto;

      const user = await this.userRepository.findOne({
        where: { email: email.toLowerCase().trim(), isActive: true },
        select: [
          'id',
          'email',
          'password',
          'fullName',
          'role',
          'isEmailVerified',
          'isActive',
          'phoneNumber',
          'createdAt',
          'updatedAt',
        ],
      });
      if (!user || !(await user.comparePassword(password))) {
        throw new UnauthorizedException('Email hoặc mật khẩu không đúng');
      }

      // Check if email is verified
      if (!user.isEmailVerified) {
        throw new UnauthorizedException(
          'Tài khoản chưa được xác minh. Vui lòng kiểm tra email và xác minh tài khoản trước khi đăng nhập.',
        );
      }

      const { accessToken, refreshToken } = await this.generateTokens(user);
      return {
        user: plainToInstance(AuthUserResponseDto, user),
        accessToken,
        refreshToken,
        expiresIn: 3600,
        tokenType: 'Bearer',
      };
    } catch (error) {
      this.logger.error('Login failed:', error);
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      throw new InternalServerErrorException(
        'Đăng nhập thất bại. Vui lòng thử lại.',
      );
    }
  }

  async logout(userId: string): Promise<{ success: boolean }> {
    try {
      await this.tokenRepository.update(
        { user: { id: userId }, type: 'REFRESH_TOKEN', isActive: true },
        { isActive: false },
      );
      return { success: true };
    } catch (error) {
      this.logger.error('Logout failed:', error);
      throw new InternalServerErrorException(
        'Đăng xuất thất bại. Vui lòng thử lại.',
      );
    }
  }
  async refreshToken(
    refreshTokenDto: RefreshTokenDto,
  ): Promise<RefreshTokenResponseDto> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    let isTransactionActive = true;

    try {
      const { refreshToken } = refreshTokenDto;

      const tokenRecord = await this.tokenRepository.findOne({
        where: { token: refreshToken, type: 'REFRESH_TOKEN', isActive: true },
        relations: ['user'],
      });

      if (!tokenRecord || tokenRecord.expiresAt < new Date()) {
        await queryRunner.rollbackTransaction();
        isTransactionActive = false;
        throw new UnauthorizedException('Refresh token không hợp lệ');
      }

      // Generate new tokens
      const payload = {
        sub: tokenRecord.user.id,
        email: tokenRecord.user.email,
        role: tokenRecord.user.role,
      };

      const accessToken = this.jwtService.sign(payload, {
        expiresIn: this.configService.get<string>(
          'JWT_ACCESS_TOKEN_EXPIRES_IN',
          '15m',
        ),
      });

      const refreshTokenPayload = { sub: tokenRecord.user.id, type: 'refresh' };
      const newRefreshToken = this.jwtService.sign(refreshTokenPayload, {
        expiresIn: this.configService.get<string>(
          'JWT_REFRESH_TOKEN_EXPIRES_IN',
          '7d',
        ),
      });

      // Deactivate old refresh token
      await queryRunner.manager.update(UserToken, tokenRecord.id, {
        isActive: false,
      });

      // Save new refresh token to database
      const tokenExpiry = new Date();
      tokenExpiry.setDate(tokenExpiry.getDate() + 7);

      const newRefreshTokenRecord = queryRunner.manager.create(UserToken, {
        user: tokenRecord.user,
        token: newRefreshToken,
        type: 'REFRESH_TOKEN',
        expiresAt: tokenExpiry,
        isActive: true,
      });

      await queryRunner.manager.save(newRefreshTokenRecord);
      await queryRunner.commitTransaction();
      isTransactionActive = false;

      return {
        accessToken,
        refreshToken: newRefreshToken,
        expiresIn: 3600,
        tokenType: 'Bearer',
        user: plainToInstance(AuthUserResponseDto, tokenRecord.user),
      };
    } catch (error) {
      if (isTransactionActive) {
        try {
          await queryRunner.rollbackTransaction();
        } catch (rollbackError) {
          this.logger.error('Failed to rollback transaction:', rollbackError);
        }
      }

      this.logger.error('Token refresh failed:', error);
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      throw new InternalServerErrorException(
        'Làm mới token thất bại. Vui lòng đăng nhập lại.',
      );
    } finally {
      await queryRunner.release();
    }
  }
  async getMe(userId: string): Promise<AuthUserResponseDto> {
    const user = await this.userRepository.findOne({
      where: { id: userId, isActive: true },
    });

    if (!user) {
      throw new NotFoundException('Người dùng không tồn tại');
    }

    return plainToInstance(AuthUserResponseDto, user);
  }

  async verifyToken(userId: string): Promise<VerifyTokenResponseDto> {
    const user = await this.userRepository.findOne({
      where: { id: userId, isActive: true },
      select: ['id', 'email', 'role'],
    });

    if (!user) {
      throw new NotFoundException('Người dùng không tồn tại');
    }

    return {
      userId: user.id,
      email: user.email,
      role: user.role,
      isValid: true,
      expiresAt: Math.floor(Date.now() / 1000) + 3600, // Current time + 1 hour
    };
  }

  async refresh(refreshToken: string): Promise<RefreshTokenResponseDto> {
    return this.refreshToken({ refreshToken });
  }

  // Validation methods for strategies
  async validateUser(
    email: string,
    password: string,
  ): Promise<Omit<User, 'password'> | null> {
    const user = await this.userRepository.findOne({
      where: { email: email.toLowerCase().trim(), isActive: true },
      select: [
        'id',
        'email',
        'password',
        'fullName',
        'role',
        'isEmailVerified',
        'isActive',
      ],
    });

    if (user && (await user.comparePassword(password))) {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { password, ...result } = user;
      return result as Omit<User, 'password'>;
    }
    return null;
  }

  async validateUserById(userId: string): Promise<User | null> {
    return this.userRepository.findOne({
      where: { id: userId, isActive: true },
    });
  }

  // Password recovery methods
  async forgotPassword(
    forgotPasswordDto: ForgotPasswordDto,
  ): Promise<{ success: boolean }> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const { email } = forgotPasswordDto;

      const user = await this.userRepository.findOne({
        where: { email: email.toLowerCase().trim(), isActive: true },
      });

      if (!user) {
        // Return success even if user doesn't exist for security
        await queryRunner.rollbackTransaction();
        return { success: true };
      }

      // Deactivate any existing password reset tokens
      await queryRunner.manager.update(
        UserToken,
        { user: { id: user.id }, type: 'PASSWORD_RESET', isActive: true },
        { isActive: false },
      );

      // Generate password reset token
      const resetToken = this.generateSecureToken();
      const tokenExpiry = new Date();
      tokenExpiry.setHours(tokenExpiry.getHours() + 1); // 1 hour

      const passwordResetToken = queryRunner.manager.create(UserToken, {
        user,
        token: resetToken,
        type: 'PASSWORD_RESET',
        expiresAt: tokenExpiry,
        isActive: true,
      });

      await queryRunner.manager.save(passwordResetToken);
      await queryRunner.commitTransaction();

      // Send password reset email (outside transaction)
      try {
        await this.emailService.sendPasswordResetEmail(
          user.email,
          user.fullName,
          resetToken,
        );
      } catch (emailError) {
        this.logger.error('Failed to send password reset email:', emailError);
        // Don't throw here - token is created successfully
      }

      return { success: true };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      this.logger.error('Forgot password failed:', error);
      throw new InternalServerErrorException(
        'Đã xảy ra lỗi. Vui lòng thử lại.',
      );
    } finally {
      await queryRunner.release();
    }
  }

  async resetPassword(
    resetPasswordDto: ResetPasswordDto,
  ): Promise<{ success: boolean }> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const { token, newPassword } = resetPasswordDto;

      // Find and validate reset token
      const tokenRecord = await this.tokenRepository.findOne({
        where: { token, type: 'PASSWORD_RESET', isActive: true },
        relations: ['user'],
      });

      if (!tokenRecord || tokenRecord.expiresAt < new Date()) {
        throw new UnauthorizedException('Token không hợp lệ hoặc đã hết hạn');
      }

      // Update password
      await queryRunner.manager.update(User, tokenRecord.user.id, {
        password: newPassword,
      });

      // Deactivate the reset token
      await queryRunner.manager.update(UserToken, tokenRecord.id, {
        isActive: false,
      });

      // Deactivate all refresh tokens to force re-login
      await queryRunner.manager.update(
        UserToken,
        {
          user: { id: tokenRecord.user.id },
          type: 'REFRESH_TOKEN',
          isActive: true,
        },
        { isActive: false },
      );

      await queryRunner.commitTransaction();

      return { success: true };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      this.logger.error('Reset password failed:', error);

      if (error instanceof UnauthorizedException) {
        throw error;
      }

      throw new InternalServerErrorException(
        'Đã xảy ra lỗi. Vui lòng thử lại.',
      );
    } finally {
      await queryRunner.release();
    }
  }
  async changePassword(
    userId: string,
    changePasswordDto: ChangePasswordDto,
  ): Promise<{ success: boolean }> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const { currentPassword, newPassword } = changePasswordDto;

      const user = await this.userRepository.findOne({
        where: { id: userId, isActive: true },
        select: ['id', 'password'],
      });

      if (!user) {
        throw new NotFoundException('Người dùng không tồn tại');
      }

      // Check if the old password matches
      if (!(await user.comparePassword(currentPassword))) {
        throw new UnauthorizedException('Mật khẩu cũ không đúng');
      }

      // Update the password
      await queryRunner.manager.update(User, userId, { password: newPassword });

      // Deactivate all refresh tokens to force re-login for security
      await queryRunner.manager.update(
        UserToken,
        { user: { id: userId }, type: 'REFRESH_TOKEN', isActive: true },
        { isActive: false },
      );

      await queryRunner.commitTransaction();

      return { success: true };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      this.logger.error('Change password failed:', error);

      if (
        error instanceof NotFoundException ||
        error instanceof UnauthorizedException
      ) {
        throw error;
      }

      throw new InternalServerErrorException(
        'Đã xảy ra lỗi. Vui lòng thử lại.',
      );
    } finally {
      await queryRunner.release();
    }
  }
  async verifyEmail(
    verifyEmailDto: VerifyEmailDto,
  ): Promise<{ success: boolean; authData?: AuthResponseDto }> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const { token } = verifyEmailDto;

      // Find and validate verification token
      const tokenRecord = await this.tokenRepository.findOne({
        where: { token, type: 'EMAIL_VERIFICATION', isActive: true },
        relations: ['user'],
      });

      if (!tokenRecord || tokenRecord.expiresAt < new Date()) {
        throw new UnauthorizedException(
          'Token xác thực không hợp lệ hoặc đã hết hạn',
        );
      }

      if (tokenRecord.user.isEmailVerified) {
        throw new UnauthorizedException('Email đã được xác thực trước đó');
      }

      // Update user email verification status
      await queryRunner.manager.update(User, tokenRecord.user.id, {
        isEmailVerified: true,
      });

      // Deactivate the verification token
      await queryRunner.manager.update(UserToken, tokenRecord.id, {
        isActive: false,
      });
      await queryRunner.commitTransaction();

      // Send welcome email (outside transaction)
      try {
        await this.emailService.sendWelcomeEmail(
          tokenRecord.user.email,
          tokenRecord.user.fullName,
        );
      } catch (emailError) {
        this.logger.error('Failed to send welcome email:', emailError);
        // Don't throw here - verification is successful
      }

      // Generate access tokens for the newly verified user
      const { accessToken, refreshToken } = await this.generateTokens(
        tokenRecord.user,
      );

      // Save the refresh token
      const refreshTokenEntity = this.tokenRepository.create({
        user: tokenRecord.user,
        token: refreshToken,
        type: 'REFRESH_TOKEN',
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
        isActive: true,
      });
      await this.tokenRepository.save(refreshTokenEntity);

      return {
        success: true,
        authData: {
          user: plainToInstance(AuthUserResponseDto, tokenRecord.user),
          accessToken,
          refreshToken,
          expiresIn: 3600,
          tokenType: 'Bearer',
        },
      };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      this.logger.error('Email verification failed:', error);

      if (error instanceof UnauthorizedException) {
        throw error;
      }

      throw new InternalServerErrorException(
        'Đã xảy ra lỗi. Vui lòng thử lại.',
      );
    } finally {
      await queryRunner.release();
    }
  }
  async resendVerificationEmail(
    resendVerificationEmailDto: ResendVerificationEmailDto,
  ): Promise<{ success: boolean }> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const { email } = resendVerificationEmailDto;

      const user = await this.userRepository.findOne({
        where: { email: email.toLowerCase().trim(), isActive: true },
      });

      if (!user) {
        throw new NotFoundException('Người dùng không tồn tại');
      }

      if (user.isEmailVerified) {
        throw new UnauthorizedException('Email đã được xác thực');
      }

      // Deactivate any existing verification tokens
      await queryRunner.manager.update(
        UserToken,
        { user: { id: user.id }, type: 'EMAIL_VERIFICATION', isActive: true },
        { isActive: false },
      );

      // Generate new verification token
      const verificationToken = this.generateSecureToken();
      const tokenExpiry = new Date();
      tokenExpiry.setHours(tokenExpiry.getHours() + 24); // 24 hours

      const emailToken = queryRunner.manager.create(UserToken, {
        user,
        token: verificationToken,
        type: 'EMAIL_VERIFICATION',
        expiresAt: tokenExpiry,
        isActive: true,
      });

      await queryRunner.manager.save(emailToken);
      await queryRunner.commitTransaction();

      // Send verification email (outside transaction)
      try {
        await this.emailService.sendVerificationEmail(
          user.email,
          user.fullName,
          verificationToken,
        );
      } catch (emailError) {
        this.logger.error('Failed to resend verification email:', emailError);
        throw new InternalServerErrorException(
          'Gửi lại email xác thực thất bại. Vui lòng thử lại.',
        );
      }

      return { success: true };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      this.logger.error('Resend verification email failed:', error);

      if (
        error instanceof NotFoundException ||
        error instanceof UnauthorizedException ||
        error instanceof InternalServerErrorException
      ) {
        throw error;
      }

      throw new InternalServerErrorException(
        'Đã xảy ra lỗi. Vui lòng thử lại.',
      );
    } finally {
      await queryRunner.release();
    }
  }
  // Private methods
  private generateSecureToken(): string {
    return crypto.randomBytes(32).toString('hex');
  }
  private async generateTokens(
    user: User,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    const accessToken = this.jwtService.sign(payload, {
      expiresIn: this.configService.get<string>(
        'JWT_ACCESS_TOKEN_EXPIRES_IN',
        '60m',
      ),
    });

    const refreshTokenPayload = { sub: user.id, type: 'refresh' };
    const refreshToken = this.jwtService.sign(refreshTokenPayload, {
      expiresIn: this.configService.get<string>(
        'JWT_REFRESH_TOKEN_EXPIRES_IN',
        '7d',
      ),
    });

    // Save refresh token to database (single operation - no transaction needed)
    const tokenExpiry = new Date();
    tokenExpiry.setDate(tokenExpiry.getDate() + 7);

    const refreshTokenRecord = this.tokenRepository.create({
      user,
      token: refreshToken,
      type: 'REFRESH_TOKEN',
      expiresAt: tokenExpiry,
      isActive: true,
    });

    await this.tokenRepository.save(refreshTokenRecord);

    return { accessToken, refreshToken };
  }
}
