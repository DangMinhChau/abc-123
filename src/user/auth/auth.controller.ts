import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiExtraModels,
  ApiOkResponse,
  getSchemaPath,
} from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from 'src/common/guards';
import { GetUserId, GetUser } from 'src/common/decorators';
import { BaseResponseDto } from 'src/common/dto/base-response.dto';
import { User } from '../users/entities/user.entity';
import { plainToInstance } from 'class-transformer';
import {
  // Request DTOs
  RegisterDto,
  LoginDto,
  RefreshTokenDto,
  ForgotPasswordDto,
  ResetPasswordDto,
  ChangePasswordDto,
  VerifyEmailDto, // Response DTOs
  AuthResponseDto,
  RegisterResponseDto,
  AuthUserResponseDto,
  TokenResponseDto,
  RefreshTokenResponseDto,
  VerifyTokenResponseDto,
} from './dto';

@ApiTags('Authentication')
@Controller('auth')
@ApiExtraModels(
  BaseResponseDto,
  AuthResponseDto,
  RegisterResponseDto,
  AuthUserResponseDto,
  TokenResponseDto,
  RefreshTokenResponseDto,
  VerifyTokenResponseDto,
  RegisterDto,
  LoginDto,
  RefreshTokenDto,
  ForgotPasswordDto,
  ResetPasswordDto,
  ChangePasswordDto,
  VerifyEmailDto,
)
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @ApiOperation({ summary: 'Đăng ký tài khoản mới' })
  @HttpCode(HttpStatus.CREATED)
  @ApiOkResponse({
    schema: {
      allOf: [
        { $ref: getSchemaPath(BaseResponseDto) },
        {
          properties: {
            data: { $ref: getSchemaPath(RegisterResponseDto) },
          },
        },
      ],
    },
  })
  async register(
    @Body() registerDto: RegisterDto,
  ): Promise<BaseResponseDto<RegisterResponseDto>> {
    const result = await this.authService.register(registerDto);
    return {
      message:
        'Đăng ký tài khoản thành công. Vui lòng kiểm tra email để xác thực tài khoản.',
      data: result,
      meta: {
        timestamp: new Date().toISOString(),
      },
    };
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Đăng nhập' })
  @ApiOkResponse({
    schema: {
      allOf: [
        { $ref: getSchemaPath(BaseResponseDto) },
        {
          properties: {
            data: { $ref: getSchemaPath(AuthResponseDto) },
          },
        },
      ],
    },
  })
  async login(
    @Body() loginDto: LoginDto,
  ): Promise<BaseResponseDto<AuthResponseDto>> {
    const result = await this.authService.login(loginDto);
    return {
      message: 'Đăng nhập thành công',
      data: result,
      meta: {
        timestamp: new Date().toISOString(),
      },
    };
  }
  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Đăng xuất' })
  @ApiOkResponse({
    schema: {
      allOf: [
        { $ref: getSchemaPath(BaseResponseDto) },
        {
          properties: {
            data: { type: 'null' },
          },
        },
      ],
    },
  })
  async logout(@GetUserId() userId: string): Promise<BaseResponseDto<null>> {
    await this.authService.logout(userId);
    return {
      message: 'Đăng xuất thành công',
      data: null,
      meta: {
        timestamp: new Date().toISOString(),
      },
    };
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Làm mới token' })
  @ApiOkResponse({
    schema: {
      allOf: [
        { $ref: getSchemaPath(BaseResponseDto) },
        {
          properties: {
            data: { $ref: getSchemaPath(RefreshTokenResponseDto) },
          },
        },
      ],
    },
  })
  async refresh(
    @Body() refreshTokenDto: RefreshTokenDto,
  ): Promise<BaseResponseDto<RefreshTokenResponseDto>> {
    const result = await this.authService.refresh(refreshTokenDto.refreshToken);
    return {
      message: 'Token được làm mới thành công',
      data: result,
      meta: {
        timestamp: new Date().toISOString(),
      },
    };
  }

  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Quên mật khẩu - Gửi email reset' })
  @ApiOkResponse({
    schema: {
      allOf: [
        { $ref: getSchemaPath(BaseResponseDto) },
        {
          properties: {
            data: { type: 'null' },
          },
        },
      ],
    },
  })
  async forgotPassword(
    @Body() forgotPasswordDto: ForgotPasswordDto,
  ): Promise<BaseResponseDto<null>> {
    await this.authService.forgotPassword(forgotPasswordDto);
    return {
      message: 'Email reset mật khẩu đã được gửi',
      data: null,
      meta: {
        timestamp: new Date().toISOString(),
      },
    };
  }

  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Đặt lại mật khẩu mới' })
  @ApiOkResponse({
    schema: {
      allOf: [
        { $ref: getSchemaPath(BaseResponseDto) },
        {
          properties: {
            data: { type: 'null' },
          },
        },
      ],
    },
  })
  async resetPassword(
    @Body() resetPasswordDto: ResetPasswordDto,
  ): Promise<BaseResponseDto<null>> {
    await this.authService.resetPassword(resetPasswordDto);
    return {
      message: 'Mật khẩu đã được đặt lại thành công',
      data: null,
      meta: {
        timestamp: new Date().toISOString(),
      },
    };
  }

  @Post('verify-email')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Xác thực email' })
  @ApiOkResponse({
    schema: {
      allOf: [
        { $ref: getSchemaPath(BaseResponseDto) },
        {
          properties: {
            data: { type: 'null' },
          },
        },
      ],
    },
  })
  async verifyEmail(
    @Body() verifyEmailDto: VerifyEmailDto,
  ): Promise<BaseResponseDto<AuthResponseDto | null>> {
    const result = await this.authService.verifyEmail(verifyEmailDto);
    return {
      message: 'Email đã được xác thực thành công',
      data: result.authData || null,
      meta: {
        timestamp: new Date().toISOString(),
      },
    };
  }
  @Post('resend-verification-email')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Gửi lại email xác thực' })
  @ApiOkResponse({
    schema: {
      allOf: [
        { $ref: getSchemaPath(BaseResponseDto) },
        {
          properties: {
            data: { type: 'null' },
          },
        },
      ],
    },
  })

  // Use @GetUser() when you need user data to avoid additional service calls
  async resendVerificationEmail(
    @GetUser() user: User,
  ): Promise<BaseResponseDto<null>> {
    // Use the full user object instead of calling getMe()
    await this.authService.resendVerificationEmail({ email: user.email });
    return {
      message: 'Email xác thực đã được gửi lại',
      data: null,
      meta: {
        timestamp: new Date().toISOString(),
      },
    };
  }
  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Lấy thông tin người dùng hiện tại' })
  @ApiOkResponse({
    schema: {
      allOf: [
        { $ref: getSchemaPath(BaseResponseDto) },
        {
          properties: {
            data: { $ref: getSchemaPath(AuthUserResponseDto) },
          },
        },
      ],
    },
  })
  // Use @GetUser() when you need full user data to avoid additional DB calls
  getMe(@GetUser() user: User): BaseResponseDto<AuthUserResponseDto> {
    // Transform the user entity to response DTO directly
    return {
      message: 'Thông tin người dùng',
      data: plainToInstance(AuthUserResponseDto, user),
      meta: {
        timestamp: new Date().toISOString(),
      },
    };
  }
  @Get('verify-token')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Xác thực tính hợp lệ của token' })
  @ApiOkResponse({
    schema: {
      allOf: [
        { $ref: getSchemaPath(BaseResponseDto) },
        {
          properties: {
            data: { $ref: getSchemaPath(VerifyTokenResponseDto) },
          },
        },
      ],
    },
  })
  async verifyToken(
    @GetUserId() userId: string,
  ): Promise<BaseResponseDto<VerifyTokenResponseDto>> {
    const result = await this.authService.verifyToken(userId);
    return {
      message: 'Token hợp lệ',
      data: result,
      meta: {
        timestamp: new Date().toISOString(),
      },
    };
  }
  @Patch('change-password')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Thay đổi mật khẩu' })
  @ApiOkResponse({
    schema: {
      allOf: [
        { $ref: getSchemaPath(BaseResponseDto) },
        {
          properties: {
            data: { type: 'null' },
          },
        },
      ],
    },
  })
  async changePassword(
    @GetUserId() userId: string,
    @Body() changePasswordDto: ChangePasswordDto,
  ): Promise<BaseResponseDto<null>> {
    await this.authService.changePassword(userId, changePasswordDto);
    return {
      message: 'Mật khẩu đã được thay đổi thành công',
      data: null,
      meta: {
        timestamp: new Date().toISOString(),
      },
    };
  }
}
